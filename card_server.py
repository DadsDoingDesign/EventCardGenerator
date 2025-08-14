"""
Card Generator Server
Integrates with ComfyUI workflow to generate digital event cards
"""

import os
import json
import logging
import base64
from datetime import datetime
from flask import Flask, request, jsonify, render_template_string, send_from_directory
from flask_cors import CORS
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# In-memory storage for the latest card data received from the webhook
latest_card_data = {}

class CardGenerator:
    def __init__(self):
        self.cards_storage = {}  # In-memory storage for demo
        
    def generate_card_from_runpod_data(self, runpod_data):
        """
        Generate card data from RunPod worker output
        Expected format from runpod_worker.py:
        {
            "status": "success",
            "attendee_count": 25,
            "images_generated": 25,
            "event_data": {...},
            "images": [{"data": "base64...", "seed": 12345, "variation": "...", "index": 1}]
        }
        """
        try:
            if runpod_data.get('status') != 'success':
                raise ValueError(f"RunPod generation failed: {runpod_data.get('error', 'Unknown error')}")
            
            images = runpod_data.get('images', [])
            if not images:
                raise ValueError("No images generated")
            
            event_data = runpod_data.get('event_data', {})
            
            # Generate cards for each attendee
            cards = []
            for i, image_data in enumerate(images):
                card_id = f"{event_data.get('event_id', 'unknown')}_{i+1}"
                
                card = {
                    'card_id': card_id,
                    'event_data': {
                        'event_id': event_data.get('event_id', ''),
                        'event_name': event_data.get('event_name', 'Event'),
                        'date': self.format_date(event_data.get('date', '')),
                        'location': event_data.get('location', ''),
                        'description': event_data.get('description', ''),
                        'organizer': event_data.get('organizer', '')
                    },
                    'user_data': {
                        'name': f"Attendee {i+1}",  # This would come from attendee data in real implementation
                        'member_since': self.format_date(datetime.now().isoformat()),
                        'discount_code': self.generate_discount_code(),
                        'avatar': self.get_initials(f"Attendee {i+1}")
                    },
                    'image_data': {
                        'url': f"data:image/png;base64,{image_data.get('data', '')}",
                        'seed': image_data.get('seed', 0),
                        'variation': image_data.get('variation', ''),
                        'index': image_data.get('index', i+1)
                    },
                    'created_at': datetime.now().isoformat()
                }
                
                cards.append(card)
                self.cards_storage[card_id] = card
            
            logger.info(f"Generated {len(cards)} cards for event {event_data.get('event_name', 'Unknown')}")
            return cards
            
        except Exception as e:
            logger.error(f"Failed to generate cards: {e}")
            raise
    
    def generate_email_html(self, card_data):
        """Generate email-ready HTML for a card"""
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{ event_name }} - Event Card</title>
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 300px; margin: 0 auto;">
                <div style="
                    position: relative;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%);
                    padding: 8px;
                ">
                    <div style="
                        position: relative;
                        border-radius: 8px;
                        overflow: hidden;
                        background: white;
                    ">
                        <img src="{{ image_url }}" alt="{{ event_name }}" style="
                            width: 100%;
                            height: 400px;
                            object-fit: cover;
                            display: block;
                        ">
                        <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 8px;
                            height: 100%;
                            background: rgba(0, 0, 0, 0.8);
                            display: flex;
                            align-items: flex-start;
                            justify-content: center;
                            padding-top: 15px;
                        ">
                            <span style="
                                color: white;
                                font-weight: 700;
                                font-size: 11px;
                                writing-mode: vertical-rl;
                                text-orientation: mixed;
                                letter-spacing: 1px;
                                text-transform: uppercase;
                            ">{{ date }}</span>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #2c3e50;">
                    <h2 style="margin: 0 0 10px 0;">{{ event_name }}</h2>
                    <p style="margin: 0 0 5px 0;"><strong>Date:</strong> {{ date }}</p>
                    <p style="margin: 0 0 5px 0;"><strong>Location:</strong> {{ location }}</p>
                    <p style="margin: 0 0 15px 0;">{{ description }}</p>
                    
                    <div style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px;
                        border-radius: 8px;
                        margin-top: 15px;
                    ">
                        <p style="margin: 0 0 10px 0;"><strong>{{ user_name }}</strong></p>
                        <p style="margin: 0 0 10px 0; font-size: 12px;">{{ member_since }}</p>
                        <div style="
                            background: rgba(255, 255, 255, 0.15);
                            padding: 8px;
                            border-radius: 6px;
                        ">
                            <p style="margin: 0 0 5px 0; font-size: 11px;">Your discount code:</p>
                            <p style="margin: 0; font-weight: bold; letter-spacing: 1px;">{{ discount_code }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return render_template_string(template,
            event_name=card_data['event_data']['event_name'],
            date=card_data['event_data']['date'],
            location=card_data['event_data']['location'],
            description=card_data['event_data']['description'],
            image_url=card_data['image_data']['url'],
            user_name=card_data['user_data']['name'],
            member_since=f"Member since: {card_data['user_data']['member_since']}",
            discount_code=card_data['user_data']['discount_code']
        )
    
    def format_date(self, date_str):
        """Format date string to readable format"""
        try:
            if not date_str:
                return datetime.now().strftime('%B %d, %Y')
            
            # Try parsing ISO format
            if 'T' in date_str:
                dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                return dt.strftime('%B %d, %Y')
            
            # Return as-is if already formatted
            return date_str
        except:
            return datetime.now().strftime('%B %d, %Y')
    
    def generate_discount_code(self):
        """Generate a random discount code"""
        import random
        import string
        chars = string.ascii_uppercase + string.digits
        return ''.join(random.choice(chars) for _ in range(8))
    
    def get_initials(self, name):
        """Get initials from name"""
        return ''.join(word[0].upper() for word in name.split() if word)

# Initialize card generator
card_generator = CardGenerator()


@app.route('/generate-card', methods=['POST'])
def generate_card():
    """Receives card data from the webhook handler and stores it."""
    global latest_card_data
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Store the received data
        latest_card_data = {
            'eventName': data.get('event_name'),
            'date': card_generator.format_date(data.get('date')),
            'userName': data.get('user_name'),
            'userEmail': data.get('user_email'),
            'imageUrl': data.get('image_url')
        }
        logger.info(f"Received and stored new card data for {latest_card_data['userName']}")
        
        return jsonify({'status': 'success', 'message': 'Card data received'}), 200

    except Exception as e:
        logger.error(f"Error in /generate-card: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/latest-card')
def get_latest_card():
    """Provides the latest card data to the frontend."""
    if not latest_card_data:
        return jsonify({'error': 'No card data available'}), 404
    return jsonify(latest_card_data)


@app.route('/')
def index():
    """Serve the card generator interface"""
    return send_from_directory('public', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('public', filename)

@app.route('/api/generate-cards', methods=['POST'])
def generate_cards():
    """
    Generate cards from RunPod worker data
    Expected input: RunPod worker output format
    """
    try:
        runpod_data = request.get_json()
        
        if not runpod_data:
            return jsonify({'error': 'No data provided'}), 400
        
        cards = card_generator.generate_card_from_runpod_data(runpod_data)
        
        return jsonify({
            'status': 'success',
            'cards_generated': len(cards),
            'cards': cards
        })
        
    except Exception as e:
        logger.error(f"Card generation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cards/<card_id>')
def get_card(card_id):
    """Get a specific card by ID"""
    card = card_generator.cards_storage.get(card_id)
    
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    return jsonify(card)

@app.route('/api/cards/<card_id>/email')
def get_card_email(card_id):
    """Get email HTML for a specific card"""
    card = card_generator.cards_storage.get(card_id)
    
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    email_html = card_generator.generate_email_html(card)
    
    return jsonify({
        'card_id': card_id,
        'email_html': email_html
    })

@app.route('/api/cards/<card_id>/preview')
def preview_card_email(card_id):
    """Preview email HTML for a specific card"""
    card = card_generator.cards_storage.get(card_id)
    
    if not card:
        return "Card not found", 404
    
    return card_generator.generate_email_html(card)

@app.route('/api/test-integration', methods=['POST'])
def test_integration():
    """Test endpoint to simulate RunPod worker integration"""
    try:
        # Simulate RunPod worker data
        test_data = {
            "status": "success",
            "attendee_count": 3,
            "images_generated": 3,
            "event_data": {
                "event_id": f"test_{int(datetime.now().timestamp())}",
                "event_name": "Summer Tech Meetup",
                "date": "2025-08-15T18:00:00Z",
                "location": "San Francisco, CA",
                "description": "Join us for an evening of tech talks and networking.",
                "organizer": "Tech Community SF"
            },
            "images": [
                {
                    "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",  # 1x1 transparent PNG
                    "seed": 12345,
                    "variation": "ocean waves crashing on shore",
                    "index": 1
                },
                {
                    "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                    "seed": 67890,
                    "variation": "gentle rolling waves at sunset",
                    "index": 2
                },
                {
                    "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                    "seed": 11111,
                    "variation": "powerful storm waves",
                    "index": 3
                }
            ]
        }
        
        cards = card_generator.generate_card_from_runpod_data(test_data)
        
        return jsonify({
            'status': 'success',
            'message': 'Test integration completed',
            'cards_generated': len(cards),
            'cards': cards,
            'sample_email_url': f'/api/cards/{cards[0]["card_id"]}/preview' if cards else None
        })
        
    except Exception as e:
        logger.error(f"Test integration error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'cards_in_storage': len(card_generator.cards_storage)
    })

if __name__ == '__main__':
    try:
        logger.info("Attempting to start Card Generator Server on port 5001...")
        app.run(host='0.0.0.0', port=5001, debug=True)
    except Exception as e:
        logger.exception(f"FATAL: Server failed to start: {e}")
