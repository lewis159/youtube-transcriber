FROM node:24-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY --from=0 /app/.next/standalone ./
COPY --from=0 /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
