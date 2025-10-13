#!/bin/bash
# Local deployment script using Docker

set -e

echo "🚀 TosmTracker Local Deployment"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your configuration."
    echo "   Especially change JWT_SECRET!"
    exit 1
fi

# Run deployment check
if [ -f "scripts/deploy-check.sh" ]; then
    echo "Running pre-deployment checks..."
    bash scripts/deploy-check.sh || {
        echo ""
        echo "❌ Deployment checks failed. Fix errors above."
        exit 1
    }
    echo ""
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Build and start
echo "Building and starting containers..."
docker-compose up --build -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run migrations
echo "Running database migrations..."
docker-compose exec -T app npx prisma migrate deploy

echo ""
echo "================================"
echo "✅ Deployment complete!"
echo ""
echo "🌐 Application: http://localhost:8080"
echo "🗄️  Database: localhost:5432"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop: docker-compose down"
echo ""
