#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'

SERVICE_NAME="prompts-microservice"
REGISTRY="localhost:5000"
NAMESPACE="statex-apps"
IMAGE_TAG="${1:-latest}"
IMAGE="${REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG}"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Prompts Microservice — Kubernetes Deployment          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}[1/5] Building image: ${IMAGE}...${NC}"
docker build -t "$IMAGE" "$PROJECT_ROOT"
echo -e "${GREEN}✅ Image built${NC}"

echo -e "${YELLOW}[2/5] Pushing to registry...${NC}"
docker push "$IMAGE"
echo -e "${GREEN}✅ Image pushed: ${IMAGE}${NC}"

echo -e "${YELLOW}[3/5] Updating K8s deployment...${NC}"
kubectl set image deployment/${SERVICE_NAME} \
  app="${IMAGE}" \
  -n "${NAMESPACE}"
echo -e "${GREEN}✅ Deployment updated${NC}"

echo -e "${YELLOW}[4/5] Waiting for rollout...${NC}"
kubectl rollout status deployment/${SERVICE_NAME} \
  -n "${NAMESPACE}" \
  --timeout=120s
echo -e "${GREEN}✅ Rollout complete${NC}"

echo -e "${YELLOW}[5/5] Health check...${NC}"
POD=$(kubectl get pod -n "${NAMESPACE}" \
  -l app=${SERVICE_NAME} \
  -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n "${NAMESPACE}" "$POD" -- \
  wget -qO- http://localhost:4750/health
echo -e "\n${GREEN}✅ Health check passed${NC}"

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║            ✅ Deployment successful!                   ║"
echo "║  Image: ${IMAGE}"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
