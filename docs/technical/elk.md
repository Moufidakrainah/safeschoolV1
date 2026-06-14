# ELK Stack

## Overview

The ELK stack (Elasticsearch + Logstash + Kibana) centralizes and visualizes SafeSchool application logs in real time.

| Component | Version | Role |
|---|---|---|
| **Elasticsearch** | 8.12.0 | Log storage and indexing |
| **Logstash** | 8.12.0 | Collection, transformation, forwarding to ES |
| **Kibana** | 8.12.0 | Visualization — Discover + dashboard |

Only **Kibana** (`5601`) is exposed to the host. Elasticsearch and Logstash are internal to the Docker network.

---

## Starting the stack

```bash
make up-elk      # starts ES + Logstash + Kibana + elasticsearch-setup
make logs-setup  # follow setup progress
```

The `elasticsearch-setup` service runs once on startup and:
- creates system users (`kibana_system`, `logstash_internal`)
- creates the ILM retention policy (30 days)
- creates the `safeschool-logs-*` index template
- imports the Kibana data view and dashboard automatically

No manual configuration in Kibana is required.

---

## Accessing Kibana

URL: **http://localhost:5601**
Login: `elastic`
Password: value of `ELASTIC_PASSWORD` in `.env`

The **"SafeSchool - Logs Overview"** dashboard is available immediately in Dashboards.

---

## Security

`xpack.security` is enabled. Each component authenticates with its own system user:

| User | Role | Usage |
|---|---|---|
| `elastic` | superuser | Kibana access, administration |
| `kibana_system` | built-in | Kibana → Elasticsearch |
| `logstash_internal` | `logstash_writer` | Logstash → Elasticsearch |

Passwords are generated with `openssl rand -hex 32` and stored in `.env` (not committed). See `.env.example` for required variables.

---

## What emits what

The NestJS backend sends logs as TCP/JSON to Logstash on port 5044 (internal Docker). Logstash adds tags and indexes into Elasticsearch.

| File | Event type | Trigger |
|---|---|---|
| `http-logger.middleware.ts` | `http_request` | Automatic — every HTTP request |
| `auth.service.ts` | `auth_event` | Login success/failure, registration |
| `reports.service.ts` | `report_event` | Creation, update, note, summons |
| `scoring.service.ts` | `scoring_event` | Score calculation (5 components + AI) |
| `main.ts` (useLogger) | `ERROR` level | Unhandled exceptions (500) |

**Rule:** 1 user action = up to 3 traces in Kibana (`http_request` + `report_event` + `scoring_event` for a report submission).

`login_failure` events are emitted as **WARN** (brute force monitoring).
Unhandled exceptions are emitted as **ERROR** with the `error` tag.

---

## Available tags in Discover

| Tag | Content |
|---|---|
| `http` | All HTTP requests |
| `auth` | Authentication events |
| `report` | Report events |
| `scoring` | Score calculations |
| `error` | ERROR level logs |

KQL syntax: `tags: "auth"` — `level: "ERROR"` — `type: "auth_event"`

---

## Dashboard "SafeSchool - Logs Overview"

4 pre-configured panels, auto-imported on startup:

| Panel | Type | What it shows |
|---|---|---|
| Activity per event type | Line chart | auth/report/scoring volume over time |
| HTTP Status Codes | Horizontal bars | API response code distribution |
| App Health Monitoring | Donut | INFO / WARN / ERROR breakdown |
| Login attempts | Area chart | Successful vs failed logins |

Source file: `elk/setup/kibana-dashboard.ndjson`.

---

## Testing the pipeline manually

Port 5044 is not exposed to the host. To send a test log from inside the Docker network:

```bash
docker compose exec backend sh -c \
  'echo "{\"level\":\"INFO\",\"type\":\"auth_event\",\"message\":\"test\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
  | nc logstash 5044'
```

Wait a few seconds, then check in Discover that the document appears.

> This test only validates the Logstash → ES pipe. The only reliable end-to-end test
> is performing a real action in the UI and verifying its trace in Discover.

---

## Retention policy (ILM)

Created automatically by `elk/setup/setup.sh`:
- **Hot**: 7 days (logs searchable)
- **Warm**: up to 30 days (compressed)
- **Delete**: at 30 days

Verification: Kibana → Stack Management → Index Lifecycle Policies → `safeschool-logs-policy` should be listed.

---

## Using ELK during testing

Keep Kibana Discover open during test sessions:

- Filter `level: "ERROR"`: any backend crash surfaces immediately with context (route, userId, message)
- Filter `type: "auth_event"`: monitor test account logins
- Filter `type: "report_event"`: verify report traceability

→ See also `docs/testing_guide.md` section 3 for ELK validation checks.

---

## Major module compliance (2 pts)

| Requirement | Status | Detail |
|---|---|---|
| Elasticsearch — storage and indexing | ✅ | `safeschool-logs-YYYY.MM.DD` index, index template |
| Logstash — collection and transformation | ✅ | TCP/JSON pipeline, type-based tags, normalized timestamp |
| Kibana — visualization and dashboards | ✅ | 4-panel dashboard, auto-imported |
| Persistent volumes | ✅ | `esdata`, `kibanadata` |
| ILM retention policy | ✅ | Hot 7d → Warm → Delete 30d, created automatically |
| Security — authenticated access | ✅ | xpack.security, 3 system users, ports closed |
