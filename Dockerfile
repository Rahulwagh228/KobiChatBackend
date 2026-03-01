# Stage 1: Build Stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Stage 2: Production Stage
FROM node:20-alpine

# Set node environment to production
ENV NODE_ENV=production

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled files from the build stage
COPY --from=build /usr/src/app/dist ./dist

# Expose the application port (default for yours is 4000)
EXPOSE 4000

# Set start command
CMD ["node", "dist/index.js"]
