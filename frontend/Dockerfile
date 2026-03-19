# Build stage
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
ARG REACT_APP_STRIPE_PUBLISHABLE_KEY
ENV REACT_APP_STRIPE_PUBLISHABLE_KEY=$REACT_APP_STRIPE_PUBLISHABLE_KEY
RUN npm install

COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]