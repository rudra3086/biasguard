# BiasGuard Backend - Setup & Installation Guide

## 📋 Prerequisites

- Python 3.8+ (3.10 recommended)
- pip (Python package manager)
- (Optional) Docker & Docker Compose for containerized deployment

---

## 🚀 Quick Start

### Option 1: Local Installation

#### 1. Navigate to Backend Directory

```bash
cd backend
```

#### 2. Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 4. Run the Server

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

#### 5. Access the API

- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **API Root**: http://localhost:8000/

---

### Option 2: Docker Setup

#### 1. Build Image

```bash
docker build -t biasguard-api .
```

#### 2. Run Container

```bash
docker run -p 8000:8000 -v $(pwd)/uploads:/app/uploads biasguard-api
```

#### 3. Or Use Docker Compose

```bash
docker-compose up
```

---

## 🧪 Testing the API

### Method 1: Using Swagger UI

1. Go to http://localhost:8000/docs
2. Click on "Try it out" for each endpoint
3. Upload CSV file and test analyze endpoint

### Method 2: Using Python Script

```bash
python test_api.py
```

### Method 3: Using cURL

**Upload:**
```bash
curl -X POST "http://localhost:8000/api/upload" \
  -F "file=@your_data.csv"
```

**Analyze:**
```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "returned_file_id",
    "target_column": "your_target_column",
    "task_type": "classification"
  }'
```

### Method 4: Using Python Requests

```python
import requests

# Upload
with open('data.csv', 'rb') as f:
    upload_response = requests.post(
        'http://localhost:8000/api/upload',
        files={'file': f}
    )

file_id = upload_response.json()['file_id']

# Analyze
analyze_response = requests.post(
    'http://localhost:8000/api/analyze',
    json={
        'file_id': file_id,
        'target_column': 'approved',  # Your target column
        'task_type': 'classification'
    }
)

print(analyze_response.json())
```

---

## 📁 Project Structure

```
backend/
├── main.py                      # FastAPI app entry point
├── requirements.txt             # Dependencies
├── Dockerfile                   # Docker configuration
├── docker-compose.yml          # Docker Compose setup
├── .env.example                # Environment variables template
├── README.md                   # API documentation
├── SETUP_GUIDE.md             # This file
├── test_api.py                # Test script
├── uploads/                   # Temporary file storage
└── app/
    ├── __init__.py
    ├── routes/                # API endpoints
    │   ├── __init__.py
    │   └── analysis.py
    ├── services/              # Business logic
    │   ├── __init__.py
    │   └── bias_analysis.py
    └── utils/                 # Helper functions
        ├── __init__.py
        ├── feature_detection.py
        ├── preprocessing.py
        ├── bias_metrics.py
        └── explainability.py
```

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
DEBUG=True
HOST=0.0.0.0
PORT=8000
UPLOAD_DIR=uploads
CORS_ORIGINS=["*"]
```

---

## 📊 API Endpoints Reference

### 1. POST /api/upload

**Purpose:** Upload and parse CSV dataset

**Request:**
```
Content-Type: multipart/form-data
file: <CSV file>
```

**Response:**
```json
{
  "status": "success",
  "file_id": "1712567890.123_data.csv",
  "dataset_shape": {"rows": 354, "columns": 13},
  "column_info": {
    "column_names": [...],
    "data_types": {...},
    "missing_values": {...},
    "unique_counts": {...}
  }
}
```

---

### 2. POST /api/analyze

**Purpose:** Analyze dataset for bias

**Request:**
```json
{
  "file_id": "1712567890.123_data.csv",
  "target_column": "approved",
  "task_type": "classification",
  "sensitive_features": ["gender", "age"]  // Optional
}
```

**Response:**
```json
{
  "status": "success",
  "summary": {
    "fairness_score": 0.78,
    "most_biased_feature": "gender",
    "total_features_analyzed": 12,
    "sensitive_features_detected": [...]
  },
  "features": [...],
  "explanations": {...},
  "trends": {...},
  "explainability": {...},
  "recommendations": "..."
}
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Use different port
python -m uvicorn main:app --port 8001
```

### ModuleNotFoundError

```bash
# Ensure virtual environment is activated
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### CSV Encoding Issues

- Ensure CSV is UTF-8 encoded
- Use Excel "Save As" → "CSV UTF-8"

### Out of Memory

- Process smaller datasets
- Increase system RAM
- Optimize preprocessing

### Dependencies Installation Failed

```bash
# Update pip
pip install --upgrade pip

# Install with no cache
pip install --no-cache-dir -r requirements.txt

# For Windows, use binary wheels
pip install --only-binary :all: -r requirements.txt
```

---

## 📈 Performance Optimization

### For Large Datasets

1. **Increase timeout:**
   ```python
   # In main.py
   uvicorn.run(app, timeout_keep_alive=60)
   ```

2. **Process in chunks:**
   ```python
   # In bias_analysis.py
   CHUNK_SIZE = 10000  # Process chunks
   ```

3. **Use caching:**
   ```python
   from functools import lru_cache
   ```

### Running Multiple Workers

```bash
# Using Gunicorn (production)
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

---

## 🔒 Security Best Practices

1. **CORS Configuration:** Restrict to your frontend domain
   ```python
   # In main.py
   allow_origins=["https://yourdomain.com"]
   ```

2. **File Upload Limits:**
   ```python
   MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
   ```

3. **Input Validation:** Always validate user inputs

4. **Add Authentication:**
   ```python
   from fastapi.security import HTTPBearer
   security = HTTPBearer()
   ```

---

## 📚 API Documentation

Full API documentation is available at `/docs` endpoint:

```
http://localhost:8000/docs
```

---

## 🚀 Deployment

### Heroku Deployment

```bash
# Create Procfile
echo "web: gunicorn main:app" > Procfile

# Deploy
heroku create biasguard-api
git push heroku main
```

### AWS EC2

```bash
# SSH into instance
ssh -i key.pem ubuntu@instance-ip

# Clone repository
git clone <repo-url>
cd backend

# Setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run with systemd
sudo systemctl start biasguard
```

### Google Cloud Run

```bash
gcloud run deploy biasguard-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 📝 Logs & Monitoring

### View Logs

```bash
# In development
# Logs appear in terminal

# In production (Docker)
docker logs biasguard-backend
```

### Enable Debug Mode

```env
DEBUG=True
LOG_LEVEL=DEBUG
```

---

## 🆘 Getting Help

1. Check API docs: http://localhost:8000/docs
2. Review README.md for API details
3. Run test_api.py to validate setup
4. Check logs for error messages
5. Review code comments in utils/

---

## ✅ Verification Checklist

- [ ] Python 3.8+ installed
- [ ] Virtual environment created and activated
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] Server running: `python -m uvicorn main:app --reload`
- [ ] Swagger UI accessible: http://localhost:8000/docs
- [ ] Health check passing: http://localhost:8000/health
- [ ] Test script runs: `python test_api.py`
- [ ] Sample CSV uploads successfully
- [ ] Analysis runs and returns results

---

## 🎉 Successful Setup

When everything is working:

```
✅ Server running on http://0.0.0.0:8000
✅ Swagger UI available
✅ API endpoints responding
✅ File uploads working
✅ Bias analysis working
✅ Ready for production!
```

---

## 📞 Support

For issues or questions:
1. Check this setup guide
2. Review API documentation
3. Check GitHub issues
4. Create detailed bug report with:
   - Python version
   - Error message
   - Steps to reproduce
   - Sample CSV (if applicable)

---
