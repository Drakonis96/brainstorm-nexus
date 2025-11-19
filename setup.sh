#!/bin/bash

echo "🚀 Setting up Brainstorm AI Grouper..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    echo "   Visit: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install it first."
    exit 1
fi

echo "✅ Docker is installed"

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found"
    echo "📝 Creating backend/.env from template..."
    cp backend/.env.example backend/.env
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and add your Google Gemini API Key"
    echo "   Get your API key from: https://makersuite.google.com/app/apikey"
    echo ""
    read -p "Press Enter after you've added your API key to backend/.env..."
fi

echo "🔨 Building Docker containers..."
docker-compose build

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "✅ Services are running!"
echo ""
echo "🌐 Access the application at: http://localhost:5016"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f          # View logs"
echo "  docker-compose down             # Stop services"
echo "  docker-compose restart          # Restart services"
echo ""
