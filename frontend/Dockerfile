# Build stage
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
ARG REACT_APP_STRIPE_PUBLISHABLE_KEY
ENV REACT_APP_STRIPE_PUBLISHABLE_KEY=$REACT_APP_STRIPE_PUBLISHABLE_KEY
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
RUN npm install

COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:alpine

RUN apk add --no-cache openssl && \
    mkdir -p /etc/letsencrypt/live/dendanskedonation.norwayeast.cloudapp.azure.com && \
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout /etc/letsencrypt/live/dendanskedonation.norwayeast.cloudapp.azure.com/privkey.pem \
      -out /etc/letsencrypt/live/dendanskedonation.norwayeast.cloudapp.azure.com/fullchain.pem \
      -subj "/CN=localhost"

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]