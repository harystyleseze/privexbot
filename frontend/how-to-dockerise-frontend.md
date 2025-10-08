Below is a **step‑by‑step guide** from scratch (for your `frontend` folder in `privexbot`) showing _how / what / why_ to setup a Docker + Compose + CI pipeline that works for **local development** and **SecretVM / production** deployment. I’ve tried to keep it simple and pragmatic (not over‑engineered) but with solid best practices.

I will refer to your Docker Hub username as `harystyles`.

---

## Table of Contents

1. Project assumptions & constraints
2. Overall strategy
3. Step 1: prepare `.dockerignore`
4. Step 2: Dockerfile for development (`Dockerfile.dev`)
5. Step 3: Docker Compose for development (`docker-compose.dev.yaml`)
6. Step 4: Production Dockerfile (multi‑stage)
7. Step 5: `nginx.conf` for serving SPA
8. Step 6: Production Compose file (`docker-compose.yaml`)
9. Step 7: Helper scripts (build / push / check docker)
10. Step 8: Local dev workflow
11. Step 9: Manual build & push workflow
12. Step 10: Deployment on SecretVM / production VM
13. Step 11: CI / CD (GitHub Actions)
14. Best practices, caveats & notes

Let’s go.

---

## 1. Project Assumptions & Constraints

Here are the assumptions I’m making (and constraints you must keep in mind). If any differ, you should adapt accordingly.

- Your frontend is a **React + Vite + TypeScript** app, in folder `frontend/` of your repo `https://github.com/harystyleseze/privexbot`.

- The `package.json` you sent is accurate, with scripts:

  ```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
  ```

- Your source code is under `frontend/src/` (standard Vite layout).

- In production, your frontend will communicate with a backend (FastAPI) via REST HTTP APIs, with CORS enabled on backend.

- For production (SecretVM-style), **you cannot rely on building images on the VM**; images must be built upstream (locally or via CI), pushed to a registry (Docker Hub), and the VM / secret environment will only pull and run images.

- In production, you want immutability, so pin images (e.g. via digest or explicit version tags), not using `:latest`.

- For local development, you want a dev environment with hot reload, local file edits reflected, etc.

Given these, our plan will have:

- A **development** Dockerfile + Compose that supports hot reload, volume mounts, etc.
- A **production** Dockerfile (multi-stage) that builds the static site and serves via Nginx.
- A production Compose file using **only `image:`** (no `build:`) so that VMs don’t build.
- Helper scripts to check Docker, build, push, get digest, etc.
- CI workflow (GitHub Actions) to build & push images, output the digest.
- Manual steps you must run first (login, push, update digest) before deploying.

Let’s do this step by step.

---

## 2. Overall Strategy (What / Why)

**Why multi-stage / separate dev & prod setup?**

- In development, you want fast rebuilds, hot reload, code sync, dev dependencies. You don’t care about minimal final image.
- In production, you want a minimal, secure image with only the built static files + web server (Nginx). No dev tools, no source code inside, etc.
- Multi-stage builds let you build in a Node environment then copy only the result into a lean image.
- You should pin images in production (via digest or version) so deployments are deterministic and immutable.
- SecretVM / confidential environment often disallow dynamic builds or `build:` directives in runtime Compose; you must deploy via fixed images.
- Scripts help standardize build / push / digest workflows so you don’t make mistakes.
- CI automates building and pushing images (when you merge to `main` or release branch).

With that in mind, let’s build.

---

## 3. Step 1: `.dockerignore`

In `frontend/`, create a file named `.dockerignore` with:

```text
node_modules
dist
.dockerignore
Dockerfile.dev
docker-compose.dev.yaml
docker-compose.yaml
.git
.gitignore
.vscode
*.log
```

**Why**:

- You don’t want to send `node_modules` (heavy, local dependencies) into the build context.
- You don’t want the build output `dist` being part of context (cleaner separation).
- You exclude the Compose / Dockerfile dev files so they don’t get included in production image.
- You exclude `.git`, logs, IDE config, etc.
- This keeps build context small, improves caching, speeds builds, reduces image size risk.

---

## 4. Step 2: `Dockerfile.dev` (for local development)

In `frontend/`, create `Dockerfile.dev`:

