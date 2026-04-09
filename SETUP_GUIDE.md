# Bias Guard - Setup & Testing Guide

## System Requirements

- **Node.js** 18+ (for Next.js)
- **Python** 3.7+
- **pandas** library for Python

## Installation Steps

### 1. Install Python Dependencies

```bash
pip install pandas
```

Verify installation:
```bash
python -c "import pandas; print(pandas.__version__)"
```

### 2. Verify Python Path

The system executes Python scripts as a child process. Ensure Python is in your system PATH:

**Windows:**
```powershell
where python
# Should show: C:\Python\python.exe or similar
```

**Mac/Linux:**
```bash
which python3
```

### 3. Install Node Dependencies (if not already done)

```bash
npm install
```

## Architecture Overview

The bias detection system uses a **upload → analyze → display** workflow:

```
┌─────────────┐
│   User      │
│  Uploads    │
│   CSV       │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│  DatasetUpload       │
│  Component (React)   │
│  POST /api/upload    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  API Upload          │
│  /app/api/upload     │
│  - Save file         │
│  - Run Python script │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Python Analysis     │
│  /scripts/analyze_   │
│   bias.py            │
│  - Parse CSV         │
│  - Detect bias       │
│  - Output JSON       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Response JSON       │
│  BiasAnalysis        │
│  - fairness_score    │
│  - bias_detected     │
│  - biased_features   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Frontend Display    │
│  - Show metrics      │
│  - Show biased       │
│    features          │
└──────────────────────┘
```

## File Structure

```
biasguard/
├── app/
│   ├── api/
│   │   └── upload/
│   │       └── route.ts          # Upload endpoint
│   └── page.tsx                  # Main dashboard
├── components/
│   ├── DatasetUpload.tsx         # Upload UI component
│   ├── BiasedFeatures.tsx        # Bias display component
│   ├── FairnessScoreCard.tsx     # Score display
│   └── ...
├── scripts/
│   └── analyze_bias.py           # Python analysis engine
├── public/
│   └── uploads/                  # Uploaded files stored here
└── loan_approval_dataset.csv     # Sample dataset for testing
```

## Testing Workflow

### Test 1: Upload Sample Dataset

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. Drag & drop `loan_approval_dataset.csv` into the upload area
   - **Expected Result**: File uploads, Python script analyzes, fairness metrics display

### Test 2: Check Python Script Output Directly

```bash
python scripts/analyze_bias.py loan_approval_dataset.csv
```

**Expected Output** (JSON to console):
```json
{
  "fairness_score": 72,
  "bias_detected": true,
  "disparate_impact": 0.78,
  "total_samples": 354,
  "demographic_groups": 2,
  "biased_features": [
    {
      "feature": "education",
      "disparate_impact": 0.78,
      "severity": "critical",
      "approval_rates": {...}
    }
  ],
  "explanation": "CRITICAL: 1 feature(s) show severe disparate impact..."
}
```

### Test 3: Verify API Endpoint

Use curl or Postman to test the upload endpoint:

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@loan_approval_dataset.csv"
```

**Expected Response**:
```json
{
  "fileInfo": {
    "name": "loan_approval_dataset.csv",
    "size": 45678
  },
  "analysis": {
    "fairness_score": 72,
    "bias_detected": true,
    ...
  }
}
```

## Troubleshooting

### Issue: "Python not found" error

**Solution**: 
1. Verify Python installation: `python --version`
2. Check PATH environment: `where python` (Windows) or `which python3` (Mac/Linux)
3. In upload endpoint, update the command if needed:
   - Replace `python` with `python3` (Mac/Linux)
   - Or use full path: `/usr/bin/python3` or `C:\Python39\python.exe`

### Issue: "pandas not found" error

**Solution**:
```bash
pip install pandas
# Verify:
python -c "import pandas; print('OK')"
```

### Issue: "Analysis coming back as undefined"

**Solution**:
1. Check Python script directly: `python scripts/analyze_bias.py <filepath>`
2. Verify script outputs valid JSON to stdout
3. Check server logs for Python error messages

## Dataset Requirements

The system expects CSV files with:
- **Approval Status Column**: Named `loan_status`, `approval`, `status`, or `outcome`
  - Values: "Approved", "Rejected", "Yes", "No", "1", "0"
- **Demographic Attributes**: Columns with names containing:
  - `education`, `employment`, `employed`, `gender`, `race`, `age`, `marital`
  - Examples: `education`, `self_employed`, `age_group`, `employment_status`

Sample header:
```
loan_id, education, self_employed, income, loan_status
```

## Key Metrics Explanation

- **Fairness Score** (0-100): Overall fairness assessment
- **Disparate Impact** (0-1): Ratio of approval rates (< 0.8 = bias detected)
  - Formula: `minimum_approval_rate / maximum_approval_rate`
- **Approval Rates**: % approved by demographic group
- **Severity Levels**:
  - 🔴 **Critical**: DI < 0.80 (strong evidence of bias)
  - 🟠 **High**: 0.80 ≤ DI < 0.90
  - 🟡 **Medium**: 0.90 ≤ DI < 0.95
  - 🟢 **Low**: DI ≥ 0.95

## Performance Considerations

- **File Size Limit**: Set in Next.js config (default ~4.5MB)
- **Analysis Time**: ~1-2 seconds for datasets < 10k rows
- **Memory**: ~100MB staging area for uploads in `public/uploads/`

## Next Steps

1. ✅ All code is ready for testing
2. Install pandas: `pip install pandas`
3. Start development server: `npm run dev`
4. Upload a CSV file and verify bias analysis
5. Review identified bias features
6. Deploy when ready

## Support

For issues or questions:
1. Check server logs: `npm run dev` output
2. Verify Python execution: Test script directly with sample CSV
3. Check browser console for frontend errors
