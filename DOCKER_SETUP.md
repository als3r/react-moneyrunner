# MoneyRunner Docker Setup

This guide will help you set up and run the MoneyRunner application using Docker containers with MariaDB database.

## Prerequisites

- Docker Desktop installed and running
- Git (for cloning the repository)

## Quick Start

### Windows Users

1. Run the startup script:
   ```cmd
   docker-start.bat
   ```

2. This will:
   - Build all Docker containers
   - Start MariaDB, Laravel backend, Nginx, and React frontend
   - Run database migrations and seeders
   - Configure Laravel environment

### Linux/Mac Users

1. Make the script executable:
   ```bash
   chmod +x docker-start.sh
   ```

2. Run the startup script:
   ```bash
   ./docker-start.sh
   ```

## Manual Setup

If you prefer to set up manually:

1. **Copy environment file:**
   ```cmd
   copy backend\.env.docker backend\.env
   ```

2. **Build and start containers:**
   ```cmd
   docker-compose up -d --build
   ```

3. **Wait for database to be ready** (about 10 seconds)

4. **Run Laravel migrations:**
   ```cmd
   docker-compose exec backend php artisan migrate --force
   ```

5. **Run database seeders:**
   ```cmd
   docker-compose exec backend php artisan db:seed --force
   ```

6. **Generate application key:**
   ```cmd
   docker-compose exec backend php artisan key:generate
   ```

7. **Cache configuration:**
   ```cmd
   docker-compose exec backend php artisan config:cache
   docker-compose exec backend php artisan route:cache
   ```

## Access the Application

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:8001/api
- **Database**: localhost:3307
  - Database: moneyrunner
  - Username: moneyrunner
  - Password: moneyrunner
  - Root password: rootpassword

## Docker Services

The docker-compose.yml includes:

1. **MariaDB** - Database server (port 3307)
2. **Backend** - Laravel PHP-FPM (port 9000)
3. **Nginx** - Web server for Laravel (port 8001)
4. **Frontend** - React development server (port 5174)

## Common Commands

### Stop all containers:
```cmd
docker-stop.bat
```

### View container logs:
```cmd
docker-compose logs -f
```

### Restart specific service:
```cmd
docker-compose restart backend
```

### Access backend container shell:
```cmd
docker-compose exec backend bash
```

### Access database container:
```cmd
docker-compose exec mariadb mysql -u moneyrunner -pmoneyrunner moneyrunner
```

### Rebuild containers:
```cmd
docker-compose up -d --build
```

## Troubleshooting

### Port Conflicts
If you have port conflicts, modify the ports in `docker-compose.yml`:
```yaml
services:
  mariadb:
    ports:
      - "3307:3306"  # Change 3306 to 3307
  nginx:
    ports:
      - "8001:80"    # Change 8000 to 8001
  frontend:
    ports:
      - "5174:5173"  # Change 5173 to 5174
```

### Database Connection Issues
If you encounter database connection issues:
1. Ensure MariaDB container is running: `docker-compose ps`
2. Check MariaDB logs: `docker-compose logs mariadb`
3. Wait a bit longer for database initialization
4. Restart containers: `docker-compose restart`

### Permission Issues (Linux/Mac)
If you encounter permission issues with storage directories:
```bash
docker-compose exec backend chown -R www-data:www-data /var/www/html/storage
docker-compose exec backend chmod -R 755 /var/www/html/storage
```

## Development Workflow

### Running Laravel Artisan Commands
```cmd
docker-compose exec backend php artisan [command]
```

Example:
```cmd
docker-compose exec backend php artisan make:migration create_new_table
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan tinker
```

### Running NPM Commands in Frontend
```cmd
docker-compose exec frontend npm [command]
```

Example:
```cmd
docker-compose exec frontend npm install
docker-compose exec frontend npm run build
```

## Database Backup/Restore

### Backup:
```cmd
docker-compose exec mariadb mysqldump -u moneyrunner -pmoneyrunner moneyrunner > backup.sql
```

### Restore:
```cmd
docker-compose exec -T mariadb mysql -u moneyrunner -pmoneyrunner moneyrunner < backup.sql
```

## Clean Up

To remove all containers, networks, and volumes:
```cmd
docker-compose down -v
```

To remove all Docker images:
```cmd
docker system prune -a
```

## Production Deployment

For production deployment, you should:

1. Use production-ready images
2. Configure environment variables properly
3. Use secrets management for sensitive data
4. Enable HTTPS
5. Configure proper logging and monitoring
6. Use a reverse proxy like Traefik or Nginx
7. Implement proper backup strategies
