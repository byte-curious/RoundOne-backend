FROM node:20-bookworm-slim

# 1. Install C++, Python, and full headless Java Development Kit (javac + java)
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    python3 \
    default-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Cache npm dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# 3. Generate Prisma client
RUN npx prisma generate

# 4. Copy rest of the code and compile TypeScript
COPY . .
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/index.js"]
