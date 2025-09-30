#!/bin/bash

# RFP Management Backend Startup Script
# This script helps you get the backend up and running quickly

echo "🚀 Starting RFP Management Backend Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version $(node -v) is compatible"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_status "npm is available"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_status "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_status "Dependencies already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        print_status ".env file created from template"
        print_warning "Please edit .env file with your configuration before starting the server"
    else
        print_error "env.example file not found. Cannot create .env file."
        exit 1
    fi
else
    print_status ".env file exists"
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    mkdir -p uploads
    print_status "Created uploads directory"
fi

# Check if MongoDB is running (optional check)
print_info "Checking MongoDB connection..."
if command -v mongosh &> /dev/null; then
    # MongoDB Shell is available, try to connect
    if mongosh --eval "db.runCommand('ping')" --quiet &> /dev/null; then
        print_status "MongoDB is running and accessible"
    else
        print_warning "Cannot connect to MongoDB. Make sure MongoDB is running."
        print_info "You can start MongoDB with: mongod"
    fi
elif command -v mongo &> /dev/null; then
    # Legacy MongoDB shell
    if mongo --eval "db.runCommand('ping')" --quiet &> /dev/null; then
        print_status "MongoDB is running and accessible"
    else
        print_warning "Cannot connect to MongoDB. Make sure MongoDB is running."
        print_info "You can start MongoDB with: mongod"
    fi
else
    print_warning "MongoDB shell not found. Cannot verify MongoDB connection."
    print_info "Make sure MongoDB is installed and running."
fi

echo ""
print_info "Setup complete! You can now start the server with:"
echo -e "${BLUE}  npm run dev    ${NC}# Development mode with auto-reload"
echo -e "${BLUE}  npm start      ${NC}# Production mode"
echo ""
print_info "The server will be available at: http://localhost:8000"
print_info "API endpoints will be available at: http://localhost:8000/api"
print_info "Health check: http://localhost:8000/health"
echo ""

# Ask if user wants to start the server now
read -p "Do you want to start the development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Starting development server..."
    npm run dev
fi
