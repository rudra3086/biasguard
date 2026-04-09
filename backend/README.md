# Backend Application

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Server

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server will be available at: `http://localhost:8000`

### 3. Access API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 📡 API Endpoints

### 1. POST `/api/upload`

Upload a CSV dataset and get dataframe information.

**Request:**
```
Content-Type: multipart/form-data
- file: <CSV file>
```

**Response:**
```json
{
  "status": "success",
  "file_id": "1712567890.123_data.csv",
  "filename": "data.csv",
  "dataset_shape": {
    "rows": 354,
    "columns": 13
  },
  "column_info": {
    "column_names": ["age", "income", "approved"],
    "data_types": {
      "age": "numerical",
      "income": "numerical",
      "approved": "categorical"
    },
    "missing_values": {...},
    "unique_counts": {...}
  }
}
```

---

### 2. POST `/api/analyze`

Analyze dataset for bias in predictions.

**Request:**
```json
{
  "file_id": "1712567890.123_data.csv",
  "target_column": "approved",
  "task_type": "classification",
  "sensitive_features": ["gender", "age", "income"]  // Optional
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
    "sensitive_features_detected": ["gender", "age", "income"],
    "dataset_shape": {"rows": 354, "columns": 13}
  },
  "features": [
    {
      "feature": "gender",
      "type": "categorical",
      "groups": {
        "Male": 0.82,
        "Female": 0.64
      },
      "bias_score": 0.18,
      "bias_ratio": 0.78,
      "severity": "HIGH",
      "groups_affected": 2
    }
  ],
  "explanations": {
    "gender": "The feature 'gender' shows HIGH bias. Group 'Male' has a 82.0% approval rate, while 'Female' has 64.0%, a difference of 18.0%. This significant disparity requires immediate attention.",
    "age": "..."
  },
  "trends": {
    "total_features_analyzed": 12,
    "high_bias_count": 2,
    "medium_bias_count": 3,
    "low_bias_count": 7,
    "high_bias_percentage": 16.67,
    "recommendation": "WARNING: Some high-bias features detected. Consider bias mitigation strategies."
  },
  "explainability": {
    "top_biased_features": [
      {
        "feature": "gender",
        "bias_contribution": 0.18,
        "impact_percentage": 35.29
      }
    ],
    "total_bias_score": 0.51
  },
  "recommendations": "WARNING: Some high-bias features detected. Consider bias mitigation strategies."
}
```

---

## 🏗️ Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Python dependencies
├── app/
│   ├── __init__.py
│   ├── routes/
│   │   ├── __init__.py
│   │   └── analysis.py     # API endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   └── bias_analysis.py  # Core bias analysis logic
│   └── utils/
│       ├── __init__.py
│       ├── feature_detection.py   # Feature detection heuristics
│       ├── preprocessing.py        # Data preprocessing
│       ├── bias_metrics.py         # Bias calculation
│       └── explainability.py       # SHAP-style explanations
└── uploads/                # Temporary file storage
```

---

## 🧠 Core Algorithm

### Step 1: Data Preprocessing
- Handle missing values (fill or drop)
- Detect categorical vs numerical features
- Convert data types

### Step 2: Feature Analysis
- For each feature:
  - Group data by feature values
  - Compute approval/prediction rate per group
  
### Step 3: Bias Metrics
- **Bias Score**: max(rate) - min(rate)
- **Bias Ratio**: min(rate) / max(rate)
- **Severity**: HIGH (≥0.3), MEDIUM (0.1-0.3), LOW (<0.1)

### Step 4: Fairness Score
- Overall score = 1 - average(bias_scores)
- Range: 0 (unfair) to 1 (fair)

### Step 5: Sensitive Features
- Auto-detect using keywords: gender, age, race, income, etc.
- User can also provide custom list

---

## 📊 Bias Severity Classification

| Bias Score | Severity | Action      |
|-----------|----------|------------|
| < 0.1    | LOW      | Monitor    |
| 0.1-0.3  | MEDIUM   | Investigate|
| ≥ 0.3    | HIGH     | Remediate  |

---

## 🎯 Use Cases

1. **Model Audit**: Check if production models have demographic bias
2. **Dataset Fairness**: Evaluate training data for systematic bias
3. **Pre-deployment Check**: Ensure fairness before model release
4. **Regulatory Compliance**: Check for bias in lending, hiring, etc.

---

## 🔒 Security Considerations

- Uploaded files are stored temporarily in `/uploads`
- CORS is enabled for development (restrict for production)
- No authentication currently implemented (add for production)
- Consider rate limiting for API endpoints

---

## 🚀 Deployment

### Production Deployment
```bash
# Use Gunicorn instead of uvicorn reload
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Docker
```dockerfile
FROM python:3.10
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 📝 Example Usage

### Using Python Requests

```python
import requests

# Upload
with open('data.csv', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/upload',
        files={'file': f}
    )
    file_id = response.json()['file_id']

# Analyze
result = requests.post(
    'http://localhost:8000/api/analyze',
    json={
        'file_id': file_id,
        'target_column': 'approved',
        'task_type': 'classification'
    }
)

print(result.json())
```

### Using cURL

```bash
# Upload
curl -X POST "http://localhost:8000/api/upload" \
  -F "file=@data.csv"

# Analyze
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "1712567890.123_data.csv",
    "target_column": "approved",
    "task_type": "classification"
  }'
```

---

## 📚 Dependencies

- **FastAPI**: Modern async web framework
- **pandas**: Data manipulation
- **numpy**: Numerical computing
- **scikit-learn**: ML utilities
- **uvicorn**: ASGI server
- **python-multipart**: File upload handling
- **shap**: Model explainability (optional)

---

## 🐛 Troubleshooting

**Port already in use:**
```bash
python -m uvicorn main:app --reload --port 8001
```

**CSV parsing error:**
- Ensure CSV encoding is UTF-8
- Check for missing headers

**Out of memory:**
- Reduce dataset size
- Process in batches

---

## 📄 License

MIT License

---

## 👥 Contributing

Pull requests welcome! Please ensure:
1. Code follows PEP 8
2. Tests pass
3. New features have documentation

---