```dockerfile
# frontend/Dockerfile.dev

FROM node:20-alpine

WORKDIR /app

# Copy package files for dependency install
COPY package.json package-lock.json ./

RUN npm install

# Copy all source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run dev server, listening on 0.0.0.0 so host can reach it
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**What / Why**:

- Base: `node:20-alpine` gives you Node + npm in a lightweight image.
- `WORKDIR /app` sets working directory.
- Copying `package.json` + `package-lock.json` first means Docker can cache `npm install` unless dependencies change.
- `npm install` pulls dev + prod deps.
- Copying the rest of source code allows live code changes (if mounted via volume).
- `EXPOSE 5173` matches default Vite dev server port.
- `CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]` ensures Vite listens externally (necessary inside container).

Later, via Compose we’ll mount your local code directory so edits reflect in container.

---

## 5. Step 3: `docker-compose.dev.yaml` (development Compose)

In `frontend/docker-compose.dev.yaml`, write:

```yaml
version: "3.8"

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
```

**What / Why**:

- `build:` is allowed here (local dev).

- `ports: "5173:5173"` maps container port 5173 to host, so you access via `localhost:5173`.

- `volumes:`:

  - `.:/app` mounts your local source, so changes are seen.
  - `/app/node_modules` ensures container’s node_modules are used and not overwritten by empty host folder.

- `environment: NODE_ENV=development` helps any code conditionals.

With this, you can `docker compose -f docker-compose.dev.yaml up --build` and get your dev environment in container, with live reload.

---

## 6. Step 4: Production Dockerfile (multi-stage)

In `frontend/Dockerfile` (overwrite or create):

```dockerfile
# Stage 1: builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: production server
FROM nginx:alpine AS production

# Remove default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy build output from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (if present)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**What / Why**:

- **Stage 1 (builder)**: runs in Node, installs dependencies, runs build (i.e. `vite build`) to produce static `dist/` folder.
- **Stage 2 (production)**: uses `nginx:alpine` as lean web server.
- We clear default Nginx html to avoid stale files.
- We `COPY --from=builder /app/dist /usr/share/nginx/html` so only built static files go into the final image.
- We optionally copy your own `nginx.conf` (see next step) to override default Nginx serving behavior (for SPA routing).
- `EXPOSE 80`: Nginx listens on port 80.
- `CMD ["nginx", "-g", "daemon off;"]` runs Nginx in foreground so container lives.

This gives you a minimal image that has only the compiled frontend and a web server.

---

## 7. Step 5: `nginx.conf` for SPA / routing fallback

In `frontend/nginx.conf`, put:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Routing fallback for SPA (client-side routes)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(?:ico|css|js|json|map|woff2|woff|ttf|svg|png|jpg|jpeg|gif|webp)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

**What / Why**:

- The `try_files` directive ensures that direct navigation (e.g. `/dashboard` or `/profile/123`) will fallback to `index.html`, so the client-side router takes over.
- The static asset block gives long caching for assets (improves performance).
- If your app is served under a subpath (e.g. `/app`), you may need to adjust `root`, `alias`, or `location /app { … }` – but for typical root serving this works.

With this Nginx config, your built React app will serve correctly and handle deep links.

---

## 8. Step 6: `docker-compose.yaml` (production / deployment)

In `frontend/docker-compose.yaml`:

```yaml
version: "3.8"

services:
  frontend:
    image: harystyles/frontend@sha256:<digest>
    ports:
      - "8080:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

**Key points**:

- Use `image:` (no `build:`) because in production we expect only image pulling.
- Pin the image to a **digest** (e.g. `@sha256:...`) rather than `:latest` for immutability and reproducibility.
- Map host port 8080 to container port 80 (serving static built site).
- `restart: unless-stopped` is a basic but good default so the container recovers on failure.
- You can pass environment variables if required (though static frontend often needs none).

When you want to deploy, you’ll update `<digest>` to the actual digest of the image you pushed.

---

## 9. Step 7: Helper Scripts (build / push / digest / checks)

Inside `frontend/`, create a directory `scripts/` (if not exists). Create `scripts/docker-helpers.sh`:

```bash
#!/usr/bin/env bash
set -e

# Helper script for building / pushing / digest of frontend image

# Ensure docker exists
if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed. Please install Docker."
  exit 1
fi

# Ensure docker daemon is accessible
if ! docker info >/dev/null 2>&1; then
  echo "Error: cannot talk to Docker daemon. Is it running?"
  exit 1
