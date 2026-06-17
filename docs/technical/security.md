# Security — Overview

> This document covers all active security protections in SafeSchool, organized by threat category.

---

## Authentication — JWT + Passport

### How it works

HTTP is stateless: the server has no memory of a client between requests. JWT solves this without storing a session server-side.

### Flow

```
1. POST /auth/login { email, password }
2. NestJS verifies the password (bcrypt)
3. NestJS generates a JWT token signed with JWT_SECRET
4. The frontend stores the token (localStorage)
5. All subsequent requests: Authorization: Bearer <token>
6. Passport verifies the signature → extracts { sub, email, role } → loads the user
```

### Why the JWT payload is readable but secure

A JWT has three parts: `header.payload.signature`. The payload is base64-encoded — anyone can decode it and read `{ sub: 42, email: "...", role: "student" }`. The security comes from the **signature**: generated with `JWT_SECRET` (known only to the server). If someone modifies the payload, the signature no longer matches — NestJS rejects the token.

Never put sensitive data in the payload (passwords, card numbers, etc.).

---

## Passwords — bcrypt

Passwords are **never** stored in plain text. bcrypt applies an irreversible hash with a random salt.

```typescript
// On account creation
const hash = await bcrypt.hash(password, 10); // 10 = cost factor (rounds)
// → stored in DB: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmKLCn..."

// On login
const isValid = await bcrypt.compare(submittedPassword, storedHash);
// → true or false, never the plain-text password
```

Even if the database is compromised, passwords remain inaccessible.

In TypeORM, the `password` column is marked `{ select: false }` — it is not returned by default `SELECT *` queries.

---

## Brute force — rate limiting

All API routes are rate-limited globally with `@nestjs/throttler`: `ThrottlerModule.forRoot` allows **20 requests per 60 seconds per IP**, enforced by a global `ThrottlerGuard`. Beyond the limit, the API returns `429 Too Many Requests`, which throttles automated password-guessing against `/auth/login`.

Failed logins are **additionally** logged as `WARN` events in the ELK stack, so a brute-force pattern is both blocked (429) and observable (Kibana).

---

## SQL Injection — TypeORM

SQL injection consists of embedding SQL inside a user-controlled field to manipulate the query:

```
email: "admin'--"  →  SELECT * FROM users WHERE email = 'admin'--' AND password = ...
                                                                    ^ everything after is ignored
```

TypeORM prevents this automatically via **bound parameters** (prepared statements):

```typescript
// TypeORM translates this into a parameterized query, never string concatenation
this.usersRepository.findOne({ where: { email } });
// → SELECT * FROM users WHERE email = $1  (email passed separately)
```

**Rule**: never build a SQL query with unsanitized variables. When using `createQueryBuilder`, always use `:param` notation:

```typescript
.where("LOWER(user.firstName) LIKE LOWER(:query)", { query: `%${query}%` })   // safe
.where(`LOWER(user.firstName) LIKE '%${query}%'`)                             // injection possible
```

---

## Input Validation — ValidationPipe + class-validator

All data coming from the client is untrusted. `ValidationPipe` (enabled in `main.ts`) automatically rejects requests whose body does not match the DTO.

```typescript
// create-report.dto.ts
export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsEnum(ReportType)
  type: ReportType;

  @IsBoolean()
  isAnonymous: boolean;
}
```

If the client sends an empty `title` or an invalid `type`, NestJS responds `400 Bad Request` before the request even reaches the service. Business logic never sees malformed data.

`whitelist: true` in the pipe configuration silently strips any fields not declared in the DTO — an attacker cannot inject unexpected properties.

---

## XSS (Cross-Site Scripting) — React

XSS: an attacker causes malicious JavaScript to execute in a victim's browser, typically by injecting `<script>alert('XSS')</script>` into a field displayed to other users.

**React automatically escapes** all content inserted into JSX:

```tsx
// If userName = "<script>alert('xss')</script>"
<p>{userName}</p>
// React renders plain text — the script is NOT executed
```

**Exception**: `dangerouslySetInnerHTML` disables this protection. Use only for controlled HTML content (e.g. server-side rendered markdown after sanitization).

---

## CSRF (Cross-Site Request Forgery) — JWT in headers

CSRF: a malicious site triggers a request to the API on behalf of an authenticated user.

This works with cookies (sent automatically by the browser to the target domain). **JWT tokens in Authorization headers are not sent automatically** — the page's JavaScript must explicitly add the header. A third-party site cannot access a token stored in localStorage from another domain (Same-Origin Policy).

By using `Authorization: Bearer <token>` (managed by the Axios interceptor), SafeSchool is naturally protected against CSRF.

---

## Environment Variables — credentials out of the codebase

No credentials (database password, JWT_SECRET, API key) ever appear in source code.

```
.env           ← real values, in .gitignore (never committed)
.env.example   ← empty keys, committed so the team knows what to fill in
```

If a credential is committed to git, it must be considered compromised — even after deletion, it remains in the git history.

Access in NestJS via `ConfigModule`: `process.env.JWT_SECRET`.

---

## HTTPS — subject requirement

Subject section III.3 requires:

> "Any connection to the backend, from a browser, from a script, from an external API, etc., must use HTTPS."

Without HTTPS, JWT tokens travel in plain text on the network — anyone in a MITM position (same WiFi network) can read them and impersonate the user.

HTTPS is handled by nginx (reverse proxy), which holds the TLS certificate. Internal services communicate over plain HTTP on the private Docker network — acceptable because that network is not reachable from outside.

---

## Summary — protection by layer

| Threat                       | Protection                         | Where                                                   |
| ---------------------------- | ---------------------------------- | ------------------------------------------------------- |
| Password stolen from DB      | bcrypt (irreversible hash + salt)  | `users.service.ts` (hash) / `auth.service.ts` (compare) |
| Forged JWT token             | HMAC signature (JWT_SECRET)        | `jwt.strategy.ts`                                       |
| Brute-force login            | Rate limiting (429) + WARN logging | `@nestjs/throttler` (global guard) + ELK                |
| SQL injection                | TypeORM bound parameters           | All DB queries                                          |
| Malformed input              | ValidationPipe + class-validator   | NestJS DTOs                                             |
| XSS                          | Automatic JSX escaping             | React (built-in)                                        |
| CSRF                         | JWT in headers (not cookies)       | Axios interceptor                                       |
| Exposed credentials          | Environment variables              | `.env` + `.gitignore`                                   |
| Network interception         | HTTPS via nginx                    | Infrastructure                                          |
| Unauthenticated route access | JwtAuthGuard                       | NestJS controllers                                      |
