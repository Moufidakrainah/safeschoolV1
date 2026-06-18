# ELK Stack

## Overview

The ELK stack (Elasticsearch + Logstash + Kibana) centralizes and visualizes SafeSchool application logs in real time.

| Component         | Version | Role                                         |
| ----------------- | ------- | -------------------------------------------- |
| **Elasticsearch** | 8.12.0  | Log storage and indexing                     |
| **Logstash**      | 8.12.0  | Collection, transformation, forwarding to ES |
| **Kibana**        | 8.12.0  | Visualization — Discover + Dashboards        |

Only **Kibana** (`5601`) is exposed to the host. Elasticsearch and Logstash are internal to the Docker network.

---

## Starting the stack

```bash
make all       # starts the full application stack, including ELK
make logs-elk  # follow Elasticsearch / Logstash / Kibana logs
```

Two one-shot setup services configure ELK on startup, then exit:

1. **`elasticsearch-setup-users`** — once Elasticsearch is healthy:
   - creates the system users (`kibana_system`, `logstash_internal`) and the `logstash_writer` role
   - creates the ILM lifecycle policy (hot → warm at 7d → delete at 30d)
   - creates the `safeschool-logs-*` index template
2. **`elasticsearch-setup-kibana`** — once Kibana is healthy:
   - imports the Kibana data view and the "SafeSchool - Logs Overview" dashboard

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

| User                | Role              | Usage                         |
| ------------------- | ----------------- | ----------------------------- |
| `elastic`           | superuser         | Kibana access, administration |
| `kibana_system`     | built-in          | Kibana → Elasticsearch        |
| `logstash_internal` | `logstash_writer` | Logstash → Elasticsearch      |

Passwords are generated with `openssl rand -hex 32` and stored in `.env` (not committed). See `.env.example` for required variables.

---

## What emits what

The NestJS backend sends logs as TCP/JSON to Logstash on port 5044 (Docker internal network). Logstash enriches events with tags and indexes them into Elasticsearch.

| File                        | Event type      | Trigger                                     |
| --------------------------- | --------------- | ------------------------------------------- |
| `http-logger.middleware.ts` | `http_request`  | Automatic — every HTTP request              |
| `auth.service.ts`           | `auth_event`    | Login success/failure, registration         |
| `reports.service.ts`        | `report_event`  | Creation, update, note, summons             |
| `scoring.service.ts`        | `scoring_event` | Score calculation (5 components + AI)       |
| `main.ts` (useLogger)       | `ERROR` level   | Unhandled exceptions and application errors |

A single user action may generate multiple logs.

Example: submitting a report can emit:

- `http_request`
- `report_event`
- `scoring_event`

`login_failure` events are emitted as **WARN** (brute force monitoring).
Unhandled exceptions are emitted as **ERROR** with the `error` tag.

### Logging scope — real-time quiz

The WebSocket quiz logs its **connection lifecycle** (connect/disconnect — visible in Discover with `context: "QuizRealtimeGateway"`). Business/audit logging (`auth_event`, `report_event`, `scoring_event`) covers the REST flows; live gameplay state (scores, answers) is kept in-socket during a match and is **not persisted to ELK by design** — it is transient real-time state, not audit data.

Game-level metrics (answer latency, players over time, reconnections…) **could** be added later by emitting structured `quiz_event` logs through the shared `LoggerService`; ELK would then store and visualize them like any other event. The current scope is a deliberate choice, not a limitation of the stack.

---

## Available tags in Discover

| Tag       | Content               |
| --------- | --------------------- |
| `http`    | All HTTP requests     |
| `auth`    | Authentication events |
| `report`  | Report events         |
| `scoring` | Score calculations    |
| `error`   | ERROR level logs      |

Filter syntax (KQL — Kibana Query Language): `tags: "auth"` — `level: "ERROR"` — `type: "auth_event"`

---

## Dashboard "SafeSchool - Logs Overview"

4 pre-configured panels, auto-imported on startup:

| Panel                   | Type            | What it shows                           |
| ----------------------- | --------------- | --------------------------------------- |
| Activity per event type | Line chart      | auth/report/scoring volume over time    |
| HTTP Status Codes       | Horizontal bars | API response code distribution          |
| App Health Monitoring   | Donut           | INFO / WARN / ERROR breakdown           |
| Authentication activity | Area chart      | Authentication events grouped by action |

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

> This test only validates the Logstash → Elasticsearch pipeline.
> The most representative end-to-end validation is performing a real user action
> through the application and verifying its trace in Discover.

---

## Retention policy (ILM)

Created automatically by `elk/setup/setup.sh`:

- **Hot** (from creation): active index, no action.
- **Warm** (after 7 days): `forcemerge` to 1 segment to save space.
- **Delete** (after 30 days): the index is removed.

**Live verification:** in Kibana → Dev Tools, run `GET safeschool-logs-*/_ilm/explain`. Each index shows `"managed": true`, `"policy": "safeschool-logs-policy"` and `"step": "complete"` — no ILM error. The phases are also visible in Stack Management → Index Lifecycle Policies.

---

## Using ELK during testing

Keep Kibana Discover open during test sessions:

- Filter `level: "ERROR"`: any backend crash surfaces immediately with context (route, userId, message)
- Filter `type: "auth_event"`: monitor test account logins
- Filter `type: "report_event"`: verify report traceability

→ See also `docs/testing-guide.md` section 3 for ELK validation checks.

## Module compliance

| Requirement                              | Status | Detail                                                                                      |
| ---------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| Elasticsearch — storage and indexing     | ✅     | `safeschool-logs-YYYY.MM.DD` index, index template                                          |
| Logstash — collection and transformation | ✅     | TCP/JSON pipeline, type-based tags, normalized timestamp                                    |
| Kibana — visualization and dashboards    | ✅     | 4-panel dashboard, auto-imported                                                            |
| Retention and archiving policy (ILM)     | ✅     | Hot → Warm 7d (forcemerge) → Delete 30d, created automatically                              |
| Security — authenticated access          | ✅     | xpack.security, 3 system users, Elasticsearch and Logstash restricted to the Docker network |