fi

# Ensure user is logged in (for Docker Hub)
if ! docker info | grep -q "Username:"; then
  echo "You are not logged in to Docker. Please run: docker login"
  exit 1
fi

# Build production image (multi-stage)
docker_build_prod() {
  local tag="$1"
  echo "Building production image with tag: $tag"
  docker build -f Dockerfile -t "$tag" .
}

# Build dev image (optional)
docker_build_dev() {
  local tag="$1"
  echo "Building dev image with tag: $tag"
  docker build -f Dockerfile.dev -t "$tag" .
}

# Push image
docker_push() {
  local tag="$1"
  echo "Pushing image: $tag"
  docker push "$tag"
}

# Get digest (RepoDigest)
docker_get_digest() {
  local tag="$1"
  # This prints something like harystyles/frontend@sha256:xxxx
  docker inspect --format='{{index .RepoDigests 0}}' "$tag"
}

# Combined: build + push + show digest
docker_release_prod() {
  local tag="$1"
  docker_build_prod "$tag"
  docker_push "$tag"
  local digest
  digest=$(docker_get_digest "$tag")
  echo "Digest: $digest"
}

# Usage instructions
usage() {
  cat <<EOF
Usage: $0 <command> <image-tag>
Commands:
  build-prod     Build production image
  push-prod      Push production image
  release-prod   Build + push + output digest
  get-digest     Show image digest (RepoDigest)
  build-dev       Build development image
  push-dev        Push development image (if needed)
EOF
  exit 1
}

if [ $# -lt 2 ]; then
  usage
fi

cmd="$1"
tag="$2"

case "$cmd" in
  build-prod)
    docker_build_prod "$tag"
    ;;
  push-prod)
    docker_push "$tag"
    ;;
  release-prod)
    docker_release_prod "$tag"
    ;;
  get-digest)
    docker_get_digest "$tag"
    ;;
  build-dev)
    docker_build_dev "$tag"
    ;;
  push-dev)
    docker_push "$tag"
    ;;
  *)
    usage
    ;;
esac
```

Make the script executable:

```bash
chmod +x frontend/scripts/docker-helpers.sh
```

You can then run commands like:

```bash
cd frontend
./scripts/docker-helpers.sh release-prod harystyles/frontend:1.0.0
```

This will build, push, and echo a digest, e.g.:

```
Digest: harystyles/frontend@sha256:abcdef1234...
```

You can then use that digest in your `docker-compose.yaml`.

---

## 10. Step 8: Local Development Workflow (Frontend only)

Here’s how you work locally with the setup:

1. In terminal, go to the `frontend/` directory

2. Run:

   ```bash
   docker compose -f docker-compose.dev.yaml up --build
   ```

3. Open browser at `http://localhost:5173` — this is your dev instance with hot reload

4. Edit source files locally (in `frontend/src/…`). The container sees updates because of the volume mount

5. The app updates in browser (hot reload)

6. You can stop it with `CTRL+C` or `docker compose -f docker-compose.dev.yaml down`

This gives you a consistent dev environment in a container, avoiding “works on my machine” issues.

If your frontend needs to call your backend API running locally, you can configure environment variables (e.g. `VITE_API_URL=http://host.docker.internal:8000`) or run both frontend + backend side by side in a parent Compose, but that’s a separate step.

---

## 11. Step 9: Manual Build & Push Workflow (Frontend)

When you want to release a version for production:

1. Decide a version tag, e.g. `1.0.0`

2. In `frontend/`, run:

   ```bash
   ./scripts/docker-helpers.sh release-prod harystyles/frontend:1.0.0
   ```

   This builds, pushes, and prints digest, e.g.:

   ```
   harystyles/frontend@sha256:abcdef1234567890...
   ```

3. Copy the digest output, then open `frontend/docker-compose.yaml` and replace `<digest>` placeholder with the real one:

   ```yaml
   image: harystyles/frontend@sha256:abcdef1234567890...
   ```

4. Commit the updated `docker-compose.yaml` (or store it in your deployment config).

5. (Optional) Tag your Git commit with `v1.0.0` or similar.

6. Push the commit / tag to your repo.

This ensures the docker-compose for production is using an exact known image.

---

## 12. Step 10: Deployment on SecretVM / Production VM

