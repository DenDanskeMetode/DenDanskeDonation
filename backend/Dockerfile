# Use Node
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the code
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]