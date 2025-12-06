FROM nginx:alpine

# Copy client files first
COPY . /usr/share/nginx/html

# Create admin directory if not exists
RUN mkdir -p /usr/share/nginx/html/admin

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
