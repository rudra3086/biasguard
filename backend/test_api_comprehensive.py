"""
Comprehensive test suite for BiasGuard Backend API.

Tests all endpoints including upload, analyze, and explain functionality.
Requires test data files in the datasets/ directory.
"""

import os
import json
import requests
import time
from pathlib import Path

BASE_URL = "http://localhost:8000"
DATASETS_DIR = Path(__file__).parent / "datasets"
UPLOADS_DIR = Path(__file__).parent / "uploads"


class BiasuardAPITester:
    """Test suite for BiasGuard API endpoints."""
    
    def __init__(self, base_url=BASE_URL):
        """Initialize test client."""
        self.base_url = base_url
        self.session = requests.Session()
        self.uploaded_file_path = None
        self.analysis_result = None
        self.explanation_result = None
    
    # ========================================================================
    # Health Check Tests
    # ========================================================================
    
    def test_health_check(self):
        """Test /health endpoint."""
        print("\n✓ Testing Health Check...")
        try:
            response = self.session.get(f"{self.base_url}/health")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            data = response.json()
            assert data["status"] == "healthy", f"Expected status='healthy', got {data.get('status')}"
            print(f"  Response: {json.dumps(data, indent=2)}")
            return True
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            return False
    
    def test_root_endpoint(self):
        """Test root / endpoint."""
        print("\n✓ Testing Root Endpoint...")
        try:
            response = self.session.get(f"{self.base_url}/")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            data = response.json()
            print(f"  Response: {json.dumps(data, indent=2)}")
            return True
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            return False
    
    # ========================================================================
    # File Upload Tests
    # ========================================================================
    
    def test_upload_dataset(self, dataset_file="loan_approval_dataset.csv"):
        """Test /api/upload endpoint."""
        print(f"\n✓ Testing File Upload: {dataset_file}...")
        
        file_path = DATASETS_DIR / dataset_file
        if not file_path.exists():
            print(f"  ✗ FAILED: Dataset file not found at {file_path}")
            return False
        
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (dataset_file, f, 'text/csv')}
                response = self.session.post(
                    f"{self.base_url}/api/upload",
                    files=files
                )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            data = response.json()
            
            # Verify response structure
            assert "file_path" in data, "Response missing 'file_path'"
            assert "columns" in data, "Response missing 'columns'"
            assert "shape" in data, "Response missing 'shape'"
            
            self.uploaded_file_path = data["file_path"]
            
            print(f"  Uploaded file: {self.uploaded_file_path}")
            print(f"  Dataset shape: {data['shape']}")
            print(f"  Columns: {data['columns'][:3]}...")  # Show first 3 columns
            return True
            
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            return False
    
    def test_upload_invalid_file(self):
        """Test upload with invalid file type."""
        print("\n✓ Testing Invalid File Upload...")
        try:
            # Create a test file with wrong extension
            files = {'file': ('test.txt', b'invalid content', 'text/plain')}
            response = self.session.post(
                f"{self.base_url}/api/upload",
                files=files
            )
            
            # Should fail with 400 or similar
            assert response.status_code != 200, f"Should reject invalid file type"
            print(f"  Correctly rejected invalid file (status {response.status_code})")
            return True
            
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            return False
    
    # ========================================================================
    # Bias Analysis Tests
    # ========================================================================
    
    def test_analyze_bias(
        self,
        target_column="approval_status",
        task_type="classification"
    ):
        """Test /api/analyze endpoint."""
        print(f"\n✓ Testing Bias Analysis: target='{target_column}', task='{task_type}'...")
        
        if not self.uploaded_file_path:
            print("  ✗ FAILED: No file uploaded yet")
            return False
        
        try:
            payload = {
                "file_path": self.uploaded_file_path,
                "target_column": target_column,
                "task_type": task_type
            }
            
            response = self.session.post(
                f"{self.base_url}/api/analyze",
                json=payload
            )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            data = response.json()
            
            # Verify response structure
            assert "summary" in data, "Response missing 'summary'"
            assert "features" in data, "Response missing 'features'"
            
            self.analysis_result = data
            
            # Print summary
            summary = data.get("summary", {})
            print(f"  Fairness Score: {summary.get('fairness_score', 'N/A')}/100")
            print(f"  Biased Features: {len(data.get('features', []))}")
            
            # Print top biased feature
            features = sorted(
                data.get('features', []),
                key=lambda x: x.get('bias_score', 0),
                reverse=True
            )
            if features:
                top = features[0]
                print(f"  Top Biased Feature: {top.get('feature')} (score: {top.get('bias_score'):.4f})")
            
            return True
            
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_analyze_missing_target(self):
        """Test analyze with missing target column."""
        print("\n✓ Testing Analyze with Missing Target...")
        
        if not self.uploaded_file_path:
            print("  ✗ FAILED: No file uploaded yet")
            return False
        
        try:
            payload = {
                "file_path": self.uploaded_file_path,
                "target_column": "nonexistent_column",
                "task_type": "classification"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/analyze",
                json=payload
            )
            
            # Should fail with informative error
            assert response.status_code != 200, "Should reject nonexistent target column"
            print(f"  Correctly rejected invalid target (status {response.status_code})")
            error = response.json().get("detail", "Unknown error")
            print(f"  Error message: {error}")
            return True
            
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            return False
    
    # ========================================================================
    # LLM Explanation Tests
    # ========================================================================
    
    def test_explain_bias(self):
        """Test /api/explain endpoint."""
        print("\n✓ Testing LLM Explanation...")
        
        if not self.analysis_result:
            print("  ✗ FAILED: No analysis result available")
            return False
        
        try:
            payload = {
                "bias_analysis": self.analysis_result
            }
            
            response = self.session.post(
                f"{self.base_url}/api/explain",
                json=payload
            )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            data = response.json()
            
            # Verify response structure
            assert "status" in data, "Response missing 'status'"
            assert "summary" in data, "Response missing 'summary'"
            assert "key_issues" in data, "Response missing 'key_issues'"
            assert "recommendations" in data, "Response missing 'recommendations'"
            
            self.explanation_result = data
            
            # Print explanation
            print(f"  Status: {data.get('status')}")
            print(f"  Model: {data.get('model', 'unknown')}")
            print(f"  Summary: {data.get('summary', 'N/A')[:100]}...")
            if data.get('key_issues'):
                print(f"  Key Issues: {len(data.get('key_issues'))} identified")
            
            return True
            
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_explain_empty_analysis(self):
        """Test explain with empty analysis."""
        print("\n✓ Testing Explain with Empty Analysis...")
        
        try:
            payload = {
                "bias_analysis": {}
            }
            
            response = self.session.post(
                f"{self.base_url}/api/explain",
                json=payload
            )
            
            # Should still return 200 with graceful handling
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            print(f"  Gracefully handled empty analysis")
            return True
            
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            return False
    
    # ========================================================================
    # Performance & Load Tests
    # ========================================================================
    
    def test_performance(self):
        """Test API performance."""
        print("\n✓ Testing Performance...")
        
        # Time file upload
        file_path = DATASETS_DIR / "loan_approval_dataset.csv"
        
        try:
            start = time.time()
            with open(file_path, 'rb') as f:
                files = {'file': ('test.csv', f, 'text/csv')}
                response = self.session.post(f"{self.base_url}/api/upload", files=files)
            upload_time = time.time() - start
            
            assert response.status_code == 200
            file_path_resp = response.json()["file_path"]
            
            # Time analysis
            start = time.time()
            payload = {
                "file_path": file_path_resp,
                "target_column": "approval_status",
                "task_type": "classification"
            }
            response = self.session.post(f"{self.base_url}/api/analyze", json=payload)
            analysis_time = time.time() - start
            
            assert response.status_code == 200
            
            # Time explanation
            start = time.time()
            payload = {"bias_analysis": response.json()}
            response = self.session.post(f"{self.base_url}/api/explain", json=payload)
            explain_time = time.time() - start
            
            assert response.status_code == 200
            
            total_time = upload_time + analysis_time + explain_time
            
            print(f"  Upload time: {upload_time:.2f}s")
            print(f"  Analysis time: {analysis_time:.2f}s")
            print(f"  Explanation time: {explain_time:.2f}s")
            print(f"  Total pipeline time: {total_time:.2f}s")
            
            # Assert acceptable performance
            assert total_time < 60, f"Total time {total_time:.2f}s exceeds 60s threshold"
            
            return True
            
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            return False
    
    # ========================================================================
    # Test Suite Execution
    # ========================================================================
    
    def run_all_tests(self):
        """Run complete test suite."""
        print("=" * 70)
        print("BiasGuard API Test Suite")
        print("=" * 70)
        
        results = {}
        
        # Health & Status Tests
        results["Health Check"] = self.test_health_check()
        results["Root Endpoint"] = self.test_root_endpoint()
        
        # Upload Tests
        results["Upload Dataset"] = self.test_upload_dataset()
        results["Upload Invalid File"] = self.test_upload_invalid_file()
        
        # Analysis Tests
        results["Analyze Bias"] = self.test_analyze_bias()
        results["Analyze Missing Target"] = self.test_analyze_missing_target()
        
        # Explanation Tests
        results["Explain Bias"] = self.test_explain_bias()
        results["Explain Empty Analysis"] = self.test_explain_empty_analysis()
        
        # Performance Tests
        results["Performance Test"] = self.test_performance()
        
        # Print summary
        print("\n" + "=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✓ PASS" if result else "✗ FAIL"
            print(f"{status}: {test_name}")
        
        print(f"\nTotal: {passed}/{total} tests passed")
        
        return passed == total


def main():
    """Run the test suite."""
    import sys
    
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
    except requests.ConnectionError:
        print(f"✗ ERROR: Could not connect to backend at {BASE_URL}")
        print("Please ensure the backend is running:")
        print(f"  python -m uvicorn main:app --host 0.0.0.0 --port 8000")
        sys.exit(1)
    
    # Run tests
    tester = BiasuardAPITester()
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
