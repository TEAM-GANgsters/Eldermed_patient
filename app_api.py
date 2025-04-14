from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import logging
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Initialize environment
load_dotenv()
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure the generative AI API
genai.configure(api_key=GEMINI_API_KEY)

app = Flask(__name__)
# Enable CORS with specific origins
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://localhost:8080", "http://localhost:8081", "http://localhost:3000", "http://localhost:5000", "*"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

def get_response(query):
    """
    Process a user query and return an AI-generated response
    """
    try:
        # Configure the model
        generation_config = {
            "temperature": 0.4,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 1024,
        }
        
        # Create a prompt with medical context
        prompt = f"""As a medical assistant, please answer the following question. 
        Give accurate medical information based on established medical knowledge.
        If you don't know the answer, say you don't know rather than making up information.
        
        Question: {query}
        """
        
        # Get response from Gemini
        model = genai.GenerativeModel(model_name="gemini-pro", generation_config=generation_config)
        response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        logger.error(f"Error getting response: {str(e)}")
        return f"Sorry, I encountered an error: {str(e)}"

@app.route('/')
def home():
    return jsonify({"status": "API is running"})

@app.route('/api/chat', methods=['POST'])
def chat():
    start_time = time.time()
    
    try:
        data = request.json
        if not data or 'query' not in data:
            return jsonify({"error": "Missing 'query' in request"}), 400
        
        user_query = data['query']
        logger.info(f"Received query: {user_query}")
        
        # Get response from the model
        response = get_response(user_query)
        
        processing_time = time.time() - start_time
        logger.info(f"Query processed in {processing_time:.2f} seconds")
        
        return jsonify({
            "response": response,
            "processing_time": f"{processing_time:.2f} seconds"
        })
    
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        return jsonify({
            "error": "Failed to process query",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    # Make sure the port matches what's expected in the frontend
    port = 5001
    logger.info(f"Starting Medical Chatbot API server on port {port}")
    app.run(debug=True, port=port, host='0.0.0.0') 