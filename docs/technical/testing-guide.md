# Testing guide

## Before you start

Run `make all` from the project root. Once the stack is up, run `make ps` to verify all services are running.

`frontend`, `backend`, `db`, `elasticsearch`, `logstash`, `kibana` should show up and healthy.

Open `https://localhost:8443`.

---

## 1. Authentication

### 1.1 Valid login

Open `https://localhost:8443/login` in a browser. Enter a valid account (teacher, student, or admin).

**Expected:** you are redirected to your dashboard. No error message.

---

### 1.2 Wrong password → 401

In a terminal:

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST https://localhost:8443/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"any@safeschool.fr","password":"wrongpassword"}' -k
```

**Expected:** `401`

---

### 1.3 Brute force protection → 429

Login attempts are rate-limited globally (`@nestjs/throttler`: 20 requests / 60s per IP). Beyond the limit, the API returns `429 Too Many Requests`. Failed logins are **also** logged as `WARN` events in Kibana, so brute-force patterns are both blocked and monitored.

```bash
for i in $(seq 1 25); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://localhost:8443/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@safeschool.fr","password":"wrong"}' -k)
  echo "Attempt $i: $STATUS"
done
```

**Expected:** the first attempts return `401`; once the 60s limit is exceeded the API returns `429`. Failed attempts also appear in Kibana Discover at `level: WARN` (filter `type: "auth_event"`). See [`elk.md`](./elk.md).

---

### 1.4 Passwords are hashed in the database

Passwords must never be stored in plain text. Run:

```bash
docker compose exec database psql -U postgres -d safeschool \
  -c "SELECT email, LEFT(password, 7) AS hash_prefix FROM users LIMIT 5;"
```

**Expected:** every row in `hash_prefix` starts with `$2b$10$` (bcrypt format).

---

## 2. Access control

### 2.1 Protected route without a token → 401

Any API route that requires login should reject requests with no token:

```bash
curl -s -o /dev/null -w "%{http_code}" https://localhost:8443/reports -k
```

**Expected:** `401`

---

### 2.2 Protected route with a valid token → 200

First log in to get a token, then use it:

```bash
TOKEN=$(curl -s -X POST https://localhost:8443/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@safeschool.fr","password":"YourPassword"}' -k \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -s -o /dev/null -w "%{http_code}" https://localhost:8443/reports \
  -H "Authorization: Bearer $TOKEN" -k
```

**Expected:** `200`

---

## 3. ELK monitoring

### 3.1 Logs reach Elasticsearch (end-to-end chain)

Generate a login event, then verify it landed in Kibana:

```bash
# Step 1 — trigger an auth event
curl -s -X POST https://localhost:8443/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@safeschool.com","password":"admin123123+"}' -k > /dev/null
```

Step 2 — open Kibana at **http://localhost:5601** (login: `elastic` / see `.env` → `ELASTIC_PASSWORD`).

Go to **Discover**, select the `safeschool-logs` data view, set the time range to **last 15 minutes**.

**Expected:** at least one document with `type: auth_event` appears within a few seconds.

> Note: Elasticsearch port 9200 is intentionally not exposed to the host. All access goes through Kibana or from inside the Docker network.

---

### 3.2 Kibana dashboard loads automatically

The dashboard must be provisioned on a fresh install — no manual clicks required.

```bash
make fclean && make all
# Once the stack is ready:
curl -s "http://localhost:5601/api/saved_objects/_find?type=dashboard" \
  -H "kbn-xsrf: true" | python3 -m json.tool | grep '"title"'
```

**Expected:** `"SafeSchool - Logs Overview"` appears in the output.

---

### 3.3 Index Lifecycle Management is active

Open Kibana at `http://localhost:5601`.  
Go to **Stack Management → Index Lifecycle Policies**.

**Expected:** a policy named `safeschool-logs-policy` is listed.

---

## 4. Code quality

### 4.1 Frontend lint — zero errors

```bash
cd frontend && npm run lint
```

**Expected:** `0 errors`. Warnings are expected and documented (see [Known issues](#known-issues) below).

---

### 4.2 Backend lint — zero errors

```bash
cd backend && npm run lint
```

**Expected:** `0 errors`

---

### 4.3 Backend TypeScript build — compiles cleanly

```bash
cd backend && npm run build
```

**Expected:** command exits without errors, `dist/` folder is created.

---

## 5. Functional

### 5.1 No red errors in the browser console

Open DevTools (F12 → Console tab) and navigate through each page. Look for red error messages.

- [ ] Login page
- [ ] Reporter dashboard (teacher account)
- [ ] Student dashboard
- [ ] Admin dashboard
- [ ] Report detail view

**Expected:** no red errors. Yellow warnings from browser extensions (React DevTools, fingerprint protection) are not the app's — ignore them.

---

### 5.2 Two simultaneous users — sessions are isolated

Open two different browsers (e.g. Firefox + Chrome). Log in with two different accounts. Both perform actions at the same time.

**Expected:** each user sees only their own data. No data from one session leaks into the other.

---

## 6. Infrastructure security

### 6.1 Elasticsearch is not reachable from outside containers

```bash
curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://localhost:9200
```

**Expected:** `000` (connection refused — port 9200 is not exposed to the host, only accessible inside the Docker network).

---

### 6.2 HTTPS is active

```bash
curl -s -o /dev/null -w "%{http_code}" https://localhost:8443 -k
```

**Expected:** `200`

---

## Checklist

| Check                                   | Status ✅ | Date |
| --------------------------------------- | --------- | ---- |
| 1.1 Valid login                         |           |      |
| 1.2 Wrong password → 401                |           |      |
| 1.3 Brute force → 429                   |           |      |
| 1.4 Passwords hashed (bcrypt)           |           |      |
| 2.1 Protected route without token → 401 |           |      |
| 2.2 Protected route with token → 200    |           |      |
| 3.1 ELK end-to-end                      |           |      |
| 3.2 Kibana dashboard auto-provisioned   |           |      |
| 3.3 ILM policy visible                  |           |      |
| 4.1 Frontend lint 0 errors              |           |      |
| 4.2 Backend lint 0 errors               |           |      |
| 4.3 Backend build clean                 |           |      |
| 5.1 No console errors                   |           |      |
| 5.2 Multi-user isolation                |           |      |
| 6.1 Elasticsearch not exposed           |           |      |
| 6.2 HTTPS active                        |           |      |

---

## Known issues

### TypeScript `any` — tracked as warnings, not fixed

**Where:** `ReportDetail.tsx`, `AdminUserProfile.tsx`, `StudentCases.tsx`, `ConvocationSelector.tsx`, and others.

The ESLint rule `@typescript-eslint/no-explicit-any` is set to `warn` instead of `error`. The `any` types are visible in the lint output but do not block the build. Properly typing ~50 API responses was out of scope for this sprint; TypeScript compilation (`nest build`) already catches structural inconsistencies at build time.

---

### Strict React Hooks rules — downgraded to warnings

**Rules:** `react-hooks/set-state-in-effect`, `react-hooks/refs`

These rules come from the React Compiler (react-hooks v6) and flag common patterns like `setLoading(true)` at the start of a fetch effect, or syncing a ref during render for socket handlers. These patterns work correctly; refactoring them would touch business logic (quiz reconnection, report loading) with no functional gain.
