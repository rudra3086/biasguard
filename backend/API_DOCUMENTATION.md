# BiasGuard API Documentation

Complete reference for the BiasGuard Universal AI Bias Detection API.

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Examples](#examples)
7. [Rate Limiting & Quotas](#rate-limiting--quotas)

---

## Overview

The BiasGuard API provides machine learning bias detection and fairness analysis for datasets and models. It detects algorithmic bias patterns, quantifies fairness metrics, and provides AI-powered explanations.

**Base URL**: `http://localhost:8000`  
**Version**: 1.0.0  
**Status**: Production-ready

### Key Features
- **Automated Bias Detection**: Identifies discrimination patterns in datasets
- **Fairness Metrics**: Calculates multiple fairness dimensions
- **AI Explanations**: Generates explanations using Google Gemini API
- **Feature Analysis**: Detects disparate impact in individual features
- **Severity Classification**: Categorizes bias levels (LOW, MEDIUM, HIGH)

---

## Authentication

Currently, the API does not require authentication. In production:
- Consider adding API key authentication
- Use OAuth 2.0 for user-based access
- Implement rate limiting per API key

---

## Endpoints

### 1. Health Check

Check API status and connectivity.

```
GET /health
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "service": "Universal AI Bias Detection Tool",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### 2. Root Information

Get API metadata and available endpoints.

```
GET /
```

**Response** (200 OK):
```json
{
  "name": "Universal AI Bias Detection Tool",
  "version": "1.0.0",
  "status": "operational",
  "endpoints": {
    "health": "/health",
    "upload": "POST /api/upload",
    "analyze": "POST /api/analyze",
    "explain": "POST /api/explain"
  }
}
```

---

### 3. Upload Dataset

Upload a CSV file for analysis.

```
POST /api/upload
Content-Type: multipart/form-data
```

**Request**:
- **file** (required): CSV file (max 100MB by default)

**Response** (200 OK):
```json
{
  "file_path": "1705316400.123_loan_approval_dataset.csv",
  "filename": "loan_approval_dataset.csv",
  "shape": [1000, 15],
  "columns": [
    "age", "income", "credit_score", "employment_years", 
    "loan_amount", "gender", "approval_status", ...
  ],
  "dtypes": {
    "age": "int64",
    "income": "float64",
    "gender": "object",
    "approval_status": "object",
    ...
  },
  "missing_values": {
    "age": 0,
    "income": 2,
    "gender": 0
  },
  "upload_timestamp": "2024-01-15T10:30:00Z"
}
```

**Errors**:
```json
{
  "detail": "File size exceeds maximum limit of 100MB"
}
```

---

### 4. Analyze Dataset for Bias

Perform comprehensive bias analysis on uploaded dataset.

```
POST /api/analyze
Content-Type: application/json
```

**Request**:
```json
{
  "file_path": "1705316400.123_loan_approval_dataset.csv",
  "target_column": "approval_status",
  "task_type": "classification"
}
```

**Parameters**:
- **file_path** (required, string): Path returned from /api/upload
- **target_column** (required, string): Column name representing outcome variable
- **task_type** (required, string): "classification" or "regression"

**Response** (200 OK):
```json
{
  "summary": {
    "fairness_score": 65,
    "overall_assessment": "MODERATE",
    "biased_features_count": 3,
    "analysis_timestamp": "2024-01-15T10:31:00Z"
  },
  "features": [
    {
      "feature": "gender",
      "type": "categorical",
      "bias_score": 0.35,
      "bias_ratio": 0.59,
      "severity": "HIGH",
      "groups": {
        "male": 0.85,
        "female": 0.50
      },
      "demographic_parity": 1.70,
      "equal_opportunity": 1.47,
      "equalized_odds": 0.40,
      "calibration": 0.35
    },
    {
      "feature": "age",
      "type": "numerical",
      "bias_score": 0.18,
      "bias_ratio": 0.82,
      "severity": "MEDIUM",
      "groups": {
        "18-30": 0.70,
        "31-45": 0.82,
        "46-60": 0.75,
        "60+": 0.64
      },
      "demographic_parity": 1.28,
      "equal_opportunity": 1.07,
      "equalized_odds": 0.11,
      "calibration": 0.18
    }
  ],
  "disparate_impact": {
    "has_disparate_impact": true,
    "protected_features": ["gender"]
  }
}
```

**Response Fields**:

- **summary**: Overall analysis summary
  - `fairness_score`: 0-100 score (100 = perfect fairness)
  - `overall_assessment`: HIGH_BIAS, MODERATE, FAIR
  - `biased_features_count`: Number of features with detected bias

- **features**: Array of analyzed features
  - `feature`: Feature name
  - `type`: "categorical" or "numerical"
  - `bias_score`: Bias magnitude (0-1, higher = more biased)
  - `bias_ratio`: Ratio of minimum to maximum approval rate
  - `severity`: LOW (<0.1), MEDIUM (0.1-0.3), or HIGH (>0.3)
  - `groups`: Approval rates by demographic group
  - `demographic_parity`: Fairness metric (should be ≤1.25)
  - `equal_opportunity`: Metric for sensitivity specificity balance
  - `equalized_odds`: Combined true positive and false positive rates
  - `calibration`: Prediction accuracy across groups

- **disparate_impact**: Legal compliance indicators
  - `has_disparate_impact`: Boolean indicating legal risk
  - `protected_features`: Features indicating discrimination (if any)

**Errors**:
```json
{
  "detail": "File not found: invalid_path.csv"
}
```

---

### 5. Get AI Explanation

Generate human-readable explanations for bias analysis using AI.

```
POST /api/explain
Content-Type: application/json
```

**Request**:
```json
{
  "bias_analysis": {
    "summary": {
      "fairness_score": 65,
      "overall_assessment": "MODERATE",
      "biased_features_count": 3
    },
    "features": [
      {
        "feature": "gender",
        "bias_score": 0.35,
        "severity": "HIGH",
        "type": "categorical",
        "groups": {"male": 0.85, "female": 0.50}
      }
    ]
  }
}
```

**Parameters**:
- **bias_analysis** (required, object): Complete output from /api/analyze endpoint

**Response** (200 OK):
```json
{
  "status": "success",
  "summary": "Your model exhibits significant gender bias, with male applicants 70% more likely to be approved than female applicants. This represents a critical fairness issue requiring immediate remediation.",
  "key_issues": [
    "Gender feature shows HIGH severity bias (score: 0.35) with 85% approval for males vs 50% for females (1.70x disparate impact)",
    "Age feature shows MEDIUM severity bias with approval rates varying from 64% to 82% across age groups",
    "Current fairness score of 65/100 indicates moderate discrimination risk"
  ],
  "root_causes": [
    "Data imbalance: Training data may contain disproportionate negative examples for protected groups",
    "Historical bias: Historical lending patterns may be encoded in the data",
    "Feature interaction: Age and gender may interact in the model, amplifying bias"
  ],
  "recommendations": [
    "Implement gender-balanced resampling of training data before model training",
    "Apply fairness constraints during model training (demographic parity, equalized odds)",
    "Review feature engineering process for potential proxy variables",
    "Implement ongoing fairness monitoring and regular bias audits",
    "Consider removing or de-biasing problematic features"
  ],
  "generated_at": "2024-01-15T10:32:00Z",
  "model": "gemini-pro"
}
```

**Response Fields**:
- **status**: "success" or "error"
- **summary**: Executive summary of bias findings
- **key_issues**: List of critical bias problems identified
- **root_causes**: Potential causes of detected bias
- **recommendations**: Actionable steps to reduce bias
- **generated_at**: ISO 8601 timestamp
- **model**: "gemini-pro" (if Gemini API available) or "template-based" (fallback)

**Note**: If `GEMINI_API_KEY` is not configured, the API will use template-based explanations.

**Errors**:
```json
{
  "detail": "Invalid bias analysis format"
}
```

---

## Data Models

### Feature Bias Object

```json
{
  "feature": "string",              // Feature/column name
  "type": "categorical|numerical",  // Data type
  "bias_score": "number (0-1)",     // Bias magnitude
  "bias_ratio": "number (0-1)",     // Min/Max approval rate ratio
  "severity": "LOW|MEDIUM|HIGH",    // Severity classification
  "groups": {                       // Approval rates by group
    "group_name": "number (0-1)"
  },
  "demographic_parity": "number",   // Fairness metric (should be ≤1.25)
  "equal_opportunity": "number",    // True positive rate parity
  "equalized_odds": "number",       // Combined TPR/FPR parity
  "calibration": "number"           // Prediction accuracy parity
}
```

### Analysis Summary Object

```json
{
  "fairness_score": "number (0-100)",      // Overall fairness score
  "overall_assessment": "string",          // Assessment level
  "biased_features_count": "number",       // Number of biased features
  "analysis_timestamp": "ISO 8601 string", // When analysis was performed
  "sensitivity_features": ["array"]        // Detected sensitive attributes
}
```

---

## Error Handling

The API uses standard HTTP status codes and JSON error responses.

### Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Analysis completed successfully |
| 400 | Bad Request | Invalid input parameters |
| 404 | Not Found | File or resource not found |
| 413 | Payload Too Large | File exceeds size limit |
| 422 | Unprocessable Entity | Invalid data format/schema |
| 500 | Server Error | Unexpected backend error |

### Error Response Format

```json
{
  "detail": "Human-readable error message",
  "status_code": 400,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Errors

**File Not Found**:
```json
{
  "detail": "File not found: invalid_path.csv"
}
```

**Invalid Target Column**:
```json
{
  "detail": "Target column 'target_col' not found in dataset"
}
```

**Missing Required Parameter**:
```json
{
  "detail": "Field required: target_column"
}
```

**File Too Large**:
```json
{
  "detail": "File size 150MB exceeds maximum limit of 100MB"
}
```

---

## Examples

### Complete Workflow Example

#### 1. Upload Dataset
```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@loan_approval_dataset.csv"
```

**Response**:
```json
{
  "file_path": "1705316400.123_loan_approval_dataset.csv",
  "shape": [1000, 15],
  "columns": ["age", "income", "gender", "approval_status", ...]
}
```

#### 2. Analyze for Bias
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "1705316400.123_loan_approval_dataset.csv",
    "target_column": "approval_status",
    "task_type": "classification"
  }'
```

**Response** (abbreviated):
```json
{
  "summary": {
    "fairness_score": 65,
    "biased_features_count": 2
  },
  "features": [
    {
      "feature": "gender",
      "bias_score": 0.35,
      "severity": "HIGH"
    }
  ]
}
```

#### 3. Get AI Explanation
```bash
curl -X POST http://localhost:8000/api/explain \
  -H "Content-Type: application/json" \
  -d '{
    "bias_analysis": {
      "summary": {"fairness_score": 65},
      "features": [{"feature": "gender", "bias_score": 0.35}]
    }
  }'
```

**Response**:
```json
{
  "status": "success",
  "summary": "Your model exhibits gender bias with 70% higher approval for males.",
  "key_issues": ["Gender feature shows HIGH severity bias"],
  "recommendations": ["Apply fairness constraints during retraining"]
}
```

### Python Client Example

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# 1. Upload
files = {'file': open('data.csv', 'rb')}
upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
file_path = upload_response.json()['file_path']

# 2. Analyze
analyze_data = {
    "file_path": file_path,
    "target_column": "approval_status",
    "task_type": "classification"
}
analyze_response = requests.post(f"{BASE_URL}/api/analyze", json=analyze_data)
bias_analysis = analyze_response.json()

# 3. Explain
explain_data = {
    "bias_analysis": bias_analysis
}
explain_response = requests.post(f"{BASE_URL}/api/explain", json=explain_data)
explanation = explain_response.json()

print(f"Fairness Score: {bias_analysis['summary']['fairness_score']}/100")
print(f"Summary: {explanation['summary']}")
```

### JavaScript/Fetch Example

```javascript
const BASE_URL = "http://localhost:8000";

async function analyzeBias(csvFile) {
  // 1. Upload
  const formData = new FormData();
  formData.append('file', csvFile);
  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData
  });
  const { file_path } = await uploadRes.json();

  // 2. Analyze
  const analyzeRes = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_path,
      target_column: 'approval_status',
      task_type: 'classification'
    })
  });
  const bias_analysis = await analyzeRes.json();

  // 3. Explain
  const explainRes = await fetch(`${BASE_URL}/api/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bias_analysis })
  });
  const explanation = await explainRes.json();

  return { bias_analysis, explanation };
}
```

---

## Rate Limiting & Quotas

### Current Limits (Development)
- No rate limiting enforced
- File size: 100MB maximum
- No request quota

### Recommended Production Limits
- **Rate Limit**: 100 requests/minute per API key
- **File Size**: 100MB
- **Concurrent Uploads**: 10
- **Analysis Queue**: 50 pending analyses

### quotas per Tier

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Uploads/month | 50 | 1000 | Unlimited |
| Max file size | 50MB | 500MB | 2GB |
| Requests/min | 10 | 100 | 1000 |
| Response time | 60s | 30s | 10s |
| Email support | ✗ | ✓ | ✓ |
| API SLA | None | 95% | 99.9% |

---

## Support & Resources

- **API Status**: [Check status page]
- **GitHub**: [Repository link]
- **Issues**: Report bugs and request features
- **Documentation**: [Full docs]
- **Email**: support@biasguard.ai

---

**Last Updated**: 2024-01-15  
**API Version**: 1.0.0  
**Status**: Stable—Production Ready
