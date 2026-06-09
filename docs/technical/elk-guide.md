# ELK Stack — Usage Guide

## Overview

The ELK stack (Elasticsearch, Logstash, Kibana) is integrated into the project to centralize and visualize application logs.

| Component | Version | Role | Exposed port |
|---|---|---|---|
| **Elasticsearch** | 8.12.0 | Log storage and indexing | `9201` |
| **Logstash** | 8.12.0 | Collection, transformation, forwarding to ES | `5044` (TCP) |
| **Kibana** | 8.12.0 | Visualization interface | `5601` |

NestJS backend logs are sent to Logstash over TCP (JSON), which indexes them in Elasticsearch under the pattern `safeschool-logs-YYYY.MM.DD`.

---

## Starting the Stack

```bash
# From the project root
make up-elk

# Verify all three services are healthy
docker compose ps
```

Wait approximately 30 seconds for Elasticsearch to be available before opening Kibana.

---

## Accessing Kibana

Open: **http://localhost:5601**

On first launch, Kibana may require an additional startup delay (~1 min).

---

## Configuring a Data View (first time only)

1. Sidebar menu → **Management** → **Stack Management**
2. **Kibana** → **Data Views** → **Create data view**
3. Fill in:
   - Name: `safeschool-logs`
   - Index pattern: `safeschool-logs-*`
   - Timestamp field: `@timestamp`
4. Click **Save data view to Kibana**

---

## Exploring Logs — Discover

Menu → **Discover**

Select the `safeschool-logs` data view at the top left.

### Useful filters by tag

Logs are automatically tagged by type:

| Tag | Content |
|---|---|
| `auth` | Logins, logouts, authentication attempts |
| `http` | Incoming HTTP requests (method, route, status, duration) |
| `report` | Report creation, update, and retrieval |
| `scoring` | Quiz-related events (results, scores) |
| `error` | All application errors (ERROR level) |

KQL filter syntax:
```
tags: "auth"
tags: "error"
tags: "report"
tags: "auth" and level: "ERROR"
```

---

## Sending a Test Log Manually

To verify that Logstash is receiving data without starting the full application:

```bash
echo '{"level":"INFO","type":"auth_event","message":"test login","user":"admin","timestamp":"2026-01-01T10:00:00Z"}' | nc localhost 5044
```

Wait a few seconds, then check in Discover that the document appears.

---

## Creating a Dashboard

1. Menu → **Dashboards** → **Create dashboard**
2. **Add panel** → **Lens**
3. Useful visualization examples:

**Log volume by type (last 24h)**
- X axis: `@timestamp` (by interval)
- Y axis: Count
- Split by: `tags.keyword`

**Error rate**
- Filter: `level: "ERROR"`
- Visualization: Metric (total count)

**Authentication activity**
- Filter: `tags: "auth"`
- X axis: `@timestamp`
- Y axis: Count

---

## Verifying Application Logs Arrive

To confirm the application is actually sending logs (not just manual tests):

1. Start the full stack: `make up`
2. Perform an action in the UI (login, report creation, quiz launch)
3. In Discover, search for the corresponding event in recent logs
4. Verify that the `type` field matches the action (`auth_event`, `report_event`, `scoring_event`)

---

## Configuration

### Log retention policy (ILM)

Configure index lifecycle management in Kibana to automatically expire old logs:

Kibana → **Stack Management** → **Index Lifecycle Policies** → **Create policy**

Recommended policy:
- Hot phase: 7 days (logs searchable)
- Warm phase: 23 days (logs compressed)
- Delete phase: 30 days (logs deleted)

Then assign the policy to the index template:
Stack Management → **Index Templates** → find `safeschool-logs` → add the policy.

### Secure access

Restrict Elasticsearch so it is only accessible from inside the Docker network, not from the host:

```yaml
# docker-compose.yml
elasticsearch:
  expose:
    - "9200"       # accessible to other containers only
  # ports:         ← remove or comment out
  #   - "9201:9200"
```

To enable full authentication:
```yaml
elasticsearch:
  environment:
    - xpack.security.enabled=true
    - ELASTIC_PASSWORD=<strong-password>

kibana:
  environment:
    - ELASTICSEARCH_USERNAME=kibana_system
    - ELASTICSEARCH_PASSWORD=<strong-password>
```

---

## Data Flow Summary

```
NestJS backend
      ↓ sends a log (Winston → Logstash transport)
Logstash
      ↓ transforms and names the index "safeschool-logs-YYYY.MM.DD"
Elasticsearch
      ↓ stores in the index
Kibana
      ↓ reads via the pattern "safeschool-logs-*"
      ↓ displays in Discover and dashboards
```

## Module Compliance

- ✅ Elasticsearch to store and index logs
- ✅ Logstash to collect and transform logs
- ✅ Kibana for visualization and dashboards
- ✅ Persistent volumes (`esdata`, `kibanadata`)
- ✅ Log retention and archiving policy (ILM)
- ✅ Secure access to all components
