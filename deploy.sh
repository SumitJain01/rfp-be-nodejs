#!/bin/bash

# RFP Management System - Vercel Deployment Script
# This script helps you deploy both frontend and backend to Vercel

echo "🚀 RFP Management System - Vercel Deployment Script"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

echo ""
echo "📋 Deployment Options:"
echo "1. Deploy Backend only"
echo "2. Deploy Frontend only"
echo "3. Deploy Both (Backend first, then Frontend)"
echo "4. Exit"
echo ""

read -p "Select an option (1-4): " choice

case $choice in
    1)
        echo "🔧 Deploying Backend..."
        cd backend
        vercel --prod
        ;;
    2)
        echo "🎨 Deploying Frontend..."
        cd frontend
        vercel --prod
        ;;
    3)
        echo "🔧 Deploying Backend first..."
        cd backend
        vercel --prod
        echo ""
        echo "🎨 Now deploying Frontend..."
        cd ../frontend
        vercel --prod
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📝 Next steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Configure MongoDB Atlas"
echo "3. Update CORS settings with production URLs"
echo "4. Test your deployed application"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md"
