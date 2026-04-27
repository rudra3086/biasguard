"""
Gemini-powered demographic category detection

Uses Google Gemini to intelligently identify demographic categories in datasets
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


class DemographicDetector:
    """Service for detecting demographic categories using Gemini API."""
    
    def __init__(self):
        """Initialize the demographic detector with Gemini API."""
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.use_gemini = bool(self.api_key)
        
        if self.use_gemini:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel('gemini-1.5-flash')
                logger.info("Gemini API client initialized for demographic detection")
            except ImportError:
                logger.warning("google-generativeai not installed. Using fallback detection.")
                self.use_gemini = False
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini API: {e}. Using fallback detection.")
                self.use_gemini = False
    
    def detect_demographic_categories(self, column_names: List[str], sample_data: Dict[str, List[Any]] = None) -> Dict[str, Any]:
        """
        Detect which columns are demographic categories using Gemini.
        
        Args:
            column_names: List of column names in the dataset
            sample_data: Sample data from each column for context
            
        Returns:
            Dictionary with detected demographics and their types
        """
        try:
            if self.use_gemini:
                return self._detect_with_gemini(column_names, sample_data)
            else:
                return self._detect_fallback(column_names)
        except Exception as e:
            logger.error(f"Error detecting demographics: {e}")
            return self._detect_fallback(column_names)
    
    def _detect_with_gemini(self, column_names: List[str], sample_data: Dict[str, List[Any]] = None) -> Dict[str, Any]:
        """Detect demographics using Gemini API."""
        try:
            prompt = self._create_detection_prompt(column_names, sample_data)
            response = self.client.generate_content(prompt)
            
            # Parse the response
            result = self._parse_gemini_response(response.text)
            logger.info(f"Gemini detected demographics: {result.get('demographic_categories', [])}")
            return result
            
        except Exception as e:
            logger.error(f"Gemini detection error: {e}. Falling back to template detection.")
            return self._detect_fallback(column_names)
    
    def _create_detection_prompt(self, column_names: List[str], sample_data: Dict[str, List[Any]] = None) -> str:
        """Create a prompt for Gemini to detect demographic categories."""
        sample_section = ""
        if sample_data:
            sample_section = "\n\nSample values from each column:\n"
            for col, values in sample_data.items():
                # Take first 3 unique values as examples
                unique_vals = list(set(str(v) for v in values[:100]))[:3]
                sample_section += f"- {col}: {', '.join(unique_vals)}\n"
        
        prompt = f"""You are an expert in demographic data analysis. I have a dataset with the following columns:

{chr(10).join([f"- {col}" for col in column_names])}{sample_section}

Your task is to identify which columns represent DEMOGRAPHIC CATEGORIES (protected characteristics that could lead to bias):

DEMOGRAPHIC CATEGORIES include:
- Gender/Sex (male, female, non-binary, etc.)
- Race/Ethnicity (caucasian, african american, hispanic, asian, etc.)
- Religion (christian, muslim, jewish, hindu, etc.)
- Age (young, middle-aged, senior, specific age ranges)
- Disability status
- National origin/Nationality
- Sexual orientation
- Marital status (when used in decision-making)
- Family status/Parental status
- Military status
- Socioeconomic status/Income level
- Education level (when it's a demographic characteristic)
- Immigration status

EXCLUDE columns that are:
- Personal identifiers (ID, name, email)
- Locations (city, street address - these are not demographic categories)
- Technical attributes
- Process dates/timestamps
- Target/outcome variables
- Features derived from demographic categories

Return your response as JSON with this exact format:
{{
  "demographic_categories": [
    {{
      "column": "column_name",
      "type": "gender|race|religion|age|disability|origin|orientation|marital|family|military|socioeconomic|education|other",
      "description": "brief explanation of why this is a demographic category"
    }}
  ],
  "non_demographic_columns": ["list", "of", "non_demographic_columns"],
  "explanation": "Brief explanation of your classification"
}}

Be strict and conservative - only include columns that are clearly demographic categories."""

        return prompt
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini's response."""
        try:
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                result = json.loads(json_str)
                return {
                    "status": "success",
                    "method": "gemini",
                    "demographic_categories": result.get('demographic_categories', []),
                    "non_demographic_columns": result.get('non_demographic_columns', []),
                    "explanation": result.get('explanation', '')
                }
        except Exception as e:
            logger.warning(f"Failed to parse Gemini response: {e}")
        
        return self._detect_fallback([])
    
    def _detect_fallback(self, column_names: List[str]) -> Dict[str, Any]:
        """Fallback demographic detection using keyword matching."""
        demographic_keywords = {
            'gender': ['gender', 'sex'],
            'race': ['race', 'ethnicity', 'ethnic'],
            'religion': ['religion', 'faith'],
            'age': ['age', 'age_group', 'age_range'],
            'disability': ['disability', 'disabled', 'handicap'],
            'origin': ['origin', 'nationality', 'national_origin', 'country'],
            'socioeconomic': ['income', 'socioeconomic', 'ses', 'salary', 'wage'],
            'education': ['education', 'education_level', 'degree'],
            'marital': ['marital', 'married', 'marital_status'],
        }
        
        detected = []
        excluded = []
        
        exclude_keywords = ['id', 'name', 'email', 'address', 'city', 'date', 'time', 'timestamp', 'created', 'updated']
        
        for col in column_names:
            col_lower = col.lower()
            
            # Check if should be excluded
            if any(exc in col_lower for exc in exclude_keywords):
                excluded.append(col)
                continue
            
            # Check for demographic keywords
            for demo_type, keywords in demographic_keywords.items():
                if any(kw in col_lower for kw in keywords):
                    detected.append({
                        "column": col,
                        "type": demo_type,
                        "description": f"Detected as {demo_type} category"
                    })
                    break
            else:
                excluded.append(col)
        
        return {
            "status": "success",
            "method": "fallback",
            "demographic_categories": detected,
            "non_demographic_columns": excluded,
            "explanation": f"Detected {len(detected)} demographic categories using keyword matching"
        }
