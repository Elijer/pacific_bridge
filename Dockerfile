FROM node:latest

# Set the working directory
WORKDIR /code

# Add the source code to the container
ADD . /code

# Install dependencies
RUN npm install

# Build the client
RUN cd client && npm i && npm run build

# Verify the file structure (for debugging purposes)
RUN ls -la /code
RUN ls -la /code/server

# Start the server
CMD ["node", "server/index.js"]