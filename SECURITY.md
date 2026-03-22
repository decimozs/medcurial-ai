# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability within Medcurial, please report it responsibly:

- **Email:** marlonadiguemartin548@gmail.com
- **Response Time:** We aim to acknowledge reports within 48 hours and provide a timeline for remediation.
- **Disclosure:** Please do not disclose vulnerabilities publicly until a fix is available.

## Secrets Management

- **Never commit secrets.** The `.env` files contain sensitive credentials and are listed in `.gitignore`.
- **Use environment variables.** All secrets (API keys, database URLs, tokens) must be provided via environment variables, never hardcoded in source files.
- **Rotate keys regularly.** Rotate API keys for Ollama Cloud, HuggingFace, Roboflow, and Supabase periodically.
- **Use `.env.example`.** The `.env.example` file documents required environment variables without exposing actual values. Copy it to `.env` for local development.

## API Security

- **Input validation.** All API endpoints validate request data and return appropriate HTTP status codes:
  - `400` for validation errors and malformed requests
  - `404` for resources not found
  - `500` for internal server errors
  - `502` for external API failures
- **JSON-only responses.** Error responses follow a consistent `{ "error": "message" }` format.
- **No secrets in logs.** API endpoints log errors without exposing sensitive data such as API keys, tokens, or credentials.
- **Validate external URLs.** The Agent service validates URLs before making external requests.

## Data Storage

- **PostgreSQL (Neon).** The database connection uses Neon PostgreSQL, which supports TLS. Do not disable SSL/TLS in production connections.
- **Supabase Storage.** Signature images and processed files are stored in Supabase buckets. Bucket permissions must be configured to restrict public access appropriately.
- **No sensitive data in image processing output.** Processed images (ROI, normalized, siamese) should not contain embedded metadata that could leak personal information.
- **Fraud analysis isolation.** Document fraud analysis results are stored per document and should only be accessible through the API, not directly from storage.

## External Credentials

All external service credentials are handled via environment variables:

| Service | Environment Variable | Purpose |
|---------|---------------------|---------|
| Ollama Cloud | `OLLAMA_API_KEY` | Chat LLM requests |
| HuggingFace | `HF_TOKEN`, `HF_BASE_URL` | Fraud detection model |
| Roboflow | `ROBOFLOW_API_KEY` | OCR text extraction |
| Supabase | `SUPABASE_URL`, `SUPABASE_KEY` | File storage |
| Neon PostgreSQL | `DATABASE_URL` | Primary database |

- **Never expose keys.** API keys for external services should never appear in API responses, logs, or error messages.
- **Use least privilege.** Grant only the permissions required for each service (e.g., read-only access where applicable).

## Docker Security

- **Non-root containers.** Dockerfiles should run services as non-root users where possible.
- **Image scanning.** Run `docker scan` or `trivy image` on Docker images before deploying to production.
- **Secrets in `docker-compose`.** Use environment variable interpolation in `docker-compose.yml` for secrets. Do not hardcode credentials in Dockerfiles.
- **Network isolation.** Services communicate over an internal `medcurial` bridge network. Only the App service (port 5173) should be exposed to the host.
- **Healthchecks.** All services define healthcheck endpoints (`/health` for Worker, Agent; `/api/v1/signatures` for API) to support orchestration.

## Dependency Security

Audit dependencies regularly for known vulnerabilities:

### API and App (Node.js / Bun)

```bash
cd api && bun audit
cd app && bun audit
```

### Worker, Agent, MCP (Python)

```bash
cd worker && uv pip audit
cd agent && uv pip audit
cd mcp && uv pip audit
```

### General

- Keep dependencies up to date using `make install` periodically.
- Review changelogs before updating major versions.
- Pin dependency versions in CI to ensure reproducible builds.

## Security Considerations by Service

### API Service

- Uses Bun runtime with Hono framework.
- Drizzle ORM with parameterized queries to prevent SQL injection.
- No client-side secrets. API keys for external services are not used here.

### Worker Service

- Handles image uploads from clients. Validate file types and sizes before processing.
- Communicates with Roboflow API for OCR — do not log API keys.
- Uploads processed images to Supabase — bucket policies should restrict write access to the Worker service only.

### Agent Service

- Uses LangGraph for orchestrating LLM calls. Do not expose raw LLM responses without sanitization.
- Ollama Cloud and HuggingFace tokens must not appear in logs or error responses.
- Rate limit chat and analysis endpoints to prevent abuse.

### MCP Service

- Runs in stdio mode for local AI agent integration.
- Exposes read-only tools (querying documents and signatures). No mutation endpoints.
- Should only be accessible locally, not exposed over a network.

### App (Frontend)

- API base URL is configured via `VITE_API_URL`. Do not hardcode production URLs.
- No secrets are stored client-side. All authentication tokens are managed server-side.
- Use HTTPS in production to protect data in transit.

## Incident Response

If a security incident is confirmed:

1. **Containment.** Isolate affected services, revoke compromised keys, and disable affected accounts.
2. **Assessment.** Determine the scope and impact of the breach.
3. **Notification.** Inform affected users and stakeholders as required.
4. **Remediation.** Apply patches, update credentials, and fix vulnerabilities.
5. **Review.** Conduct a post-incident review and update this document if necessary.
