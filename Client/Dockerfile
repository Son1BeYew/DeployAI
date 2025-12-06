FROM nginx:alpine

# Copy nginx configuration
COPY ../nginx.conf /etc/nginx/conf.d/default.conf

# Copy client files
COPY . /usr/share/nginx/html

# Create admin directory if not exists
RUN mkdir -p /usr/share/nginx/html/admin

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
