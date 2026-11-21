# ADNETIKS Production Container (Cloud Hosting OR 1-Click Independent Self-Host)
# Includes Node 22 + Headless Chromium for Multi-Page Website Brand DNA Scanning

FROM node:22-slim

# Install Chromium and fonts for built-in zero-cost CDP Website Scanner
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (cached Docker layer)
COPY package*.json ./
RUN npm ci

# Copy application source and compile React UI bundle
COPY . .
RUN npm run build

# Ensure persistent workspace & media vault folder exists
RUN mkdir -p /app/.adnetiks-data/media

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV ADNETIKS_DEPLOY_MODE=docker
ENV ADNETIKS_CHROME_PATH=/usr/bin/chromium

VOLUME ["/app/.adnetiks-data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
