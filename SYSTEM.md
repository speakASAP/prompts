# SYSTEM.md

## Service identity

- Service name: `prompts-microservice`
- Domain: `prompts.alfares.cz`
- Runtime: Node.js (Express)

## Ports

- Blue host port: `4750` (`PORT`)
- Green host port: `4751` (`PORT_GREEN`)
- Container port: `3000` (`CONTAINER_PORT`)

## Dependencies

- `auth-microservice` (`AUTH_SERVICE_URL`) for login/register/token validation
- `database-server` PostgreSQL (`DB_*`) for prompt persistence
- `logging-microservice` (`LOGGING_SERVICE_URL`) for operational logs

## Endpoints

- Web UI: `GET /`
- Health: `GET /api/health`
- Auth API:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Prompt API:
  - `GET /api/prompts`
  - `GET /api/prompts/:id`
  - `POST /api/prompts`
  - `PUT /api/prompts/:id`
  - `DELETE /api/prompts/:id`

## Deployment

- Blue/green deployment script: `scripts/deploy.sh`
- Compose manifests:
  - `docker-compose.blue.yml`
  - `docker-compose.green.yml`
- Nginx route source: `nginx/nginx-api-routes.conf`
