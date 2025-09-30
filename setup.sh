#!/bin/bash

# RFP Management System Setup Script

echo "========================================="
echo "RFP Management System Setup"
echo "========================================="

# Check if MongoDB is running
echo "Checking MongoDB connection..."
if ! mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    echo "⚠️  MongoDB is not running or not accessible."
    echo "Please ensure MongoDB is installed and running on localhost:27017"
    echo "You can install MongoDB from: https://docs.mongodb.com/manual/installation/"
    echo ""
    echo "To start MongoDB:"
    echo "  - macOS (with Homebrew): brew services start mongodb-community"
    echo "  - Linux (systemd): sudo systemctl start mongod"
    echo "  - Windows: Start MongoDB as a service"
    echo ""
    read -p "Press Enter to continue anyway or Ctrl+C to exit..."
else
    echo "✅ MongoDB is running"
fi

echo ""
echo "Setting up Backend..."
echo "===================="

cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp env.example .env
    echo "✅ Created .env file. Please edit it with your configuration."
else
    echo "✅ .env file already exists"
fi

# Create upload directory
mkdir -p uploads
echo "✅ Created uploads directory"

cd ..

echo ""
echo "Setting up Frontend..."
echo "====================="

cd frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Create .env.local file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cp env.example .env.local
    echo "✅ Created .env.local file"
else
    echo "✅ .env.local file already exists"
fi

cd ..

echo ""
echo "========================================="
echo "Setup Complete! 🎉"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your MongoDB connection string and email settings"
echo "2. Edit frontend/.env.local if you need to change the API URL"
echo ""
echo "To start the application:"
echo "1. Start the backend:"
echo "   cd backend && ./start.sh"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend && ./start.sh"
echo ""
echo "3. Open your browser and go to:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API docs: http://localhost:8000/docs"
echo ""
echo "Default test users (create via registration):"
echo "- Buyer: username=buyer1, email=buyer@example.com"
echo "- Supplier: username=supplier1, email=supplier@example.com"
echo ""
echo "Happy RFP managing! 🚀"
