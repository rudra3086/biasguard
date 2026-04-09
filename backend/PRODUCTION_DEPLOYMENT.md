# Production Deployment Guide

This guide covers deploying the BiasGuard backend API to production environments.

## Prerequisites

- Python 3.8+
- pip or conda for dependency management
- Docker (optional, for containerized deployment)
- Google Gemini API key (optional, for LLM explanations)

## Configuration

### 1. Environment Variables

Create a `.env` file in the backend directory with your production settings:

```bash
cp .env.example .env
```

Edit `.env` with your production values:

```env
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=8000
WORKERS=4
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
LOG_LEVEL=WARNING
GEMINI_API_KEY=your_api_key_here
```

### 2. Critical Configuration Parameters

#### Application Settings
- `ENVIRONMENT`: Set to `production` for production deployments
- `DEBUG`: Must be `false` in production
- `WORKERS`: Number of worker processes (4-8 recommended for production)

#### Security Settings
- `CORS_ORIGINS`: Specify exact domains instead of wildcards (`*`)
- `HOST`: Bind to `0.0.0.0` or specific IP for network access
- `PORT`: Use 8000 or your configured port

#### LLM Configuration
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://ai.google.dev/)
  - Enables AI-powered bias explanations
  - If empty, falls back to template-based explanations
  - Keep it secret in production (use secure secret management)

#### Data Processing
- `MAX_UPLOAD_SIZE_MB`: Consider disk space and memory
- `UPLOAD_DIR`: Use persistent storage for uploaded files
- `CLEANUP_UPLOADS_AFTER_HOURS`: Clean up old uploads to save space

#### Logging
- `LOG_LEVEL`: Use `WARNING` or `ERROR` in production (reduce noise)
- `LOG_FILE`: Use absolute path for persistent logging
- `LOG_MAX_BYTES` and `LOG_BACKUP_COUNT`: Configure rotation

## Installation & Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Verify Installation

```bash
python -c "import fastapi, google.generativeai; print('All dependencies installed')"
```

### 3. Test Configuration

```bash
python -c "from app.config import *; print(f'APP_NAME={APP_NAME}'); print(f'ENVIRONMENT={ENVIRONMENT}')"
```

## Running the Backend

### Development Mode
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Production Mode (Gunicorn + Uvicorn Workers)
```bash
pip install gunicorn
gunicorn main:app -w 4 -b 0.0.0.0:8000 -k uvicorn.workers.UvicornWorker
```

### Using Docker
```bash
docker build -t biasguard-backend .
docker run -p 8000:8000 --env-file .env biasguard-backend
```

## API Endpoints

### Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "BiasGuard Bias Detection API"
}
```

### Upload Dataset
```bash
POST /api/upload
Content-Type: multipart/form-data

file: <csv_file>
```

### Analyze Dataset
```bash
POST /api/analyze
Content-Type: application/json

{
  "file_path": "1234567890.123_filename.csv",
  "target_column": "approval_status",
  "task_type": "classification"
}
```

### Get AI Explanation
```bash
POST /api/explain
Content-Type: application/json

{
  "bias_analysis": {
    "summary": { "fairness_score": 65 },
    "features": [
      {
        "feature": "gender",
        "bias_score": 0.35,
        "severity": "HIGH",
        "type": "categorical",
        "groups": { "male": 0.85, "female": 0.50 }
      }
    ]
  }
}
```

## Monitoring & Maintenance

### Logs
Logs are written to `app.log` with automatic rotation:

```bash
# View recent logs
tail -f app.log

# Check for errors
grep ERROR app.log
```

### Disk Space Management
The backend automatically cleans up uploaded files older than `CLEANUP_UPLOADS_AFTER_HOURS` (default: 24 hours).

To manually clean up:
```bash
# Find and remove old upload files
find uploads/ -type f -mtime +1 -delete
```

### Performance Tuning

1. **Worker Count**: Set based on CPU cores
   - `WORKERS = CPU_CORES * 2` (for production)
   
2. **Request Timeout**: Adjust via API code if needed
   - Large datasets may need higher timeout

3. **Memory**: Monitor for memory leaks
   - Use `top` or `docker stats` while running

4. **Concurrent Requests**: Gunicorn defaults to 1 concurrent request per worker
   - For async operations, consider increasing workers

## Security Considerations

### Before Deployment

1. **API Keys**
   - Store `GEMINI_API_KEY` in secure secret management (AWS Secrets Manager, HashiCorp Vault)
   - Never commit `.env` file to version control
   - Rotate keys regularly

2. **CORS Configuration**
   - Specify exact domains (no wildcards `*`)
   - Review and restrict as needed

3. **File Upload Security**
   - Limit `MAX_UPLOAD_SIZE_MB` appropriately
   - Validate file types at upload endpoint
   - Consider virus scanning for production

4. **SSL/TLS**
   - Use HTTPS in production
   - Deploy behind load balancer (nginx, AWS ALB) with SSL termination
   - Configure CORS headers carefully

5. **Rate Limiting**
   - Consider adding rate limiting middleware
   - Implement in load balancer or API gateway

### Runtime Security

- Keep dependencies updated: `pip install --upgrade -r requirements.txt`
- Monitor logs for suspicious activity
- Implement request logging/audit trails
- Use strong authentication if exposing API publicly

## Scaling for Production

### Horizontal Scaling

1. **Load Balancing**
   - Deploy multiple instances behind nginx/HAProxy
   - Each instance runs on different port or container

2. **Session Management**
   - API is stateless (horizontal scaling friendly)
   - No session storage needed

3. **File Storage**
   - Move `uploads/` to shared storage (NFS, S3)
   - Update `UPLOAD_DIR` path accordingly

### Vertical Scaling

- Increase `WORKERS` (test to find optimal)
- Increase server RAM
- Use faster storage for uploads

## Troubleshooting

### Issue: API Returns 500 Error
```bash
# Check logs
tail -20 app.log
# Look for exception details
```

### Issue: CORS Errors from Frontend
- Verify `CORS_ORIGINS` includes frontend domain
- Check for protocol mismatch (http vs https)

### Issue: Slow Analysis
- Check server resources (CPU, memory, disk)
- Verify dataset size isn't exceeding limits
- Check for background cleanup operations

### Issue: LLM Explanations Not Working
- Verify `GEMINI_API_KEY` is set and valid
- Check network connectivity to Google API
- Fallback explanations should work as alternative

## Database Integration (Future)

When ready to add persistence:

1. Set `DATABASE_URL` in `.env`
2. Implement SQLAlchemy models
3. Add database models to store:
   - Uploaded files metadata
   - Analysis results history
   - User audit logs

## Backup & Disaster Recovery

1. **Backup Uploaded Files**
   - Regularly backup `uploads/` directory
   - Implement 30-day retention policy

2. **Backup Logs**
   - Archive `app.log` periodically
   - Store securely for compliance

3. **Configuration**
   - Version control `.env.example` (not `.env`)
   - Document all custom configuration values

## Performance Benchmarks

Typical performance on reasonably-sized datasets (1000-10000 rows):
- File upload: < 1 second
- Initial analysis: 2-5 seconds
- LLM explanation: 5-15 seconds (depends on Gemini API)
- Total request-response: < 30 seconds

## Support & Maintenance

- Monitor `app.log` for warnings and errors
- Regular dependency updates (monthly recommended)
- Test updates in staging before production
- Keep Python version updated (3.10+ recommended)

For issues or questions, refer to:
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Uvicorn Docs](https://www.uvicorn.org/)
- [Google Generative AI Docs](https://ai.google.dev/docs)
