# Docker Development Environment

This directory contains Docker configuration for local development of the Personal Kanban Board application.

## Services

### MongoDB 7
- **Container**: `kanban-mongodb`
- **Port**: 27017
- **Credentials**:
  - Admin: `admin` / `adminpassword`
  - App User: `kanban_user` / `kanban_password`
- **Database**: `kanban`

### MinIO (S3-compatible storage)
- **Container**: `kanban-minio`
- **API Port**: 9000
- **Console Port**: 9001
- **Credentials**: `minioadmin` / `minioadmin123`
- **Bucket**: `kanban-attachments`

> **Note**: MinIO is used for local development only. Production uses Cloudinary for file storage.

## Quick Start

1. **Start all services**:
   ```bash
   docker-compose up -d
   ```

2. **Check service health**:
   ```bash
   docker-compose ps
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Stop services**:
   ```bash
   docker-compose down
   ```

5. **Stop and remove volumes** (clears all data):
   ```bash
   docker-compose down -v
   ```

## Accessing Services

### MongoDB
- **Connection String**: `mongodb://kanban_user:kanban_password@localhost:27017/kanban?authSource=kanban`
- **MongoDB Compass**: Connect using the connection string above
- **mongosh**: `mongosh "mongodb://kanban_user:kanban_password@localhost:27017/kanban?authSource=kanban"`

### MinIO Console
- **URL**: http://localhost:9001
- **Login**: `minioadmin` / `minioadmin123`

### MinIO API
- **Endpoint**: http://localhost:9000
- **Bucket URL**: http://localhost:9000/kanban-attachments

## Environment Variables

Copy the example environment file and update for Docker:

```bash
cp packages/backend/.env.example packages/backend/.env
```

The Docker-specific values are already set in `.env.example`:
- `MONGODB_URI=mongodb://kanban_user:kanban_password@localhost:27017/kanban?authSource=kanban`
- `STORAGE_PROVIDER=minio`
- `MINIO_ENDPOINT=localhost`
- `MINIO_PORT=9000`
- `MINIO_ACCESS_KEY=minioadmin`
- `MINIO_SECRET_KEY=minioadmin123`
- `MINIO_BUCKET=kanban-attachments`

## Data Persistence

Data is persisted in Docker volumes:
- `mongodb_data`: MongoDB database files
- `minio_data`: MinIO object storage files

To reset all data, run:
```bash
docker-compose down -v
docker-compose up -d
```

## Troubleshooting

### MongoDB won't start
Check if port 27017 is already in use:
```bash
lsof -i :27017
```

### MinIO health check fails
The MinIO health check uses `mc ready local`. If it fails, check the logs:
```bash
docker-compose logs minio
```

### Connection refused errors
Ensure services are healthy before connecting:
```bash
docker-compose ps
```
All services should show "healthy" status.
