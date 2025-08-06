#!/bin/bash

# 8Solve AI SaaS Dashboard Setup Script
# This script helps set up the database and initial configuration

set -e

echo "🚀 8Solve AI SaaS Dashboard Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if MySQL is installed and running
check_mysql() {
    print_status "Checking MySQL installation..."
    
    if ! command -v mysql &> /dev/null; then
        print_error "MySQL is not installed. Please install MySQL and try again."
        exit 1
    fi
    
    if ! mysqladmin ping &> /dev/null; then
        print_error "MySQL server is not running. Please start MySQL and try again."
        exit 1
    fi
    
    print_success "MySQL is installed and running"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js (version 18+) and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Check if pnpm is installed
check_pnpm() {
    print_status "Checking pnpm installation..."
    
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm
    fi
    
    print_success "pnpm is available"
}

# Get MySQL credentials
get_mysql_credentials() {
    echo
    print_status "MySQL Database Setup"
    echo "Please provide your MySQL credentials:"
    
    read -p "MySQL username (default: root): " DB_USER
    DB_USER=${DB_USER:-root}
    
    read -s -p "MySQL password: " DB_PASSWORD
    echo
    
    read -p "Database name (default: ai_saas_dashboard): " DB_NAME
    DB_NAME=${DB_NAME:-ai_saas_dashboard}
    
    read -p "MySQL host (default: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
}

# Test MySQL connection
test_mysql_connection() {
    print_status "Testing MySQL connection..."
    
    if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &> /dev/null; then
        print_success "MySQL connection successful"
    else
        print_error "Failed to connect to MySQL. Please check your credentials."
        exit 1
    fi
}

# Create database
create_database() {
    print_status "Creating database '$DB_NAME'..."
    
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Database '$DB_NAME' created successfully"
    else
        print_error "Failed to create database"
        exit 1
    fi
}

# Import schema
import_schema() {
    print_status "Importing database schema..."
    
    if [ -f "backend/database/schema.sql" ]; then
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < backend/database/schema.sql
        print_success "Database schema imported successfully"
    else
        print_error "Schema file not found: backend/database/schema.sql"
        exit 1
    fi
}

# Import seed data
import_seed_data() {
    print_status "Importing seed data..."
    
    if [ -f "backend/database/seed.sql" ]; then
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < backend/database/seed.sql
        print_success "Seed data imported successfully"
    else
        print_error "Seed file not found: backend/database/seed.sql"
        exit 1
    fi
}

# Generate JWT secrets
generate_jwt_secrets() {
    print_status "Generating JWT secrets..."
    
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    
    print_success "JWT secrets generated"
}

# Create backend .env file
create_backend_env() {
    print_status "Creating backend environment file..."
    
    cat > backend/.env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173
EOF
    
    print_success "Backend .env file created"
}

# Create frontend .env file
create_frontend_env() {
    print_status "Creating frontend environment file..."
    
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:5000/api
EOF
    
    print_success "Frontend .env file created"
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    
    cd backend
    npm install
    cd ..
    
    print_success "Backend dependencies installed"
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    
    cd frontend
    pnpm install
    cd ..
    
    print_success "Frontend dependencies installed"
}

# Display demo credentials
show_demo_credentials() {
    echo
    print_success "Setup completed successfully!"
    echo
    echo "🎉 Your 8Solve AI SaaS Dashboard is ready!"
    echo
    echo "📋 Demo Credentials:"
    echo "==================="
    echo "Super Admin: superadmin@8solve.ai / admin123"
    echo "Admin:       admin@8solve.ai / admin123"
    echo "Manager:     manager@8solve.ai / manager123"
    echo "User:        user@8solve.ai / user123"
    echo
    echo "🚀 To start the application:"
    echo "============================"
    echo "1. Start the backend:"
    echo "   cd backend && npm run dev"
    echo
    echo "2. Start the frontend (in a new terminal):"
    echo "   cd frontend && pnpm run dev"
    echo
    echo "3. Open your browser and go to: http://localhost:5173"
    echo
    echo "📚 Additional Resources:"
    echo "======================="
    echo "- API Documentation: Import the Postman collection"
    echo "- Database: $DB_NAME on $DB_HOST"
    echo "- Backend API: http://localhost:5000/api"
    echo "- Frontend: http://localhost:5173"
    echo
}

# Main setup function
main() {
    echo
    print_status "Starting setup process..."
    
    # Check prerequisites
    check_mysql
    check_node
    check_pnpm
    
    # Database setup
    get_mysql_credentials
    test_mysql_connection
    create_database
    import_schema
    import_seed_data
    
    # Environment setup
    generate_jwt_secrets
    create_backend_env
    create_frontend_env
    
    # Install dependencies
    install_backend_deps
    install_frontend_deps
    
    # Show completion message
    show_demo_credentials
}

# Run main function
main

