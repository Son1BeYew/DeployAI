FROM nginx:alpine

# Copy client files to nginx html directory
COPY . /usr/share/nginx/html/

# Create admin directory if not exists
RUN mkdir -p /usr/share/nginx/html/admin

# Remove default nginx index
RUN rm -f /usr/share/nginx/html/index.html.default

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


