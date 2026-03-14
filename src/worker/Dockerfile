# /worker/Dockerfile
FROM node:25-alpine

# Install Git
RUN apk add --no-cache git

WORKDIR /app

# Copy your internal script that handles cloning/building/uploading
COPY builder.js .
COPY package.json .

RUN npm install @aws-sdk/client-s3 mime-types

# The script will use environment variables (GIT_REPOSITORY_URL) passed by the API
CMD ["node", "builder.js"]