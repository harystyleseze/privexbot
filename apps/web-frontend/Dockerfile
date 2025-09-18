# Build stage
FROM node:22-alpine as builder

WORKDIR /app

# Copy root configuration files
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/web-frontend ./apps/web-frontend
COPY libs ./libs

# Build the app with explicit env
ENV NODE_ENV=production
RUN npx nx build web-frontend --configuration=production --verbose

# Production stage
FROM nginx:alpine

# Copy nginx config
COPY apps/web-frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist/apps/web-frontend /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
