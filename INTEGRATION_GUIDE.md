# 🔗 BiasGuard Frontend-Backend Integration Guide

## ✅ Integration Complete!

The **FastAPI Backend** has been fully integrated with your **Next.js Frontend**. Both services now work together seamlessly.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│           Next.js Frontend (Port 3000)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ DatasetUpload Component                              │   │
│  │ ├─ Upload CSV → /api/upload (Next.js proxy)         │   │
│  │ ├─ Select target column & task type                  │   │
│  │ └─ Run Analysis → /api/analyze (Next.js proxy)       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬──────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Next.js API Routes (Middleware)                   │
│  ┌───────────────────┐      ┌──────────────────────────┐    │
│  │ /api/upload       │      │ /api/analyze             │    │
│  │ (Proxy)           │      │ (Proxy)                  │    │
│  └────────┬──────────┘      └──────┬───────────────────┘    │
│           │                        │                         │
└───────────┼────────────────────────┼─────────────────────────┘
            │                        │
            └────────────┬───────────┘
                         ▼
        ┌────────────────────────────────┐
        │   FastAPI Backend (Port 8000)  │
        │  ┌──────────────────────────┐  │
        │  │ /api/upload              │  │
        │  │ /api/analyze             │  │
        │  │ /health                  │  │
        │  └──────────────────────────┘  │
        │           │                     │
        │           ▼                     │
        │  ┌──────────────────────────┐  │
        │  │ BiasAnalysisService      │  │
        │  │ - Preprocessing          │  │
        │  │ - Feature detection      │  │
        │  │ - Bias metrics           │  │
        │  │ - Explainability         │  │
        │  └──────────────────────────┘  │
        └────────────────────────────────┘
```

---

## 🚀 Running Locally

### Option 1: Two Separate Terminals (Recommended for Development)

#### Terminal 1: Start Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Expected: `Uvicorn running on http://0.0.0.0:8000`

#### Terminal 2: Start Frontend
```bash
# In project root
npm install
npm run dev
```

Expected: `Local: http://localhost:3000`

#### Terminal 3: Test Integration
```bash
# Open browser
http://localhost:3000
```

---

### Option 2: Docker Compose (All in One)

#### From Backend Directory
```bash
cd backend
docker-compose up
```

This starts:
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **Network**: Containers communicate via `bias-detection-api:8000`

#### Stop Services
```bash
docker-compose down
```

---

## 🔄 Data Flow

### Upload & Analysis Workflow

```
1. User uploads CSV
   DatasetUpload.tsx → fetch('/api/upload')
                          ↓
   Next.js /api/upload/route.ts
   (proxy to backend)
                          ↓
   FastAPI /api/upload
   (parse CSV, store file)
                          ↓
   Returns: { file_id, column_names, shapes }
                          ↓
   Frontend shows column selector

2. User selects target & runs analysis
   DatasetUpload.tsx → fetch('/api/analyze', {
                         file_id,
                         target_column,
                         task_type
                       })
                          ↓
   Next.js /api/analyze/route.ts
   (proxy to backend)
                          ↓
   FastAPI /api/analyze
   (run bias analysis)
                          ↓
   Returns: { summary, features[], explanations, trends }
                          ↓
   Frontend displays:
   - Fairness score
   - Alerts
   - Charts
   - Metrics
```

---

## 📝 Environment Configuration

### `.env.local` (Frontend)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
BACKEND_URL=http://localhost:8000
```

### Backend Automatic
The backend runs on port 8000 by default. Can be modified via environment variables.

---

## 🔌 API Contracts

### POST /api/upload (Next.js)

**Frontend Request:**
```javascript
const formData = new FormData()
formData.append('file', csvFile)
fetch('/api/upload', { method: 'POST', body: formData })
```

**Backend Returns:**
```json
{
  "status": "success",
  "file_id": "1712567890.123_data.csv",
  "filename": "data.csv",
  "dataset_shape": { "rows": 354, "columns": 13 },
  "column_info": {
    "column_names": ["age", "income", "approved"],
    "data_types": {...},
    "missing_values": {...},
    "unique_counts": {...}
  }
}
```

### POST /api/analyze (Next.js)

**Frontend Request:**
```javascript
fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    file_id: "1712567890.123_data.csv",  
    target_column: "approved",
    task_type: "classification",
    sensitive_features: ["gender", "age"]
  })
})
```

**Backend Returns:**
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
      "severity": "HIGH",
      "groups": {"Male": 0.82, "Female": 0.64}
    }
  ],
  "explanations": {...},
  "trends": {...},
  "explainability": {...},
  "recommendations": "..."
}
```

---

## 📊 Updated Components

### DatasetUpload.tsx
- **Upload**: Drag-and-drop CSV files
- **Column Selection**: Auto-detects and displays available columns
- **Task Type**: Choose between Classification/Regression
- **Analysis**: Trigger bias analysis with one click
- **Two-Step Flow**: Upload → Select → Analyze

### page.tsx (Main Dashboard)
- **Mock Data Removed**: Only displays when data is loaded
- **Dynamic Rendering**: Shows upload section, then results
- **New Data Format**: Works with comprehensive bias analysis results

