"""
Production-ready application configuration and constants.
"""

import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Application
APP_NAME = os.getenv("APP_NAME", "Universal AI Bias Detection Tool")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
WORKERS = int(os.getenv("WORKERS", "4"))

# File Upload
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))
MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
ALLOWED_FILE_TYPES = ['.csv']
CLEANUP_UPLOADS_AFTER_HOURS = int(os.getenv("CLEANUP_UPLOADS_AFTER_HOURS", "24"))

# Data Processing
MISSING_VALUE_STRATEGY = os.getenv("MISSING_VALUE_STRATEGY", "fill")  # 'drop' or 'fill'
CATEGORICAL_THRESHOLD = int(os.getenv("CATEGORICAL_THRESHOLD", "10"))
MIN_ROWS_FOR_ANALYSIS = 10
NUMERICAL_BINS = 4

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")

# API
API_PREFIX = "/api"
API_TIMEOUT = 30

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", "app.log")
LOG_MAX_BYTES = int(os.getenv("LOG_MAX_BYTES", "10485760"))  # 10MB
LOG_BACKUP_COUNT = int(os.getenv("LOG_BACKUP_COUNT", "5"))

# Bias Classification Thresholds
BIAS_THRESHOLD_LOW = float(os.getenv("BIAS_THRESHOLD_LOW", "0.1"))
BIAS_THRESHOLD_MEDIUM = float(os.getenv("BIAS_THRESHOLD_MEDIUM", "0.3"))
BIAS_THRESHOLD_HIGH = float('inf')

# LLM Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", None)
USE_LLM_EXPLANATIONS = GEMINI_API_KEY is not None

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
