# Build stage for admin-frontend
FROM node:22-alpine as builder

WORKDIR /app

# Copy root configuration files
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Install dependencies
RUN npm ci

# Copy admin-frontend source code
COPY apps/admin-frontend ./apps/admin-frontend
COPY libs ./libs

# Build the admin-frontend app
ENV NODE_ENV=production
RUN npx nx build admin-frontend

# Production stage
FROM nginx:alpine

# Copy nginx config for admin-frontend
COPY apps/admin-frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist/apps/admin-frontend /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]