When deploying to a VM / SecretVM:

1. Ensure Docker (or container runtime) is installed and usable.

2. Pull or copy your production `docker-compose.yaml` with the pinned digest to the VM.

3. On VM, run:

   ```bash
   docker compose up -d
   ```

   This will pull the exact image by digest and run container.

4. Confirm container is running:

   ```bash
   docker ps
   docker logs <container-name>
   ```

5. Access the frontend via the VM’s external address and configured port (e.g. `http://vm-ip:8080`).

6. When you later want to update, build a new version, get a new digest, update the compose file, then on VM:

   ```bash
   docker compose pull
   docker compose up -d
   ```

   Or use `docker compose up -d --force-recreate`.

Because the VM never builds, this fits the constraint that images are immutable and prebuilt.

---

## 13. Step 11: CI / CD (GitHub Actions) for Frontend

You want to automate building & pushing frontend images when changes land on `main` (or a release branch). Here’s a sample `.github/workflows/frontend-build-push.yml`:

```yaml
name: Build & Publish Frontend

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      IMAGE_NAME: harystyles/frontend

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build & push image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: frontend/Dockerfile
          push: true
          tags: |
            ${{ env.IMAGE_NAME }}:latest
            ${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Get image digest
        id: get_digest
        run: |
          digest=$(docker buildx imagetools inspect ${{ env.IMAGE_NAME }}:${{ github.sha }} --format '{{.Digest}}')
          echo "digest=$digest" >> $GITHUB_OUTPUT

      - name: Output digest
        run: |
          echo "Frontend image digest: ${{ steps.get_digest.outputs.digest }}"
```

### How this works

- When you push to `main`, this workflow triggers.
- It checks out the repo.
- Logs in to Docker Hub using secrets (`DOCKER_USERNAME` & `DOCKER_PASSWORD`).
- Sets up Buildx (for multi-architecture builds if desired).
- Uses `docker/build-push-action` to build the image (using your `Dockerfile`) and push it, tagging both `latest` and the commit SHA.
- Then it uses `docker buildx imagetools inspect` to get the digest of the `sha` tag and outputs it.
- You can inspect that digest in the GitHub Actions logs.

You can extend this workflow further (for example, writing the digest into a deployment config repo, or triggering a deployment step) but the above is the core.

Make sure in your GitHub repo you configure secrets:

- `DOCKER_USERNAME = harystyles`
- `DOCKER_PASSWORD = <your Docker Hub password or access token>`

---

## 14. Best Practices, Caveats & Notes

Here are some additional tips and caution areas:

- **Pin by digest, not `:latest`** — in production, use `image@sha256:...` so you always know exactly what code is running.
- **Never build in production** — VMs / confidential environments should only pull and run images, not build them.
- **Don’t bake secrets into images** — use environment variables or secret management at runtime.
- **Use `.dockerignore` wisely** — exclude unnecessary files to keep build context small.
- **Cache dependencies** — copying `package.json` first helps speed builds when dependencies don’t change.
- **Be wary of environment variables at build vs runtime** — Vite is a build-time bundler: variables prefixed `VITE_` are baked in during build. So if your API URL is variable, you might need a strategy (e.g. use relative paths, or inject via a runtime proxy).
- **Routing fallback for SPA** — your `nginx.conf` must handle deep links (via `try_files … /index.html`).
- **If your app is served under a subpath** (not root), you may need to adjust `base` in `vite.config.ts` and Nginx upstream paths.
- **Health checks, monitoring** — in production you may add Docker `healthcheck` directives to confirm container health.
- **Image signing / verification** — for higher security you might sign your images (e.g. Cosign) and verify on the VM.
- **Versioning discipline** — always tag your images (e.g. `1.0.0`, `1.1.0`) and keep track of which digest corresponds to which version.
- **Rollback strategy** — keep old images / digests around so you can quickly revert by updating compose to previous digest.
- **Frontend + backend integration** — ensure your backend’s CORS settings allow calls from your frontend origin (both in dev and prod).
- **Local dev + API** — if your frontend calls the backend in dev, you might run both in Compose (frontend + backend) or use host networking / `host.docker.internal` for backend URL.
- **Resource constraints** — keep final image size small so pulling is fast.
- **Document the process** — in your README or a `DEPLOY.md` describe manual steps, how to get digest, how to deploy, etc.
