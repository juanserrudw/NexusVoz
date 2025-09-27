# Multi-stage build for React app
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app for production
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built app to nginx html directory
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run/nginx

# Set proper permissions for nginx directories
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run/nginx /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx (as root - this is required)
CMD ["nginx", "-g", "daemon off;"]











# # Multi-stage build for React app
# FROM node:18-alpine as build

# # Set working directory
# WORKDIR /app

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm ci --only=production

# # Copy source code
# COPY . .

# # Build the app for production
# RUN npm run build

# # Production stage with nginx
# FROM nginx:alpine

# # Remove default nginx config
# RUN rm /etc/nginx/conf.d/default.conf

# # Copy built app to nginx html directory
# COPY --from=build /app/build /usr/share/nginx/html

# # Copy custom nginx configuration
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Expose port 80
# EXPOSE 80

# # Start nginx
# CMD ["nginx", "-g", "daemon off;"]