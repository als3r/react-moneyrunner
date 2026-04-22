#!/bin/bash

# Docker startup script for MoneyRunner application

echo "Starting MoneyRunner Docker containers..."

# Copy Docker environment file
if [ ! -f backend/.env ]; then
    cp backend/.env.docker backend/.env
    echo "Created .env file from .env.docker"
fi

# Build and start containers
docker-compose up -d --build

echo "Waiting for database to be ready..."
sleep 10

# Run Laravel migrations
echo "Running Laravel migrations..."
docker-compose exec backend php artisan migrate --force

echo "Running database seeders..."
docker-compose exec backend php artisan db:seed --force

echo "Generating application key..."
docker-compose exec backend php artisan key:generate

echo "Clearing and caching configuration..."
docker-compose exec backend php artisan config:cache
docker-compose exec backend php artisan route:cache

echo "MoneyRunner is now running!"
echo "Frontend: http://localhost:5174"
echo "Backend API: http://localhost:8001/api"
echo "Database: localhost:3307"
