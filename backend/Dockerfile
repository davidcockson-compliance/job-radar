FROM ghcr.io/puppeteer/puppeteer:21.5.2

# Switch to root to install dependencies if needed (image creates 'pptruser')
USER root

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
# Using 'npm ci' for reliable builds
RUN npm ci

# Copy source code and Prisma schema
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Create uploads directory and fix permissions
RUN mkdir -p /usr/src/app/uploads && chown -R pptruser:pptruser /usr/src/app

# Switch back to non-root user
USER pptruser

# Expose API port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
