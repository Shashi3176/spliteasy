FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y g++ build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run compile:cpp
RUN npm run build

CMD ["hostname", "0.0.0.0", "next", "start", "-p", "7860"]

ENV HOSTNAME="0.0.0.0"
ENV PORT=7860
EXPOSE 7860
CMD ["npm", "run", "start"]