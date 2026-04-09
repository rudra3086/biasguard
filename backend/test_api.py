#!/usr/bin/env python
"""
Example script demonstrating the Bias Detection API usage.
"""

import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"


def test_health():
    """Test health endpoint."""
    print("\n🏥 Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_upload(csv_file_path: str):
    """Test file upload endpoint."""
    print(f"\n📤 Testing upload endpoint with {csv_file_path}...")
    
    if not Path(csv_file_path).exists():
        print(f"❌ File not found: {csv_file_path}")
        return None
    
    with open(csv_file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    return result.get('file_id')


def test_analyze(file_id: str, target_column: str, task_type: str = 'classification'):
    """Test bias analysis endpoint."""
    print(f"\n🔍 Testing analyze endpoint...")
    print(f"   File ID: {file_id}")
    print(f"   Target: {target_column}")
    print(f"   Task: {task_type}")
    
    payload = {
        'file_id': file_id,
        'target_column': target_column,
        'task_type': task_type
    }
    
    response = requests.post(f"{BASE_URL}/api/analyze", json=payload)
    
    print(f"Status: {response.status_code}")
    result = response.json()
    
    if result.get('status') == 'success':
        print("\n✅ Analysis completed successfully!")
        print(f"\n📊 Summary:")
        summary = result.get('summary', {})
        print(f"   Fairness Score: {summary.get('fairness_score')}")
        print(f"   Most Biased Feature: {summary.get('most_biased_feature')}")
        print(f"   Features Analyzed: {summary.get('total_features_analyzed')}")
        print(f"   Sensitive Features: {summary.get('sensitive_features_detected')}")
        
        print(f"\n⚠️  Bias Trends:")
        trends = result.get('trends', {})
        print(f"   High Bias Features: {trends.get('high_bias_count')}")
        print(f"   Medium Bias Features: {trends.get('medium_bias_count')}")
        print(f"   Low Bias Features: {trends.get('low_bias_count')}")
        print(f"   Recommendation: {trends.get('recommendation')}")
        
        print(f"\n🎯 Top Biased Features:")
        explainability = result.get('explainability', {})
        for feat in explainability.get('top_biased_features', [])[:3]:
            print(f"   {feat['feature']}: {feat['bias_contribution']} ({feat['impact_percentage']}%)")
        
        print(f"\n📝 Detailed Feature Analysis:")
        for feature in result.get('features', [])[:3]:
            print(f"   {feature['feature']}: {feature['severity']} bias (score: {feature['bias_score']})")
    else:
        print(f"\n❌ Analysis failed: {result.get('message')}")
    
    print(f"\nFull Response:\n{json.dumps(result, indent=2)}")
    return result


def main():
    """Run all tests."""
    print("=" * 60)
    print("🚀 Bias Detection API - Test Suite")
    print("=" * 60)
    
    # Test health
    test_health()
    
    # Test with sample CSV (you need to provide a real CSV file)
    # For demo, we'll show the structure
    sample_csv = "../datasets/loan_approval_dataset.csv"
    
    if Path(sample_csv).exists():
        # Upload file
        file_id = test_upload(sample_csv)
        
        if file_id:
            # Analyze with different targets
            test_analyze(file_id, 'loan_status', 'classification')
    else:
        print(f"\n⚠️  Sample CSV not found at {sample_csv}")
        print("To test, provide a CSV file and update the path in this script.")
        print("\nExample CSV structure:")
        print("  Row | age | gender | income | approved")
        print("  1   | 35  | M      | 50000  | Yes")
        print("  2   | 28  | F      | 45000  | No")
        print("  ... ")
    
    print("\n" + "=" * 60)
    print("✅ Test suite completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
