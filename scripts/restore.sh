#!/bin/bash
# Thoughts & Time - Database Restore Script
# Restores a database backup from a specified file

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="thoughts-time-db"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

echo -e "${GREEN}=== Thoughts & Time Restore ===${NC}"

# Check if backup file argument is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo ""
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}"/thoughts-time-backup-*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}Error: Backup file '${BACKUP_FILE}' not found${NC}"
    exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}Error: Database container '${CONTAINER_NAME}' is not running${NC}"
    exit 1
fi

# Confirm restore
echo -e "${YELLOW}⚠️  WARNING: This will replace all existing data!${NC}"
echo "Backup file: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting restore at $(date)${NC}"

# Decompress if gzipped
TEMP_FILE=""
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    echo -e "${YELLOW}Decompressing backup...${NC}"
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "${BACKUP_FILE}" > "${TEMP_FILE}"
    RESTORE_FILE="${TEMP_FILE}"
else
    RESTORE_FILE="${BACKUP_FILE}"
fi

# Stop application to prevent new connections
echo -e "${YELLOW}Stopping application...${NC}"
docker-compose stop app 2>/dev/null || true

# Restore database
echo -e "${YELLOW}Restoring database...${NC}"
cat "${RESTORE_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U postgres

# Clean up temporary file
if [ -n "${TEMP_FILE}" ]; then
    rm -f "${TEMP_FILE}"
fi

# Restart application
echo -e "${YELLOW}Restarting application...${NC}"
docker-compose start app

echo -e "${GREEN}✓ Restore complete${NC}"
echo "Finished at $(date)"
echo ""
echo -e "${GREEN}=== Restore Successful ===${NC}"
