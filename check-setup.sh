#!/bin/bash

echo "🔍 Checking Brainstorm AI Grouper setup..."
echo ""

# Check backend .env
if [ -f "backend/.env" ]; then
    echo "✅ backend/.env exists"
    if grep -q "API_KEY=your_gemini_api_key_here" backend/.env; then
        echo "⚠️  Warning: API_KEY still has default value"
        echo "   Please edit backend/.env with your real API key"
    else
        echo "✅ API_KEY is configured"
    fi
else
    echo "❌ backend/.env not found"
    echo "   Run: cp backend/.env.example backend/.env"
fi

echo ""

# Check if Docker is running
if docker info > /dev/null 2>&1; then
    echo "✅ Docker is running"
else
    echo "❌ Docker is not running"
    echo "   Please start Docker Desktop"
    exit 1
fi

echo ""

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Containers are running"
    echo ""
    echo "Services status:"
    docker-compose ps
    echo ""
    echo "🌐 Application: http://localhost:5016"
    echo "🔧 Backend API: http://localhost:5016/api/health"
else
    echo "⚠️  Containers are not running"
    echo "   Run: docker-compose up -d"
fi

echo ""
echo "✅ Check complete!"
