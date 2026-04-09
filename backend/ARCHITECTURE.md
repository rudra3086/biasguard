# BiasGuard Backend - Architecture & Design

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                          │
│                   http://localhost:3000                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FastAPI Backend Server                         │
│                  http://localhost:8000                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ /api/upload  │  │ /api/analyze │  │   /health    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────┬──────────────────────────────┬─────────────────┘
                 │                              │
                 ▼                              ▼
        ┌──────────────────┐          ┌──────────────────┐
        │  Routes Layer    │          │  Services Layer  │
        ├──────────────────┤          ├──────────────────┤
        │ • analysis.py    │          │ • bias_analysis  │
        └──────────────────┘          │   _service.py    │
                 │                    └──────────────────┘
                 │                           │
                 └──────────────┬────────────┘
                                ▼
                    ┌──────────────────────────┐
                    │   Utils Layer            │
                    ├──────────────────────────┤
                    │ • feature_detection.py   │
                    │ • preprocessing.py       │
                    │ • bias_metrics.py        │
                    │ • explainability.py      │
                    └──────────────────────────┘
                                │
                    ┌───────────┴────────────┐
                    ▼                        ▼
            ┌──────────────┐         ┌──────────────┐
            │  Data Layer  │         │  Model Layer │
            ├──────────────┤         ├──────────────┤
            │ • pandas     │         │ • scikit-learn
            │ • numpy      │         │ • shap
            └──────────────┘         └──────────────┘
                    │                        │
                    └───────────┬────────────┘
                                ▼
                    ┌──────────────────────────┐
                    │  File Storage            │
                    ├──────────────────────────┤
                    │  • /uploads (CSV files)  │
                    └──────────────────────────┘
```

---

## 📦 Project Organization

### Modular Design

```
backend/
├── main.py                      # Entry point (FastAPI app)
├── app/
│   ├── __init__.py
│   ├── config.py                # Configuration & constants
│   ├── routes/                  # API endpoints
│   │   ├── __init__.py
│   │   └── analysis.py          # POST /upload, POST /analyze
│   ├── services/                # Business logic
│   │   ├── __init__.py
│   │   └── bias_analysis.py     # Core analysis orchestration
│   └── utils/                   # Helper functions
│       ├── __init__.py
│       ├── feature_detection.py # Auto-detect features & sensitive attrs
│       ├── preprocessing.py     # Data cleaning & preparation
│       ├── bias_metrics.py      # Bias calculations
│       └── explainability.py    # SHAP & explanations
├── uploads/                     # Temporary file storage
├── requirements.txt             # Dependencies
└── tests/                       # Unit tests (future)
```

---

## 🔄 Data Flow

### Upload Flow
```
1. User uploads CSV file
         ↓
2. Route handler receives file
         ↓
3. Parse CSV → pandas DataFrame
         ↓
4. Validate dataset (size, columns)
         ↓
5. Generate file_id + store CSV
         ↓
6. Return column info to user
```

### Analysis Flow
```
1. User requests analysis (file_id, target_column)
         ↓
2. Route handler receives request
         ↓
3. Load CSV from storage
         ↓
4. ┌─ BiasAnalysisService.analyze_bias()
   │
   ├─ Preprocess data
   │   ├─ Handle missing values
   │   ├─ Detect categorical/numerical features
   │   └─ Encode target column
   │
   ├─ Feature analysis loop (for each feature)
   │   ├─ Group data by feature values
   │   ├─ Calculate approval rates per group
   │   ├─ Compute bias metrics (score, ratio)
   │   ├─ Classify severity
   │   └─ Store analysis result
   │
   ├─ Compute overall fairness score
   │
   ├─ Generate explanations
   │   ├─ Human-readable descriptions
   │   └─ Recommendations
   │
   └─ Return comprehensive analysis JSON
         ↓
5. Client receives and displays results
```

---

## 🧠 Bias Detection Algorithm

### Step 1: Data Preprocessing
```python
Input: Raw CSV Dataset
   ↓
1. Load with pandas
2. Validate dataset (min rows, columns exist)
3. Handle missing values (fill or drop)
4. Detect categorical vs numerical features
5. Encode target column (binary for classification)
   ↓
