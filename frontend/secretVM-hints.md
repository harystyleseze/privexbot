What's Not Appropriate for SecretVM Deployment
SecretVM is designed for secure, reproducible, verifiable, production-ready container workloads. That means your Compose file needs to avoid features that introduce volatility or external dependency. Here’s the breakdown:

1. ❗ build: is not supported
   SecretVM does not support building Docker images at runtime. You must pre-build your image, push it to a registry (like Docker Hub), and only use image: in your Compose file.

So this:

app:
build:
context: .
dockerfile: Dockerfile
❌ Must be removed.

Instead, pre-build locally:

docker build -t harystyles/fetch-list-project:1.0.0 .
docker push harystyles/fetch-list-project:1.0.0
Then in your Compose file:

app:
image: harystyles/fetch-list-project:1.0.0 2. ⚠️ :latest image tag is discouraged
In confidential computing (like SecretVM), image immutability and reproducibility is essential. :latest can change silently over time, which breaks verifiability and potentially weakens security.

✅ Use SHA256 digest or pinned tags like:

image: harystyles/fetch-list-project@sha256:<digest>
To get the digest after pushing your image:

docker push harystyles/fetch-list-project:1.0.0
docker inspect --format='{{index .RepoDigests 0}}' harystyles/fetch-list-project:1.0.0 3. ❌ dev service is not suitable for SecretVM
The dev service:

Mounts local source code (.:/app)
Mounts node_modules
Runs npm install on every start
Uses a long-running dev server (npm run dev)
This is useful locally but insecure and unstable inside a confidential VM. It introduces:

Non-determinism
External dependencies (pulling from npm)
Local filesystem assumptions
✅ You should remove the dev service for SecretVM deployment. Instead:

Bundle everything in your production image.
Make the app ready to serve via npm start or another entrypoint.
Use ENV=production inside the Dockerfile (not Compose).
✅ Cleaned Up SecretVM-Ready Compose Example
Here’s an updated version of your Compose file tailored for SecretVM:

version: "3.8"

services:
app:
image: harystyles/fetch-list-project@sha256:your_actual_digest_here
ports: - "8080:80"
restart: unless-stopped
environment: - NODE_ENV=production
Important Notes:

Remove the build: section.
Replace :latest with a digest.
Remove development-time services like dev.
Optional: Add volume mounts or attestation files only if needed.
✅ Final Deployment Steps Recap
Build your image locally:
docker build -t harystyles/fetch-list-project:1.0.0 .
docker push harystyles/fetch-list-project:1.0.0
Get the digest:
docker inspect --format='{{index .RepoDigests 0}}' harystyles/fetch-list-project:1.0.0
Update your Compose file to use the digest or versioned tag.

Upload to SecretVM via the SecretAI Portal or CLI with this updated Compose file.
