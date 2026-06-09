# Backend Architecture — NestJS

## Overview

The SafeSchool backend is built with NestJS, a TypeScript framework that enforces a module-based architecture. Every feature is a self-contained module composed of the same four file types:

```
my-module/
  ├── my-module.module.ts      → module registry (imports, providers, exports)
  ├── my-module.controller.ts  → HTTP route handlers
  ├── my-module.service.ts     → business logic
  └── my-entity.entity.ts      → TypeORM entity (maps to a database table)
```

---

## Entry Point — `main.ts`

The application bootstrap does three things:

**1. Create the NestJS application**
```ts
const app = await NestFactory.create<NestExpressApplication>(AppModule);
```
`AppModule` is the root module that imports and connects all other modules.

**2. Configure CORS**
```ts
app.enableCors({ origin: process.env.FRONTEND_URL, ... })
```
Required because the frontend (Vite dev server) and the backend run on different ports. Without this, the browser's same-origin policy would block API calls.

In development, `http://localhost:5173` and `http://localhost:5000` are considered two different origins by the browser. `FRONTEND_URL` explicitly tells NestJS which frontend origin is allowed to call the API.

**3. Serve static files (avatars)**
```ts
app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' })
```
Uploaded avatar files are stored in `backend/uploads/avatars/`. This line tells the server to serve them directly when a request hits `/uploads/avatars/<filename>`.

---

## Root Module — `app.module.ts`

The root module wires the application together. Two key configurations happen here:

**Database connection (TypeORM)**
```ts
TypeOrmModule.forRoot({
  type: "postgres",
  entities: [__dirname + "/**/*.entity{.ts,.js}"],
  synchronize: true,
})
```
- `entities` — NestJS scans all `*.entity.ts` files automatically and creates the corresponding tables.
- `synchronize: true` — on startup, TypeORM compares entities against the real database and applies changes. Appropriate for development; should be replaced with migrations in production.

**Global HTTP logging middleware**
```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes("*");
  }
}
```
Every incoming HTTP request passes through `HttpLoggerMiddleware` before reaching any controller. This is where logs are sent to Logstash (ELK stack).

**Expected console output on startup**
```
[NestFactory] Starting Nest application...
[InstanceLoader] TypeOrmModule dependencies initialized
[InstanceLoader] AuthModule dependencies initialized
[InstanceLoader] ReportsModule dependencies initialized
[RoutesResolver] AuthController {/auth}
[RouterExplorer] Mapped {/auth/login, POST}
[RouterExplorer] Mapped {/auth/register, POST}
[RoutesResolver] ReportsController {/reports}
[RouterExplorer] Mapped {/reports, GET}
[RouterExplorer] Mapped {/reports, POST}
[NestApplication] Nest application successfully started on port 3000
```

---

## Authentication

### `user.entity.ts`
```ts
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ unique: true }) email: string;
  @Column({ select: false }) password: string;
  @Column({ type: "enum", enum: UserRole }) role: UserRole;
}
```
Key points:
- `@PrimaryGeneratedColumn("uuid")` — TypeORM generates a UUID for each new user automatically.
- `{ select: false }` on `password` — the password hash is never returned by default `SELECT` queries, even `SELECT *`.
- `UserRole` is a TypeScript enum that becomes a PostgreSQL enum in the database.

### `auth.service.ts` — login flow
```
POST /auth/login
  → AuthController.login()
  → AuthService.login()
    → UsersService.findByEmailWithProfile()   ← query the database
    → bcrypt.compare(password, hash)          ← verify the password
    → jwtService.sign(payload)                ← generate the token
  ← returns { access_token, user }
```
Passwords are never stored in plain text. `bcrypt.hash()` generates an irreversible hash on registration; `bcrypt.compare()` verifies the submitted password against the stored hash on login.

### `jwt.strategy.ts` — token verification
```ts
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload) {
    return this.usersService.findById(payload.sub);
  }
}
```
On every protected request:
1. NestJS reads the `Authorization: Bearer <token>` header
2. Verifies the signature against `JWT_SECRET`
3. Decodes the payload `{ sub, email, role }`
4. Calls `validate()`, which loads the full user record from the database
5. The user object is injected into `req.user` — accessible in all controllers

Controllers do not need to decode the token manually. Once the guard and strategy succeed, handlers can rely on `req.user` as the authenticated user context for authorization and business logic.

---

## Database Access Patterns

TypeORM offers two ways to query the database:

**Simple (built-in methods)**
```ts
this.usersRepository.findOne({ where: { email }, relations: ['studentProfile'] })
```

**Complex (QueryBuilder)**
```ts
this.usersRepository
  .createQueryBuilder("user")
  .leftJoinAndSelect("user.studentProfile", "studentProfile")
  .where("LOWER(user.firstName) LIKE LOWER(:query)", { query: `%${query}%` })
  .limit(5)
  .getMany();
```
QueryBuilder supports complex SQL (JOIN, LIKE, filters) while staying in TypeScript. Always use named parameters (`:param`) — never string concatenation — to prevent SQL injection.

---

## Request Lifecycle

```
Client (frontend)
  │  Authorization: Bearer <jwt>
  ▼
HttpLoggerMiddleware      ← logs the request to Logstash/ELK
  ▼
JwtAuthGuard              ← verifies the token
  ▼
JwtStrategy.validate()    ← loads the user from the database
  ▼
Controller                ← receives req.user (injected by Passport)
  ▼
Service                   ← business logic
  ▼
Repository (TypeORM)      ← PostgreSQL query
  ▼
Database
```

This is why route handlers can stay small: authentication, token parsing, and user lookup are resolved before controller logic starts.

---

## Dependency Injection

NestJS uses constructor-based dependency injection throughout. Repositories are injected via the `@InjectRepository` decorator:

```ts
constructor(
  @InjectRepository(User) private usersRepository: Repository<User>,
  @InjectRepository(StudentProfile) private studentProfileRepository: Repository<StudentProfile>,
)
```

`Repository<T>` exposes standard database methods (`find`, `findOne`, `save`, `remove`) as well as `createQueryBuilder` for complex queries.
