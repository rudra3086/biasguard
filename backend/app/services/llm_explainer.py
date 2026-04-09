"""
LLM-based AI Fairness Explanation Module

Uses Google Gemini API to generate human-readable explanations for bias analysis results.
"""

import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class LLMExplainer:
    """Service for generating AI explanations of bias analysis results using Gemini API."""
    
    def __init__(self):
        """Initialize the LLM explainer with Gemini API."""
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.use_gemini = bool(self.api_key)
        
        if self.use_gemini:
            try:
                import google.generativeai as genai
                self.client = genai.GenerativeModel('gemini-pro')
                genai.configure(api_key=self.api_key)
                logger.info("Gemini API client initialized successfully")
            except ImportError:
                logger.warning("google-generativeai not installed. Using fallback explanations.")
                self.use_gemini = False
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini API: {e}. Using fallback explanations.")
                self.use_gemini = False
    
    def generate_explanation(self, bias_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate comprehensive AI explanation for bias analysis results.
        
        Args:
            bias_analysis: Dictionary with bias analysis results
            
        Returns:
            Dictionary with explanation components (summary, insights, recommendations)
        """
        try:
            if self.use_gemini:
                return self._generate_with_gemini(bias_analysis)
            else:
                return self._generate_fallback_explanation(bias_analysis)
        except Exception as e:
            logger.error(f"Error generating explanation: {e}")
            return self._generate_fallback_explanation(bias_analysis)
    
    def _generate_with_gemini(self, bias_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate explanation using Gemini API."""
        try:
            # Prepare the prompt
            prompt = self._create_prompt(bias_analysis)
            
            # Call Gemini API
            response = self.client.generate_content(prompt)
            response_text = response.text
            
            # Parse response
            explanation = self._parse_gemini_response(response_text, bias_analysis)
            
            logger.info("Successfully generated explanation using Gemini API")
            return explanation
            
        except Exception as e:
            logger.error(f"Gemini API error: {e}. Falling back to template explanations.")
            return self._generate_fallback_explanation(bias_analysis)
    
    def _create_prompt(self, bias_analysis: Dict[str, Any]) -> str:
        """Create a comprehensive prompt for the LLM."""
        fairness_score = bias_analysis.get('summary', {}).get('fairness_score', 0)
        features = bias_analysis.get('features', [])
        
        # Get top biased features
        top_biased = sorted(features, key=lambda x: x.get('bias_score', 0), reverse=True)[:3]
        
        prompt = f"""
You are an expert AI fairness auditor. Analyze the following model bias report and provide insights:

## Dataset Fairness Score: {fairness_score:.2f}/100

## Top Biased Features:
"""
        for i, feature in enumerate(top_biased, 1):
            prompt += f"""
{i}. {feature['feature']} (Bias Score: {feature['bias_score']:.4f}, Severity: {feature['severity']})
   - Type: {feature['type']}
   - Groups: {', '.join(f"{k}: {v:.2%}" for k, v in feature['groups'].items())}
"""
        
        prompt += """
Based on this bias analysis, provide:
1. **Summary**: A brief 2-3 sentence overall assessment of model fairness
2. **Key Issues**: List the 2-3 most critical bias problems and why they matter
3. **Root Causes**: Speculate on potential reasons for detected biases
4. **Recommendations**: Provide 3 specific, actionable recommendations to improve fairness

Format your response as a structured JSON object.
"""
        return prompt
    
    def _parse_gemini_response(self, response_text: str, bias_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Gemini API response and structure it properly."""
        try:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                response_json = json.loads(json_match.group())
            else:
                response_json = self._text_to_json(response_text)
        except:
            response_json = self._text_to_json(response_text)
        
        return {
            'status': 'success',
            'summary': response_json.get('summary', response_text[:200]),
            'key_issues': response_json.get('key_issues', []),
            'root_causes': response_json.get('root_causes', []),
            'recommendations': response_json.get('recommendations', []),
            'generated_at': self._get_timestamp(),
            'model': 'gemini-pro'
        }
    
    def _text_to_json(self, text: str) -> Dict[str, Any]:
        """Convert text response to structured JSON."""
        # Simple fallback parsing for plain text responses
        return {
            'summary': text[:300] if text else "Unable to generate explanation",
            'key_issues': ["See summary for details"],
            'root_causes': [],
            'recommendations': []
        }
    
    def _generate_fallback_explanation(self, bias_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate explanation without LLM (template-based)."""
        summary = bias_analysis.get('summary', {})
        features = bias_analysis.get('features', [])
        fairness_score = summary.get('fairness_score', 0)
        
        # Generate template-based explanation
        top_biased = sorted(features, key=lambda x: x.get('bias_score', 0), reverse=True)[:3]
        
        if fairness_score >= 80:
            summary_text = "Your model shows good fairness across demographic groups with minimal disparities."
        elif fairness_score >= 60:
            summary_text = "Your model has some fairness concerns that should be reviewed and addressed."
        else:
            summary_text = "Your model exhibits significant bias patterns that require immediate action."
        
        key_issues = []
        for feature in top_biased:
            key_issues.append(
                f"{feature['feature']} shows {feature['severity'].lower()} bias "
                f"(score: {feature['bias_score']:.4f}) with disparities across {len(feature['groups'])} groups"
            )
        
        recommendations = [
            f"Investigate {top_biased[0]['feature']} as the primary source of bias",
            "Consider removing or adjusting sensitive features from the model",
            "Retrain the model with fairness constraints (e.g., demographic parity)",
            "Implement regular fairness monitoring and audits"
        ]
        
        return {
            'status': 'success',
            'summary': summary_text,
            'key_issues': key_issues,
            'root_causes': [
                "Data imbalance in representation of demographic groups",
                "Historical biases in training data",
                "Model optimization toward specific subgroups"
            ],
            'recommendations': recommendations,
            'generated_at': self._get_timestamp(),
            'model': 'template-based'
        }
    
    @staticmethod
    def _get_timestamp() -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().isoformat()