Output: Clean DataFrame ready for analysis
```

### Step 2: Feature Analysis
```python
For each feature in dataset:
   
   1. Get unique groups/values
      Group data by feature values
      
   2. Compute approval rate per group
      - Classification:  P(Y=1 | group)
      - Regression:      Mean(Y | group)
      
   3. Calculate bias metrics
      - bias_score = max(rate) - min(rate)
      - bias_ratio = min(rate) / max(rate)
      
   4. Classify severity
      - LOW: bias_score < 0.1
      - MEDIUM: 0.1 ≤ bias_score < 0.3
      - HIGH: bias_score ≥ 0.3
      
   5. Store results
```

### Step 3: Fairness Score
```python
For all features:
   - Collect all bias_scores
   - fairness_score = 1 - average(bias_scores)
   - Range: 0 (unfair) to 1 (fair)
```

### Step 4: Sensitive Feature Detection
```python
Auto-detection heuristics:
   - Check column names against keywords
   - Keywords: gender, age, race, income, education, etc.
   - User can override with manual list
```

---

## 🔌 API Design

### RESTful Principles

| Method | Endpoint      | Purpose                    |
|--------|---------------|----------------------------|
| POST   | /api/upload   | Upload CSV & get file_id   |
| POST   | /api/analyze  | Run bias analysis          |
| GET    | /health       | Service health check       |
| GET    | /docs         | Swagger UI documentation   |

### Response Format

**Success Response:**
```json
{
  "status": "success",
  "data": {...},
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🎯 Core Components

### 1. Feature Detection (`feature_detection.py`)
```python
Functions:
  - detect_categorical_columns()    # Auto-detect cat features
  - detect_numerical_columns()       # Auto-detect num features
  - detect_sensitive_features()      # Find protected attributes
  - get_data_types()                # Map columns to types
  - get_column_info()               # Complete column metadata
```

### 2. Preprocessing (`preprocessing.py`)
```python
Functions:
  - handle_missing_values()          # Fill or drop NaNs
  - prepare_features()               # Transform for analysis
  - validate_target_column()         # Check target exists
  - validate_dataset()               # Data quality checks
  - encode_target()                 # Prepare labels
```

### 3. Bias Metrics (`bias_metrics.py`)
```python
Functions:
  - compute_approval_rate()          # P(Y=1 | group)
  - compute_bias_metrics()           # Score & ratio
  - classify_severity()              # HIGH/MEDIUM/LOW
  - analyze_feature()                # Single feature analysis
  - compute_fairness_score()         # Overall fairness
  - filter_features_by_severity()    # Filter results
```

### 4. Explainability (`explainability.py`)
```python
Functions:
  - get_feature_importance()         # Correlation-based importance
  - compute_shap_style_importance()  # SHAP-like explanations
  - generate_explanations()          # Human-readable text
  - get_bias_trends()               # Summary statistics
  - generate_recommendation()        # Actionable recommendations
```

### 5. Analysis Service (`bias_analysis.py`)
```python
Class: BiasAnalysisService
  Methods:
    - parse_csv()                   # CSV to DataFrame
    - get_dataset_info()            # Metadata extraction
    - analyze_bias()                # Main orchestration
```

### 6. Routes (`analysis.py`)
```python
Endpoints:
  - POST /api/upload               # File upload handler
  - POST /api/analyze              # Analysis handler
```

---

## 🔐 Error Handling

### Validation Layers

```
Route Validation
├─ File type check (CSV only)
├─ File size check
└─ Required parameters check
    ↓
Service Validation
├─ Data quality check (min rows)
├─ Column existence check
├─ Data type validation
└─ Missing value check
    ↓
Utils Validation
├─ Numeric range checks
└─ String format checks
```

### Exception Handling

```python
try:
    # Process request
except ValueError:
    # Business logic errors (invalid input)
    → HTTP 400 Bad Request
except FileNotFoundError:
    # Missing resources
    → HTTP 404 Not Found
except Exception:
    # Unexpected errors
    → HTTP 500 Internal Server Error
```

---

## 📊 Data Structures

### Feature Analysis Result
```python
{
    'feature': 'gender',              # Feature name
    'type': 'categorical',            # Feature type
    'groups': {                       # Approval rates per group
        'Male': 0.82,
        'Female': 0.64
    },
    'group_counts': {                 # Sample size per group
        'Male': 200,
        'Female': 154
    },
    'bias_score': 0.18,               # Difference in rates
    'bias_ratio': 0.78,               # Ratio min/max
    'severity': 'HIGH',               # Severity level
    'groups_affected': 2              # Number of groups
}
```

### Analysis Result
```python
{
    'status': 'success',
    'summary': {
        'fairness_score': 0.78,
        'most_biased_feature': 'gender',
        'total_features_analyzed': 12,
        'sensitive_features_detected': ['gender', 'age'],
        'dataset_shape': {'rows': 354, 'columns': 13}
    },
    'features': [...],                # List of feature analyses
    'explanations': {...},             # Text explanations
    'trends': {...},                  # Trend analysis
    'explainability': {...},          # Top features
    'recommendations': 'WARNING: ...'  # Recommendations
}
```

---

## 🚀 Performance Considerations

### Time Complexity
- Feature detection: O(n) where n = number of columns
- Feature analysis: O(n × m) where n = rows, m = columns
- Bias calculation: O(k) where k = unique values per feature

### Space Complexity
- DataFrame storage: O(n × m)
- Analysis results: O(n_features × n_groups)

### Optimization Strategies
1. **Caching**: Cache feature detection results
2. **Parallelization**: Analyze features in parallel
3. **Lazy Loading**: Load features on demand
4. **Batching**: Process large datasets in chunks

---

## 🔌 Integration Points

### Frontend Integration (Next.js)
```javascript
// Frontend calls backend
const uploadResponse = await fetch('http://localhost:8000/api/upload', {
  method: 'POST',
  body: formData
});

const analysisResponse = await fetch('http://localhost:8000/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    file_id: fileId,
    target_column: 'approved',
    task_type: 'classification'
  })
});
```

### External Services (Future)
- Database: Store analysis history
- Cache: Redis for uploaded files
- Queue: Celery for async processing
- Storage: S3 for file persistence

---

## 📈 Scalability

### Current Limitations
- Single server, no load balancing
- Files stored locally
- No async processing

### Scaling Strategies
1. **Horizontal Scaling**: Multiple FastAPI instances + load balancer
2. **Async Processing**: Celery + Redis for long-running jobs
3. **Cloud Storage**: Move files to S3/GCS
4. **Database**: Store analysis results in PostgreSQL
5. **Caching**: Redis for frequently accessed data

---

## 🧪 Testing Strategy

```
Unit Tests (future)
├─ feature_detection tests
├─ preprocessing tests
├─ bias_metrics tests
└─ explainability tests

Integration Tests (future)
├─ API endpoint tests
├─ End-to-end workflow tests
└─ Performance benchmarks
```

---

## 📝 Code Quality

### Standards
- PEP 8 compliant
- Type hints throughout
- Docstrings for all functions
- Error handling with meaningful messages

### Tools
- `black` for code formatting
- `pylint` for linting
- `pytest` for testing
- `mypy` for type checking

---

## 🔐 Security

### Current Implementation
- CORS enabled for development
- Input validation on all endpoints
- File type validation (CSV only)

### Future Enhancements
- Authentication (JWT/OAuth)
- Rate limiting
- Input sanitization
- SQL injection prevention
- File upload size limits
- HTTPS only in production

---

## 📚 Dependencies

```
Core:
  - FastAPI: Web framework
  - uvicorn: ASGI server
  - pandas: Data manipulation
  - numpy: Numerical computing

Analysis:
  - scikit-learn: ML utilities
  - shap: Explainability

File Handling:
  - python-multipart: File uploads
```

---

## 🎯 Future Enhancements

- [ ] Async file processing with Celery
- [ ] Database integration for history
- [ ] Advanced SHAP integration
- [ ] Model import & analysis
- [ ] Batch processing API
- [ ] Scheduled analysis jobs
- [ ] Export reports (PDF, HTML)
- [ ] Machine learning model recommendations
- [ ] Real-time monitoring dashboard
- [ ] API authentication & authorization

---

## 📞 Support & Documentation

- API Docs: /docs endpoint
- Setup Guide: SETUP_GUIDE.md
- Architecture: This file
- Deployment: DEPLOYMENT_GUIDE.md (coming soon)

---
