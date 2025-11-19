#!/bin/bash

echo "🚀 Brainstorm AI Grouper - Quick Start"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No se encontró archivo .env"
    echo ""
    read -p "¿Tienes una API Key de Google Gemini? (s/n): " tiene_key
    
    if [ "$tiene_key" = "s" ] || [ "$tiene_key" = "S" ]; then
        echo ""
        read -p "Ingresa tu API Key: " api_key
        echo "API_KEY=$api_key" > .env
        echo "✅ Archivo .env creado"
    else
        echo ""
        echo "❌ Necesitas una API Key para continuar"
        echo "Obtén una aquí: https://makersuite.google.com/app/apikey"
        echo ""
        echo "Creando .env.example para referencia..."
        cp .env.example .env
        echo ""
        echo "Por favor edita el archivo .env y añade tu API Key"
        exit 1
    fi
fi

echo ""
echo "🐳 Iniciando Docker Compose..."
echo ""

docker-compose up --build

echo ""
echo "✅ Aplicación iniciada en http://localhost:5016"
