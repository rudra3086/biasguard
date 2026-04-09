# 🚀 Quick Start Guide - BiasGuard Backend

## ⚡ Get Running in 2 Minutes

### Prerequisites
- Python 3.8+ installed
- Command line/terminal access

---

## Step 1️⃣: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Takes ~2-3 minutes depending on internet speed**

---

## Step 2️⃣: Start the Server

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

---

## Step 3️⃣: Test the API

### Option A: Swagger UI (Easiest)
Open browser: **http://localhost:8000/docs**

Click "Try it out" on endpoints to test!

### Option B: Python Script
```bash
# In another terminal
python test_api.py
```

### Option C: cURL
```bash
# Upload
curl -X POST "http://localhost:8000/api/upload" \
  -F "file=@your_data.csv"

# Analyze (use returned file_id)
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "YOUR_FILE_ID",
    "target_column": "your_target",
    "task_type": "classification"
  }'
```

---

## 🎯 Complete API Flow

```
1. Upload CSV
   POST /api/upload
   ↓ Returns: file_id
   
2. Analyze Dataset
   POST /api/analyze
   Parameters: file_id, target_column, task_type
   ↓ Returns: Comprehensive bias analysis JSON
   
3. Display Results
   Show fairness score, biased features, recommendations
```

---

## 📊 Example Request/Response

### Upload Request
```
POST /api/upload
Body: multipart/form-data with CSV file
```

### Upload Response
```json
{
  "status": "success",
  "file_id": "1712567890.123_data.csv",
  "dataset_shape": {"rows": 354, "columns": 13},
  "column_info": {
    "column_names": ["age", "gender", "income", "approved"],
    "data_types": {...}
  }
}
```

### Analyze Request
```json
POST /api/analyze
{
  "file_id": "1712567890.123_data.csv",
  "target_column": "approved",
  "task_type": "classification",
  "sensitive_features": ["gender", "age"]
}
```

### Analyze Response
```json
{
  "status": "success",
  "summary": {
    "fairness_score": 0.78,
    "most_biased_feature": "gender",
    "total_features_analyzed": 12,
    "sensitive_features_detected": ["gender", "age", "income"]
  },
  "features": [
    {
      "feature": "gender",
      "bias_score": 0.18,
      "severit": "HIGH",
      "groups": {"Male": 0.82, "Female": 0.64}
    }
  ],
  "recommendations": "WARNING: Some high-bias features detected..."
}
```

---

## 🐛 Common Issues & Fixes

### Port Already in Use
```bash
# Use different port
python -m uvicorn main:app --port 8001
```

### ModuleNotFoundError
```bash
# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Then reinstall
pip install -r requirements.txt
```

### CSV Parsing Error
- Ensure CSV is UTF-8 encoded
- File has headers in first row
- Use comma as delimiter

---

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Complete API reference |
| `SETUP_GUIDE.md` | Detailed setup instructions |
| `ARCHITECTURE.md` | System design & components |
| `BUILD_SUMMARY.md` | Project overview |

---

## ✅ Verification Checklist

- [ ] Python 3.8+ installed
- [ ] `pip install -r requirements.txt` completed
- [ ] Server running: `python -m uvicorn main:app --reload`
- [ ] Swagger UI accessible: http://localhost:8000/docs
- [ ] Health endpoint works: http://localhost:8000/health
- [ ] Can upload CSV file
- [ ] Can run /analyze endpoint

---

## 🎉 You're Ready!

### Next Steps:
1. ✅ Explore API at http://localhost:8000/docs
2. ✅ Upload your CSV dataset
3. ✅ Run bias analysis
4. ✅ Review fairness metrics
5. ✅ Connect to frontend (Next.js) if needed

---

## 🔧 Advanced Usage

### Python Integration
```python
import requests

# Upload
with open('data.csv', 'rb') as f:
    r = requests.post('http://localhost:8000/api/upload', files={'file': f})
file_id = r.json()['file_id']

# Analyze
result = requests.post('http://localhost:8000/api/analyze', json={
    'file_id': file_id,
    'target_column': 'approved',
    'task_type': 'classification'
})

print(result.json())
```

### Docker
```bash
# Build
docker build -t biasguard .

# Run
docker run -p 8000:8000 biasguard
```

### Docker Compose
```bash
docker-compose up
```

---

## 📞 Need Help?

1. **API Documentation**: http://localhost:8000/docs
2. **Detailed Setup**: Read `SETUP_GUIDE.md`
3. **Architecture**: Read `ARCHITECTURE.md`
4. **Examples**: Check `test_api.py`

---

**Happy analyzing! 🚀**
