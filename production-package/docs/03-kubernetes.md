# Kubernetes Deployment Guide

Deploy Pinnacle Academic Classes on Kubernetes (GKE, EKS, AKS, or self-hosted k3s).

## Prerequisites
- `kubectl` configured against your cluster
- A container registry (e.g., GHCR, ECR, GCR, Docker Hub)
- `cert-manager` installed (for automatic TLS)
- An Ingress controller (nginx-ingress recommended)

---

## Step 1 — Build and push Docker images

```bash
# API server
docker build -f production-package/api-server/Dockerfile \
  -t ghcr.io/your-org/pinnacle-api:latest .
docker push ghcr.io/your-org/pinnacle-api:latest

# Website
docker build -f production-package/website/Dockerfile \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_live_... \
  -t ghcr.io/your-org/pinnacle-web:latest .
docker push ghcr.io/your-org/pinnacle-web:latest
```

---

## Step 2 — Update image references

Edit `k8s/api-deployment.yaml` and `k8s/website-deployment.yaml`:
```yaml
image: ghcr.io/your-org/pinnacle-api:latest    # ← your actual registry
image: ghcr.io/your-org/pinnacle-web:latest
```

Edit `k8s/ingress.yaml` and replace `yourdomain.com` with your real domain.

---

## Step 3 — Create secrets

```bash
# Encode your values
echo -n 'postgresql://...' | base64
echo -n 'sk_live_...' | base64
echo -n 'pk_live_...' | base64
echo -n 'your-64-char-hex' | base64
```

Edit `k8s/secrets.yaml` with the encoded values, then apply:
```bash
kubectl apply -f k8s/secrets.yaml
```

**Never commit secrets.yaml with real values to git.**

---

## Step 4 — Apply all manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/website-deployment.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

---

## Step 5 — Verify

```bash
kubectl -n pinnacle get all
kubectl -n pinnacle get ingress
kubectl -n pinnacle logs -l app=api-server --tail=50
```

---

## Step 6 — Rolling updates

```bash
# After pushing a new image:
kubectl -n pinnacle rollout restart deployment/api-server
kubectl -n pinnacle rollout restart deployment/website

# Monitor rollout
kubectl -n pinnacle rollout status deployment/api-server
```

---

## Scaling

```bash
# Manual scale
kubectl -n pinnacle scale deployment/api-server --replicas=5

# HPA handles auto-scaling automatically (configured in k8s/hpa.yaml)
kubectl -n pinnacle get hpa
```

---

## Minimal k3s Setup (self-hosted)

```bash
# Install k3s on your VPS
curl -sfL https://get.k3s.io | sh -

# Install nginx-ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.5/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.yaml

# Then follow steps 1–5 above
```
