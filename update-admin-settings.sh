#!/bin/bash

# SimplePOS Admin Database Update Script
# This script updates admin settings in the MySQL database

# Configuration - Update these values to match your setup
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="simplepos"
DB_USER="root"
DB_PASS=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to execute MySQL command
execute_mysql() {
    local query="$1"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$query" 2>/dev/null
    return $?
}

# Function to check database connection
check_db_connection() {
    log "Checking database connection..."
    if ! execute_mysql "SELECT 1;" >/dev/null 2>&1; then
        error "Cannot connect to database. Please check your configuration."
        echo "Current config:"
        echo "  Host: $DB_HOST"
        echo "  Port: $DB_PORT"
        echo "  Database: $DB_NAME"
        echo "  User: $DB_USER"
        exit 1
    fi
    success "Database connection successful"
}

# Function to update max instances per email
update_max_instances() {
    local new_limit="$1"

    if ! [[ "$new_limit" =~ ^[0-9]+$ ]] || [ "$new_limit" -lt 1 ]; then
        error "Invalid limit. Must be a positive integer."
        exit 1
    fi

    log "Updating max instances per email to $new_limit..."

    # Check if admin_settings table exists
    if ! execute_mysql "DESCRIBE admin_settings;" >/dev/null 2>&1; then
        log "Creating admin_settings table..."
        execute_mysql "
        CREATE TABLE admin_settings (
            id INT PRIMARY KEY AUTO_INCREMENT,
            setting_key VARCHAR(100) NOT NULL UNIQUE,
            setting_value TEXT NOT NULL,
            description VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );"
        if [ $? -eq 0 ]; then
            success "Admin settings table created"
        else
            error "Failed to create admin_settings table"
            exit 1
        fi
    fi

    # Update or insert the setting
    execute_mysql "
    INSERT INTO admin_settings (setting_key, setting_value, description)
    VALUES ('max_instances_per_email', '$new_limit', 'Maximum number of store instances allowed per email address')
    ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        description = VALUES(description),
        updated_at = CURRENT_TIMESTAMP;"

    if [ $? -eq 0 ]; then
        success "Max instances per email updated to $new_limit"
    else
        error "Failed to update max instances setting"
        exit 1
    fi
}

# Function to show current settings
show_current_settings() {
    log "Current admin settings:"
    echo

    # Check if admin_settings table exists
    if ! execute_mysql "DESCRIBE admin_settings;" >/dev/null 2>&1; then
        warning "Admin settings table does not exist yet"
        return
    fi

    # Get current settings
    local result=$(execute_mysql "SELECT setting_key, setting_value, description FROM admin_settings ORDER BY setting_key;")

    if [ -z "$result" ]; then
        warning "No admin settings found"
        return
    fi

    printf "%-30s %-15s %s\n" "Setting Key" "Value" "Description"
    printf "%-30s %-15s %s\n" "------------------------------" "---------------" "-----------------------------------"

    echo "$result" | while IFS=$'\t' read -r key value description; do
        printf "%-30s %-15s %s\n" "$key" "$value" "$description"
    done
}

# Function to show usage
usage() {
    echo "SimplePOS Admin Database Update Script"
    echo
    echo "Usage:"
    echo "  $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --max-instances-per-email LIMIT    Set maximum store instances per email (default: 3)"
    echo "  --show-settings                    Show current admin settings"
    echo "  --help                           Show this help message"
    echo
    echo "Examples:"
    echo "  $0 --max-instances-per-email 5"
    echo "  $0 --show-settings"
    echo
    echo "Configuration:"
    echo "  Edit the variables at the top of this script to match your database setup"
}

# Main script logic
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --max-instances-per-email)
                MAX_INSTANCES="$2"
                shift 2
                ;;
            --show-settings)
                SHOW_SETTINGS=true
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                echo
                usage
                exit 1
                ;;
        esac
    done

    log "SimplePOS Admin Database Update Script Started"

    # Check database connection
    check_db_connection

    echo

    # Show current settings if requested
    if [ "$SHOW_SETTINGS" = true ]; then
        show_current_settings
        echo
    fi

    # Update max instances if specified
    if [ -n "$MAX_INSTANCES" ]; then
        update_max_instances "$MAX_INSTANCES"
        echo

        # Show updated settings
        log "Updated settings:"
        show_current_settings
        echo
    fi

    # If no actions specified, show usage
    if [ -z "$MAX_INSTANCES" ] && [ "$SHOW_SETTINGS" != true ]; then
        warning "No action specified. Use --help for usage information."
        echo
        show_current_settings
        exit 1
    fi

    success "Script completed successfully"
}

# Run main function
main "$@"
