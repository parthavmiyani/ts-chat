FROM node:18-alpine

ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /application
COPY package*.json ./
COPY . .

RUN npm install
RUN npm run build
CMD ["npm", "run", "prod"]
