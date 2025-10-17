# Testing Guide

Comprehensive testing guide for the PrivexBot Frontend across all deployment environments.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Local Testing](#local-testing)
3. [Development Environment Testing](#development-environment-testing)
4. [Production Build Testing](#production-build-testing)
5. [SecretVM Deployment Testing](#secretvm-deployment-testing)
6. [Automated Testing](#automated-testing)
7. [Performance Testing](#performance-testing)

---

## Testing Strategy

### Test Pyramid

```
                    ┌─────────────┐
                    │   E2E Tests │
                    └─────────────┘
                  ┌───────────────────┐
                  │ Integration Tests │
                  └───────────────────┘
              ┌───────────────────────────┐
              │      Unit Tests           │
              └───────────────────────────┘
```

### Testing Environments

| Environment | Purpose | Tools |
|------------|---------|-------|
| **Local** | Unit tests, component tests | Vitest, React Testing Library |
| **Development** | Integration testing, hot reload | Docker Compose (dev) |
| **Production** | Build validation, performance | Docker Compose (standalone) |
| **SecretVM** | Production deployment, TLS | Docker Compose (SecretVM) |

---

## Local Testing

### Prerequisites

```bash
# Verify Node.js installation
node --version
# Expected: v20.x.x

# Verify npm
npm --version
# Expected: 9.x.x or higher
```

### Install Dependencies

```bash
# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

### Run Unit Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# View coverage report
open coverage/index.html
```

### Run Linting

```bash
# Check for linting issues
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Type Checking

```bash
# Run TypeScript type checking
npm run type-check

# Or use tsc directly
npx tsc --noEmit
```

### Component Testing

```bash
# Start Storybook (if configured)
npm run storybook

# Build Storybook
npm run build-storybook
```

---

## Development Environment Testing

### Start Development Environment

```bash
# Using helper script
./scripts/docker/dev.sh up

# Or using Docker Compose directly
docker compose -f docker-compose.dev.yml up
```

### Access Points

- **Frontend**: http://localhost:5173
- **Hot Reload**: ✅ Enabled

### Verify Hot Reload

1. Open http://localhost:5173 in browser
2. Edit a file in `src/` (e.g., change a text)
3. Save the file
4. Verify changes appear instantly in browser without refresh

### Test Volume Mounts

```bash
# Check volume is mounted correctly
docker compose -f docker-compose.dev.yml exec dev ls -la /app/src

# Verify node_modules is preserved
docker compose -f docker-compose.dev.yml exec dev ls -la /app/node_modules
```

### Development Environment Checklist

- [ ] Container starts successfully
- [ ] Hot reload works (changes reflect instantly)
- [ ] No errors in browser console
- [ ] API connections work (if backend is running)
- [ ] All routes are accessible
- [ ] TypeScript compilation succeeds

### View Development Logs

```bash
# Follow logs
docker compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker compose -f docker-compose.dev.yml logs dev
```

---

## Production Build Testing

### Build Production Image

```bash
# Build the image
docker build -t privexbot-frontend-test:latest .

# Or using the script
./scripts/docker/build-push.sh --test
```

### Run Production Build Locally

```bash
# Run container
docker run -d -p 8080:80 --name frontend-test privexbot-frontend-test:latest

# View logs
docker logs -f frontend-test

# Stop and remove
docker stop frontend-test && docker rm frontend-test
```

### Test Production Build

#### 1. Basic Functionality

```bash
# Test homepage loads
curl -I http://localhost:8080
# Expected: HTTP/1.1 200 OK

# Test HTML content
curl http://localhost:8080 | grep "<title>"
# Should show page title

# Test assets load
curl -I http://localhost:8080/assets/index-*.js
# Expected: HTTP/1.1 200 OK
```

#### 2. SPA Routing

```bash
# Test client-side routes return index.html
curl http://localhost:8080/dashboard
curl http://localhost:8080/workspaces
curl http://localhost:8080/settings

# All should return the same index.html (200 OK, not 404)
```

#### 3. MIME Types

```bash
# Verify JavaScript MIME type
curl -I http://localhost:8080/assets/index-*.js | grep "content-type"
# Expected: application/javascript

# Verify CSS MIME type
curl -I http://localhost:8080/assets/index-*.css | grep "content-type"
# Expected: text/css
```

#### 4. Gzip Compression

```bash
# Test gzip encoding
curl -I -H "Accept-Encoding: gzip" http://localhost:8080/assets/index-*.js | grep "content-encoding"
# Expected: gzip
```

#### 5. Caching Headers

```bash
# Check cache headers for assets
curl -I http://localhost:8080/assets/index-*.js | grep -i cache
# Should show cache-control headers
```

### Using Diagnostic Script

```bash
# Run comprehensive diagnostics
./scripts/docker/diagnose.sh http://localhost:8080

# Check output for:
# ✅ HTTP 200 responses
# ✅ Correct MIME types
# ✅ Gzip enabled
# ✅ Assets loading
```

### Production Build Checklist

- [ ] Build completes without errors
- [ ] Image size is reasonable (~50MB or less)
- [ ] Container starts successfully
- [ ] Homepage loads (200 OK)
- [ ] All assets load correctly
- [ ] SPA routing works (no 404s)
- [ ] MIME types are correct
- [ ] Gzip compression enabled
- [ ] No console errors in browser
- [ ] All routes accessible

---

## SecretVM Deployment Testing

### Pre-Deployment Testing

Before deploying to SecretVM, test locally with the SecretVM compose file:

```bash
# Create a test directory
mkdir -p /tmp/secretvm-test
cd /tmp/secretvm-test

# Copy the SecretVM compose file
cp /Users/user/Downloads/privexbot/privexbot-mvp/privexbot/frontend/docker-compose.secretvm.yml docker-compose.yml

# Note: This won't work fully without SecretVM certs, but validates syntax
docker compose config
# Should output valid YAML without errors
```

### Post-Deployment Testing

#### 1. SSH into SecretVM

```bash
ssh user@silver-hedgehog.vm.scrtlabs.com
```

#### 2. Check Container Status

```bash
cd /mnt/secure/docker_wd/

# Check all containers are running
docker compose ps
# Expected: Both app and traefik should be "Up"

# Check container health
docker ps
```

#### 3. Verify Traefik Discovery

**Critical Check** - Traefik must discover the frontend container:

```bash
# Check Traefik logs for Docker provider
docker logs docker_wd-traefik-1 | grep "provider"

# MUST SEE these lines:
# ✅ "Starting provider *docker.Provider"
# ✅ "Creating router app@docker"
# ✅ "Creating service app@docker"

# ❌ BAD if you ONLY see:
# "Configuration loaded from flags."
```

If Docker provider is NOT starting:
```bash
# Check Docker socket permissions
docker exec docker_wd-traefik-1 ls -la /var/run/docker.sock

# Check TLS config exists
docker exec docker_wd-traefik-1 ls -la /etc/traefik/dynamic/
# Should show: tls.yml

# Restart Traefik
docker compose restart traefik
```

#### 4. Test Direct Container Access

```bash
# Test frontend container directly
curl http://localhost:8080/
# Expected: HTML content

# Test from Traefik container
docker exec docker_wd-traefik-1 wget -qO- http://app
# Expected: HTML content
```

#### 5. Test via Traefik (HTTP)

```bash
# Test HTTP endpoint
curl -H "Host: silver-hedgehog.vm.scrtlabs.com" http://localhost
# Expected: HTML content or redirect to HTTPS
```

#### 6. Test HTTPS

```bash
# Test HTTPS endpoint (from SecretVM)
curl https://silver-hedgehog.vm.scrtlabs.com
# Expected: HTML content

# Check certificate
echo | openssl s_client -connect silver-hedgehog.vm.scrtlabs.com:443 -servername silver-hedgehog.vm.scrtlabs.com 2>/dev/null | openssl x509 -noout -dates
```

#### 7. Browser Testing

From your local machine:

1. **Open browser** to: https://silver-hedgehog.vm.scrtlabs.com
2. **Check DevTools Console**: No errors
3. **Check Network Tab**:
   - All resources load with 200 OK
   - Connection is HTTPS with valid certificate
4. **Test Navigation**: All routes work correctly
5. **Test Functionality**: Forms, buttons, API calls work

### Using Diagnostic Script Remotely

```bash
# On your local machine, run diagnostics against SecretVM
./scripts/docker/diagnose.sh https://silver-hedgehog.vm.scrtlabs.com

# Review output for any issues
```

### SecretVM Testing Checklist

- [ ] SSH access to SecretVM works
- [ ] Both containers (app + traefik) are running
- [ ] Traefik Docker provider started successfully
- [ ] Traefik created router and service
- [ ] Direct container access works (port 8080)
- [ ] Access via Traefik works (port 80)
- [ ] HTTPS works with valid certificate (port 443)
- [ ] Browser loads page successfully
- [ ] No console errors
- [ ] All assets load correctly
- [ ] All routes accessible
- [ ] API connections work

### Common SecretVM Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions to:
- 504 Gateway Timeout
- Traefik not discovering containers
- TLS certificate errors
- Container restart loops

---

## Automated Testing

### GitHub Actions CI/CD

Create `.github/workflows/test.yml`:

```yaml
name: Test

on:
  pull_request:
  push:
    branches: [main, dev]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t test .

      - name: Run container
        run: |
          docker run -d -p 8080:80 --name test test
          sleep 5

      - name: Test container
        run: |
          curl -f http://localhost:8080 || exit 1
          docker logs test

      - name: Stop container
        run: docker stop test
```

### Pre-commit Hooks

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run type-check
npm test -- --run
```

---

## Performance Testing

### Lighthouse Testing

```bash
# Install Lighthouse
npm install -g lighthouse

# Run Lighthouse audit
lighthouse https://silver-hedgehog.vm.scrtlabs.com --output html --output-path ./lighthouse-report.html

# Open report
open lighthouse-report.html
```

**Target Scores**:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

### Bundle Size Analysis

```bash
# Build with analysis
npm run build

# Check output for bundle sizes
# Look for warnings about large chunks

# Use bundle analyzer (if configured)
npm run analyze
```

**Guidelines**:
- Main bundle: < 200KB (gzipped)
- Vendor bundle: < 500KB (gzipped)
- Total initial load: < 1MB (gzipped)

### Load Testing

```bash
# Install Apache Bench
# macOS: brew install httpd
# Linux: sudo apt-get install apache2-utils

# Run load test (100 requests, 10 concurrent)
ab -n 100 -c 10 https://silver-hedgehog.vm.scrtlabs.com/

# Review results:
# - Time per request
# - Requests per second
# - Failed requests (should be 0)
```

### Network Performance

```bash
# Test asset loading speed
curl -w "@curl-format.txt" -o /dev/null -s https://silver-hedgehog.vm.scrtlabs.com/assets/index-*.js

# Create curl-format.txt:
cat > curl-format.txt << 'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
   time_pretransfer:  %{time_pretransfer}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```

---

## Testing Best Practices

### 1. Test in All Environments

- ✅ Always test locally before building Docker image
- ✅ Test production build locally before deploying
- ✅ Test on SecretVM after deployment

### 2. Automated Testing

- ✅ Set up CI/CD pipeline
- ✅ Run tests on every PR
- ✅ Require passing tests before merge

### 3. Manual Testing

- ✅ Test all user flows manually
- ✅ Test on different browsers
- ✅ Test on different devices (desktop, mobile)

### 4. Performance Monitoring

- ✅ Run Lighthouse audits regularly
- ✅ Monitor bundle sizes
- ✅ Track load times

### 5. Security Testing

- ✅ Scan Docker images for vulnerabilities
- ✅ Test TLS configuration
- ✅ Validate security headers

---

## Troubleshooting Tests

### Tests Failing Locally

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Docker Build Fails

```bash
# Build with no cache
docker build --no-cache -t test .

# Check logs
docker logs <container>
```

### Container Tests Fail

```bash
# Check container is running
docker ps

# Check container logs
docker logs <container>

# Access container shell
docker exec -it <container> sh

# Test from inside container
wget -qO- http://localhost
```

---

## Additional Resources

- [Docker Guide](./DOCKER.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Quick Start Guide](./QUICK-START.md)
- [Main README](../README.md)
