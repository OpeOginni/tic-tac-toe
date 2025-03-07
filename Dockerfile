FROM node:18-alpine as builder

# Install bun
RUN npm install -g bun

WORKDIR /app

# Copy only package files first for better layer caching
COPY package*.json bun.lockb ./
RUN bun install

# Copy only the server folder
COPY server ./server
RUN npm run server:build

# Start a new stage for a smaller final image
FROM node:18-alpine

# Install bun
RUN npm install -g bun

WORKDIR /app

# Copy only production dependencies
COPY package*.json bun.lockb ./
RUN bun install --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/server.js"] 