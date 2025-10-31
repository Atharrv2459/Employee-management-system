# Base image
FROM node:18

# Working directory
WORKDIR /usr/src/app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Expose backend port
EXPOSE 5001

# Start the server
CMD ["npm", "start"]
