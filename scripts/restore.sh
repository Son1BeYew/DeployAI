#!/bin/bash

# Restore script for AIStudio
if [ -z "$1" ]; then
    echo "❌ Usage: ./restore.sh <backup_timestamp>"
    echo "Example: ./restore.sh 20241206_143000"
    echo ""
    echo "Available backups:"
    ls -1 backups/ | grep "_info.txt" | sed 's/_info.txt//'
    exit 1
fi

BACKUP_DIR="./backups"
BACKUP_NAME="aistudio_backup_$1"

echo "🔄 Restoring from backup: $BACKUP_NAME"

# Check if backup exists
if [ ! -f "$BACKUP_DIR/${BACKUP_NAME}_info.txt" ]; then
    echo "❌ Backup not found: $BACKUP_NAME"
    exit 1
fi

# Show backup info
echo ""
echo "📋 Backup Information:"
cat "$BACKUP_DIR/${BACKUP_NAME}_info.txt"
echo ""

read -p "Continue with restore? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Restore outputs
if [ -f "$BACKUP_DIR/${BACKUP_NAME}_outputs.tar.gz" ]; then
    echo "📁 Restoring outputs..."
    tar -xzf "$BACKUP_DIR/${BACKUP_NAME}_outputs.tar.gz"
    echo "✅ Outputs restored"
fi

# Restore .env
if [ -f "$BACKUP_DIR/${BACKUP_NAME}.env" ]; then
    echo "🔐 Restoring .env..."
    cp "$BACKUP_DIR/${BACKUP_NAME}.env" Server/.env
    echo "✅ .env restored"
fi

# Restore MongoDB
if [ -f "$BACKUP_DIR/${BACKUP_NAME}_mongodb.archive" ]; then
    echo "🗄️  Restoring MongoDB..."
    if docker ps | grep -q aistudio_server; then
        docker exec -i aistudio_server sh -c 'mongorestore --uri="$MONGO_URI" --archive --drop' < "$BACKUP_DIR/${BACKUP_NAME}_mongodb.archive"
        echo "✅ MongoDB restored"
    else
        echo "⚠️  Warning: aistudio_server container not running. Skipping MongoDB restore."
    fi
fi

echo ""
echo "✅ Restore complete!"
echo "🔄 Please restart the application:"
echo "   docker-compose restart"
