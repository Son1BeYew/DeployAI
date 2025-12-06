#!/bin/bash

# Backup script for AIStudio
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="aistudio_backup_$TIMESTAMP"

echo "📦 Creating backup: $BACKUP_NAME"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup outputs directory
echo "📁 Backing up outputs..."
if [ -d "Server/outputs" ]; then
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_outputs.tar.gz" Server/outputs/
    echo "✅ Outputs backed up"
fi

# Backup .env file
echo "🔐 Backing up .env..."
if [ -f "Server/.env" ]; then
    cp Server/.env "$BACKUP_DIR/${BACKUP_NAME}.env"
    echo "✅ .env backed up"
fi

# Backup MongoDB (if using Docker)
echo "🗄️  Backing up MongoDB..."
if docker ps | grep -q aistudio_server; then
    docker exec aistudio_server sh -c 'mongodump --uri="$MONGO_URI" --archive' > "$BACKUP_DIR/${BACKUP_NAME}_mongodb.archive"
    echo "✅ MongoDB backed up"
fi

# Create backup info file
cat > "$BACKUP_DIR/${BACKUP_NAME}_info.txt" << EOF
Backup Information
==================
Date: $(date)
Timestamp: $TIMESTAMP
Hostname: $(hostname)
User: $(whoami)

Files included:
- outputs directory
- .env configuration
- MongoDB database

Restore instructions:
1. Extract outputs: tar -xzf ${BACKUP_NAME}_outputs.tar.gz
2. Copy .env: cp ${BACKUP_NAME}.env Server/.env
3. Restore MongoDB: docker exec -i aistudio_server sh -c 'mongorestore --uri="\$MONGO_URI" --archive' < ${BACKUP_NAME}_mongodb.archive
EOF

echo ""
echo "✅ Backup complete!"
echo "📍 Location: $BACKUP_DIR/$BACKUP_NAME*"
echo ""
ls -lh "$BACKUP_DIR/${BACKUP_NAME}"*
