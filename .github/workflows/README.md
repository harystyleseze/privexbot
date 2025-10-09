# GitHub Actions Workflows

This directory contains CI/CD workflows for the PrivexBot project.

## Available Workflows

### `frontend-docker.yml` - Frontend Docker Build and Push

Automatically builds and pushes the frontend Docker image to Docker Hub.

#### Triggers

- **Push to `main`**: Builds production image with timestamp version
- **Push to `dev`**: Builds development image with dev tag
- **Manual dispatch**: Build with custom version and environment

#### Required Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `DOCKER_USERNAME` | `harystyles` | Docker Hub username |
| `DOCKER_PASSWORD` | `<your-token>` | Docker Hub access token or password |

#### How to Set Up Secrets

1. Go to your GitHub repository
2. Click **Settings**
3. Go to **Secrets and variables → Actions**
4. Click **New repository secret**
5. Add `DOCKER_USERNAME` with value `harystyles`
6. Add `DOCKER_PASSWORD` with your Docker Hub token

**Getting Docker Hub Token:**
1. Login to [Docker Hub](https://hub.docker.com)
2. Go to **Account Settings → Security**
3. Click **New Access Token**
4. Name it (e.g., "GitHub Actions")
5. Copy the token (you won't see it again!)
6. Use this token as `DOCKER_PASSWORD`

#### Manual Trigger

To manually trigger a build:

1. Go to **Actions** tab in GitHub
2. Click **Frontend - Build and Push Docker Image**
3. Click **Run workflow**
4. Fill in:
   - **Version**: Semantic version (e.g., `0.1.0`, `0.2.0-rc.1`)
   - **Environment**: `development`, `staging`, or `production`
5. Click **Run workflow**

#### Workflow Output

After the workflow completes:

1. Check the **Actions** tab
2. Click on the completed workflow run
3. View the **Summary** tab for:
   - Image tags
   - Image digest (for SecretVM)
   - Deployment instructions
   - Link to Docker Hub

4. Download artifacts:
   - `image-info.json` - Machine-readable image information
   - `deploy-instructions.md` - Deployment guide

#### Using the Digest

The workflow outputs a digest in the summary. Copy this digest and update your `docker-compose.prod.yml`:

```yaml
services:
  frontend-prod:
    image: harystyles/privexbot-frontend@sha256:abc123...
```

## Workflow Features

✅ **Multi-environment support** - dev, staging, production
✅ **Semantic versioning** - Automated and manual versions
✅ **Digest pinning** - SecretVM compatible
✅ **Build caching** - Faster builds with GitHub Actions cache
✅ **Deployment artifacts** - Downloadable deployment info
✅ **Summary output** - Clear deployment instructions

## Troubleshooting

### Build fails with "denied: requested access to the resource is denied"

**Problem**: Docker Hub credentials are incorrect or missing.

**Solution**:
1. Verify `DOCKER_USERNAME` secret is set to `harystyles`
2. Verify `DOCKER_PASSWORD` is a valid Docker Hub token
3. Check the token has write permissions

### Build succeeds but can't find the digest

**Problem**: Digest extraction failed.

**Solution**:
1. Check the workflow logs
2. Look for the "Get image digest" step
3. If empty, the image may not have been pushed
4. Verify Docker Hub credentials and retry

### Manual trigger doesn't appear

**Problem**: Workflow file may be on a different branch.

**Solution**:
1. Ensure `.github/workflows/frontend-docker.yml` is on the `main` branch
2. Push the workflow file to `main`
3. Refresh the Actions tab

## Best Practices

1. **Always use the digest** from workflow output for production deployments
2. **Download artifacts** for record-keeping
3. **Tag Git commits** with the version used
4. **Test locally** before relying on CI builds
5. **Keep tokens secure** - never commit them to the repository

## Adding More Workflows

To add more workflows:

1. Create a new `.yml` file in this directory
2. Define triggers, jobs, and steps
3. Commit and push
4. The workflow will appear in the Actions tab

Example workflow names:
- `backend-docker.yml` - Backend Docker builds
- `frontend-tests.yml` - Frontend unit tests
- `e2e-tests.yml` - End-to-end tests
- `deploy-production.yml` - Automated deployment

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
