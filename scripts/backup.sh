#!/bin/bash
# Thoughts & Time - Database Backup Script
# Creates a timestamped backup of the PostgreSQL database

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/thoughts-time-backup-${TIMESTAMP}.sql"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
CONTAINER_NAME="thoughts-time-db"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Thoughts & Time Backup ===${NC}"
echo "Starting backup at $(date)"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}Error: Database container '${CONTAINER_NAME}' is not running${NC}"
    exit 1
fi

# Create backup
echo -e "${YELLOW}Creating backup...${NC}"
docker exec "${CONTAINER_NAME}" pg_dump -U postgres -d postgres \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    > "${BACKUP_FILE}"

# Compress backup
echo -e "${YELLOW}Compressing backup...${NC}"
gzip "${BACKUP_FILE}"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}"
echo -e "${GREEN}✓ Size: ${BACKUP_SIZE}${NC}"

# Clean up old backups
echo -e "${YELLOW}Cleaning up old backups (older than ${RETENTION_DAYS} days)...${NC}"
find "${BACKUP_DIR}" -name "thoughts-time-backup-*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Count remaining backups
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "thoughts-time-backup-*.sql.gz" -type f | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Backup count: ${BACKUP_COUNT}${NC}"

echo -e "${GREEN}=== Backup Complete ===${NC}"
echo "Finished at $(date)"
