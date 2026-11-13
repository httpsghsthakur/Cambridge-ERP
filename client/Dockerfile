# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
# Pass in backend API URL if needed at build time
ENV REACT_APP_API_URL=/api
RUN npm run build

# Serve stage using NGINX
FROM nginx:alpine

# Copy built assets from build stage to nginx serving directory
COPY --from=build /app/build /usr/share/nginx/html

# Add custom nginx configuration to handle React Router (SPA routing)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://server:5000/api/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    } \
    location /uploads/ { \
        proxy_pass http://server:5000/uploads/; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
