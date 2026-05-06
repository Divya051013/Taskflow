FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build /app/build
EXPOSE 3000
CMD ["sh", "-c", "serve -s /app/build -l tcp://0.0.0.0:${PORT:-3000}"]
