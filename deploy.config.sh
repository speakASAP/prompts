# deploy.config.sh — declaration consumed by shared/scripts/deploy.sh.
# See shared/docs/DEPLOY_STANDARDIZATION_REPORT.md section 6 for the design.
#
# Phase B pilot (report section 7). scripts/deploy.sh is still the live,
# authoritative deploy path for this service — this file is a validated
# --dry-run/pilot target, not yet wired in as the default.

SERVICE_NAME="prompts-microservice"
PORT="4750"
HEALTH_PATH="/health"

# image[i] = "image-name|build-context|dockerfile|extra-docker-args"
IMAGES=(
  "prompts-microservice|.||"
)

# deployment[i] = "k8s-deployment|container|image-name"
DEPLOYMENTS=(
  "prompts-microservice|app|prompts-microservice"
)

# MANIFESTS left at the runner default (configmap, external-secret, deployment,
# service, ingress) — matches the real script's manifest loop exactly.
