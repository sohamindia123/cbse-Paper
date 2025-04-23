from flask import Flask, render_template, request, jsonify
from typing import Dict, List
import random
import os
from dotenv import load_dotenv
import json
import requests

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)

# Configure Google API
GEMINI_API_KEY = "AIzaSyCxu5nG-KiRWAl-OTpTPocigNIJacUljdo"  # Your Gemini API key

class QuestionPaperGenerator:
    def __init__(self):
        self.sections = {
            'A': {'type': 'MCQ', 'marks': 1},
            'B': {'type': 'Very Short', 'marks': 2},
            'C': {'type': 'Short', 'marks': 3},
            'D': {'type': 'Long', 'marks': 5}
        }

    def calculate_marks(self, question_counts: Dict[str, int]) -> int:
        return sum(count * self.sections[section]['marks'] 
                  for section, count in question_counts.items())

    def generate_ai_questions(self, subject: str, class_number: str, section: str, count: int) -> List[Dict]:
        if count == 0:
            return []

        question_type = self.sections[section]['type']
        marks = self.sections[section]['marks']

        try:
            prompt = f"""Create {count} {question_type} questions for CBSE Class {class_number} {subject} based on the 2024-2025 updated CBSE curriculum.
Each question is worth {marks} marks.

IMPORTANT: 
1. Questions MUST strictly follow the latest CBSE syllabus (2024-2025 academic year)
2. Include questions on recently added topics in the {subject} curriculum
3. Follow the exact CBSE question pattern and difficulty level
4. Ensure questions are age-appropriate for Class {class_number} students
5. Cover diverse topics from the current syllabus
6. Questions must be syllabus-oriented and align with NCERT textbooks
7. Include chapter-specific questions covering key concepts

For MCQs, include 4 options labeled A, B, C, D with one correct answer.
For other questions, make them appropriate for {marks} marks assessment.

Format as JSON array EXACTLY as shown below (no additional text):
For MCQs: [{{"text": "Question?", "options": ["A", "B", "C", "D"]}}]
For others: [{{"text": "Question?"}}]"""

            print(f"\nGenerating {question_type} questions for {subject} Class {class_number}")
            print(f"Prompt: {prompt}")

            # Use direct REST API call to Gemini API
            url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
            headers = {
                "Content-Type": "application/json"
            }
            
            data = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "topP": 0.8,
                    "topK": 40
                }
            }
            
            # Add API key as query parameter
            params = {
                "key": GEMINI_API_KEY
            }
            
            print("\nSending request to Gemini API...")
            response = requests.post(url, headers=headers, json=data, params=params)
            print(f"API Response Status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"API Error: {response.text}")
                return self.get_default_questions(section)[:count]
            
            response_json = response.json()
            print(f"Response JSON: {json.dumps(response_json, indent=2)}")
            
            # Extract text from response
            try:
                response_text = response_json['candidates'][0]['content']['parts'][0]['text']
                print(f"\nAPI Response Text: {response_text}")
            except (KeyError, IndexError) as e:
                print(f"Error extracting text from response: {str(e)}")
                return self.get_default_questions(section)[:count]

            try:
                # Try to extract JSON from the response
                # First, try to find JSON array in the response
                import re
                json_match = re.search(r'\[\s*{.*}\s*\]', response_text, re.DOTALL)
                
                if json_match:
                    json_str = json_match.group(0)
                    questions = json.loads(json_str)
                else:
                    # Try to parse the entire response as JSON
                    questions = json.loads(response_text)
                
                print(f"\nParsed Questions: {json.dumps(questions, indent=2)}")

                # Ensure we have a list of questions
                if isinstance(questions, dict):
                    questions = questions.get('questions', [])
                elif not isinstance(questions, list):
                    questions = []

                # Validate questions
                valid_questions = []
                for q in questions:
                    if isinstance(q, dict) and 'text' in q:
                        if section == 'A':
                            if 'options' in q and len(q['options']) == 4:
                                valid_questions.append(q)
                        else:
                            valid_questions.append(q)

                print(f"\nValid Questions Count: {len(valid_questions)}")
                if valid_questions:
                    return valid_questions[:count]
                else:
                    print("No valid questions found in response")
                    return self.get_default_questions(section)[:count]

            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {str(e)}")
                print(f"Invalid JSON response: {response_text}")
                return self.get_default_questions(section)[:count]

        except Exception as e:
            print(f"Error in question generation: {str(e)}")
            return self.get_default_questions(section)[:count]

    def get_default_questions(self, section: str) -> List[Dict]:
        # Your existing question bank as fallback
        question_bank = {
            'A': [
                {'text': 'What is the SI unit of force?', 
                 'options': ['Newton', 'Joule', 'Watt', 'Pascal']},
                {'text': 'Which of these is a vector quantity?',
                 'options': ['Speed', 'Velocity', 'Time', 'Mass']},
                {'text': 'What is the chemical formula for water?',
                 'options': ['H2O', 'CO2', 'O2', 'N2']},
                {'text': 'What is the atomic number of Carbon?',
                 'options': ['6', '8', '12', '14']},
                {'text': 'Which is the longest bone in human body?',
                 'options': ['Femur', 'Tibia', 'Humerus', 'Radius']}
            ],
            'B': [
                {'text': 'Define Newton\'s first law of motion.'},
                {'text': 'What is photosynthesis?'},
                {'text': 'Define potential energy.'},
                {'text': 'What is an atom?'},
                {'text': 'What is a chemical equation?'}
            ],
            'C': [
                {'text': 'Explain the process of digestion in humans.'},
                {'text': 'Describe the water cycle with diagram.'},
                {'text': 'Explain the working principle of an electric motor.'},
                {'text': 'What are the different types of chemical reactions? Give examples.'},
                {'text': 'Describe the structure of a plant cell.'}
            ],
            'D': [
                {'text': 'Explain the human respiratory system with diagram.'},
                {'text': 'Describe Newton\'s laws of motion with examples.'},
                {'text': 'Explain the structure of an atom with diagram.'},
                {'text': 'Describe the process of reproduction in flowering plants.'},
                {'text': 'Explain the working of electric generator with diagram.'}
            ]
        }
        return question_bank.get(section, [])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_paper():
    data = request.get_json()
    
    subject = data.get('subject')
    class_number = data.get('class')
    question_counts = {
        'A': int(data.get('mcq_count', 0)),
        'B': int(data.get('very_short_count', 0)),
        'C': int(data.get('short_count', 0)),
        'D': int(data.get('long_count', 0))
    }
    
    generator = QuestionPaperGenerator()
    total_marks = generator.calculate_marks(question_counts)
    
    # Generate AI questions for each section
    paper_content = {
        section: generator.generate_ai_questions(
            subject, 
            class_number, 
            section, 
            question_counts[section]
        ) for section in question_counts.keys()
    }
    
    response = {
        'subject': subject,
        'class': class_number,
        'total_marks': total_marks,
        'paper_structure': question_counts,
        'content': paper_content
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True) 