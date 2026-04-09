"""
Application configuration and constants.
"""

import os
from typing import List

# Application
APP_NAME = os.getenv("APP_NAME", "BiasGuard Bias Detection API")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"

# Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# File Upload
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))
MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
ALLOWED_FILE_TYPES = ['.csv']

# Data Processing
MISSING_VALUE_STRATEGY = os.getenv("MISSING_VALUE_STRATEGY", "fill")  # 'drop' or 'fill'
CATEGORICAL_THRESHOLD = int(os.getenv("CATEGORICAL_THRESHOLD", "10"))
MIN_ROWS_FOR_ANALYSIS = 10
NUMERICAL_BINS = 4

# CORS
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "*"
]

# API
API_PREFIX = "/api"
API_TIMEOUT = 30

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Bias Classification Thresholds
BIAS_THRESHOLD_LOW = 0.1
BIAS_THRESHOLD_MEDIUM = 0.3
BIAS_THRESHOLD_HIGH = float('inf')

# Sensitive Attributes Keywords (for auto-detection)
SENSITIVE_KEYWORDS = [
    'gender', 'sex', 'age', 'race', 'ethnicity', 'religion',
    'area', 'location', 'region', 'country', 'state', 'city', 'zipcode',
    'income', 'salary', 'wage', 'education', 'caste', 'marital',
    'disability', 'health', 'orientation', 'national_origin'
]

# Feature Importance
SHAP_SAMPLE_SIZE = 100
TOP_N_FEATURES = 5

# Database/Storage (for future use)
DATABASE_URL = os.getenv("DATABASE_URL", None)
REDIS_URL = os.getenv("REDIS_URL", None)
