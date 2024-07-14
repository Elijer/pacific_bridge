FROM node:latest

# Set the working directory
WORKDIR /code

# Add the source code to the container
ADD . /code

# Clear npm cache
RUN npm cache clean --force

# Remove any existing node_modules and package-lock.json
RUN rm -rf node_modules package-lock.json

# Install dependencies
RUN npm install

# Build the client
RUN cd client && npm i && npm run build

# Start the server
CMD ["node", "server/server.js"]