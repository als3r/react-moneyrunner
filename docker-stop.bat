@echo off
REM Docker stop script for MoneyRunner application (Windows)

echo Stopping MoneyRunner Docker containers...

docker-compose down

echo Containers stopped. To remove volumes as well, run: docker-compose down -v
