import json
import urllib.request

test_data = {
    "bias_analysis": {
        "summary": {"fairness_score": 0.45},
        "features": [
            {
                "feature": "gender",
                "bias_score": 0.35,
                "severity": "HIGH",
                "approval_rates": {"Male": 0.8, "Female": 0.5}
            }
        ],
        "trends": {
            "total_features_analyzed": 1,
            "high_bias_count": 1,
            "medium_bias_count": 0
        }
    }
}

req = urllib.request.Request(
    'http://localhost:8000/api/explain',
    data=json.dumps(test_data).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read())
        print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Error: {e}")
