FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
RUN npm install -g serve
COPY --from=build /app/build /app/build
EXPOSE 3000
CMD ["serve", "-s", "/app/build", "-l", "3000"]