---

## 🔧 Configuration Files

### Next.js Files Updated
- ✅ `app/api/upload/route.ts` - Proxies to backend
- ✅ `app/api/analyze/route.ts` - Proxies to backend
- ✅ `components/DatasetUpload.tsx` - New two-step workflow
- ✅ `.env.local` - Backend URL configuration

### Backend Files
- ✅ `backend/main.py` - FastAPI app with CORS
- ✅ `backend/docker-compose.yml` - Updated with frontend service
- ✅ `backend/app/routes/analysis.py` - API endpoints

### New Files
- ✅ `Dockerfile.frontend` - Frontend containerization
- ✅ `.env.local` - Environment variables

---

## ⚡ Performance Considerations

### API Response Time
- **Small Dataset** (< 10MB): 1-5 seconds
- **Medium Dataset** (10-50MB): 5-30 seconds
- **Large Dataset** (50-100MB): 30+ seconds

### Optimizations Done
- ✅ CORS configured for local development
- ✅ Efficient pandas operations in backend
- ✅ Client-side error handling
- ✅ Loading states in UI

---

## 🐛 Troubleshooting

### Backend Connection Error
```
Error: Backend error: Connection refused
```

**Solution:**
- Make sure backend is running: `python -m uvicorn main:app --reload`
- Check port 8000 is available
- Verify `BACKEND_URL` in `.env.local`

### CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
- Backend CORS is configured for `localhost:3000`
- Make sure frontend is running on port 3000
- Check `NEXT_PUBLIC_API_URL` is correct

### CSV Upload Fails
```
Error: Only CSV files are supported
```

**Solution:**
- Backend only accepts `.csv` files
- Ensure file is UTF-8 encoded
- Check file has headers in first row

### Target Column Not Found
```
Error: Target column 'xyz' not found in dataset
```

**Solution:**
- Select an actual column from the list
- Column name is case-sensitive
- Check column exists in uploaded CSV

---

## 🚀 Deployment

### Production Setup

#### Using Gunicorn + Uvicorn

**Backend:**
```bash
cd backend
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Frontend:**
```bash
npm run build
npm run start
```

#### Using Docker Compose

```bash
# Build images
docker-compose build

# Run services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Environment Variables for Production

**Backend (.env):**
```env
DEBUG=False
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["https://yourdomain.com"]
```

**Frontend (.env.production):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
BACKEND_URL=http://backend:8000
```

---

## 📊 Testing Integration

### 1. Health Checks

**Backend Health:**
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy", "service": "bias-detection-api"}
```

**Frontend Health:**
```bash
curl http://localhost:3000
# Expected: Next.js app loads
```

### 2. API Testing with Swagger

- **Backend Docs**: http://localhost:8000/docs
- **Backend ReDoc**: http://localhost:8000/redoc

### 3. End-to-End Test

1. Go to http://localhost:3000
2. Upload sample CSV
3. Select target column
4. Click "Run Analysis"
5. Verify results display

---

## 🎯 Next Steps

1. ✅ **Local Development**
   - Run both services locally
   - Test with sample datasets
   - Verify all features work

2. ✅ **Customization**
   - Modify bias metrics
   - Add custom sensitive features
   - Adjust UI styling

3. ✅ **Production**
   - Deploy backend to cloud (Heroku, AWS, GCP)
   - Deploy frontend to Vercel/Netlify
   - Configure production environment variables

---

## 📚 Documentation Files

- [Backend README](./backend/README.md) - API reference
- [Backend Setup Guide](./backend/SETUP_GUIDE.md) - Detailed setup
- [Backend Architecture](./backend/ARCHITECTURE.md) - System design
- [Quickstart](./backend/QUICKSTART.md) - Quick start guide

---

## ✅ Verification Checklist

- [ ] Backend installed: `pip install -r backend/requirements.txt`
- [ ] Frontend dependencies: `npm install`
- [ ] `backend/.env` or environment variables set
- [ ] `frontend/.env.local` configured
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can upload CSV file
- [ ] Can view dataset info
- [ ] Can select target column
- [ ] Can run analysis
- [ ] Results display correctly

---

## 🎉 You're All Set!

The BiasGuard application is now fully operational with:
- ✅ **Frontend**: Next.js UI with file upload and visualization
- ✅ **Backend**: FastAPI bias detection engine
- ✅ **Integration**: Seamless communication via REST APIs
- ✅ **Containerization**: Docker support for easy deployment

**Start analyzing bias in your datasets now! 🚀**

---

## 📞 Support

### Common Issues & Solutions

**Q: Backend not starting?**  
A: Run `pip install -r requirements.txt` and check Python version (3.8+)

**Q: Frontend can't connect to backend?**  
A: Verify backend is running and `BACKEND_URL` is correct

**Q: Docker compose error?**  
A: Ensure Docker is installed and running, then run `docker-compose up --build`

**Q: Analysis is slow?**  
A: Reduce dataset size or increase system resources

---

**Happy bias detecting! 🔍✨**
