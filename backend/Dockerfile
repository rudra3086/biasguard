FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Add start script and make executable
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose default port (documentation only)
EXPOSE 8000

# Start application via script that logs the effective port
CMD ["/start.sh"]
