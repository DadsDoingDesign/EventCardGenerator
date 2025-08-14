# Event Card Generator

A digital card workflow that integrates with ComfyUI's image generation pipeline to create 3D flippable event cards for web viewing and email distribution.

## Features

- **3D Flippable Cards**: Interactive web cards with front/back flip animation
- **Email-Ready Output**: Static card rendering optimized for email clients
- **ComfyUI Integration**: Seamless integration with existing RunPod workflow
- **Responsive Design**: Works on desktop and mobile devices
- **Customizable Styling**: Gradient borders, overlay bars, and modern UI

## Card Design

### Front Card
- Generated image flush against left edge (no padding)
- Gradient border around entire card
- Left overlay bar with vertical date text
- Bar width equals border width (8px default)

### Back Card
- Event information (name, date, location, organizer, description)
- User information (name, member since, discount code)
- Logo placeholder
- Gradient background

## Quick Start

1. **Start the Card Server**:
   ```bash
   cd card_generator
   python card_server.py
   ```

2. **Open Web Interface**:
   Navigate to `http://localhost:5001` in your browser

3. **Test the Cards**:
   - Click "Generate Test Card" to create a sample card
   - Click the card to flip between front and back
   - Use "Email View" to see the email-optimized version

## Integration with ComfyUI Workflow

### 1. Webhook Handler Integration

Modify your `luma_webhook_handler.py` to include card generation:

```python
from card_integration import handle_card_generation

# In your trigger_runpod_generation method:
result = processor.trigger_runpod_generation(event_data)

# Add card generation after successful image generation:
if result.get('status') == 'success':
    card_result = handle_card_generation(result)
    result['cards'] = card_result
```

### 2. API Endpoints

- `POST /api/generate-cards` - Generate cards from RunPod data
- `GET /api/cards/{card_id}` - Get specific card data
- `GET /api/cards/{card_id}/email` - Get email HTML for card
- `GET /api/cards/{card_id}/preview` - Preview email in browser
- `POST /api/test-integration` - Test with sample data

### 3. Data Flow

```
Luma Event → Webhook Handler → RunPod Worker → Card Generator → Email/Web Output
```

## Configuration

### Environment Variables
- `CARD_SERVER_PORT` - Port for card server (default: 5001)
- `CARD_OUTPUT_DIR` - Directory for saving email HTML files

### Styling Variables (CSS)
```css
:root {
    --card-width: 400px;
    --card-height: 600px;
    --border-width: 8px;
    --gradient-primary: #ff6b6b;
    --gradient-secondary: #4ecdc4;
    --gradient-tertiary: #45b7d1;
}
```

## File Structure

```
card_generator/
├── index.html              # Main web interface
├── styles.css              # Card styling and animations
├── card-generator.js       # Frontend JavaScript logic
├── card_server.py          # Flask server and API
├── output/                 # Generated email HTML files
└── README.md              # This file

card_integration.py         # Integration with existing workflow
```

## Testing

### Manual Testing
1. Start the card server: `python card_server.py`
2. Open `http://localhost:5001`
3. Click "Generate Test Card" to create sample cards
4. Test 3D flip animation by clicking the card
5. Test email view with "Email View" button

### API Testing
```bash
# Test card generation with sample data
curl -X POST http://localhost:5001/api/test-integration

# Get card data
curl http://localhost:5001/api/cards/{card_id}

# Preview email HTML
curl http://localhost:5001/api/cards/{card_id}/preview
```

## Integration Examples

### Example: RunPod Worker Output
```json
{
    "status": "success",
    "attendee_count": 25,
    "images_generated": 25,
    "event_data": {
        "event_id": "evt_123",
        "event_name": "Summer Tech Meetup",
        "date": "2025-08-15T18:00:00Z",
        "location": "San Francisco, CA",
        "organizer": "Tech Community SF"
    },
    "images": [
        {
            "data": "base64_image_data...",
            "seed": 12345,
            "variation": "ocean waves crashing on shore",
            "index": 1
        }
    ]
}
```

### Example: Generated Card Data
```json
{
    "card_id": "evt_123_1",
    "event_data": {...},
    "user_data": {
        "name": "Attendee 1",
        "member_since": "January 15, 2025",
        "discount_code": "BKYBLD25",
        "avatar": "A1"
    },
    "image_data": {
        "url": "data:image/png;base64,...",
        "seed": 12345,
        "variation": "ocean waves crashing on shore"
    }
}
```

## Customization

### Adding New Card Styles
1. Modify CSS variables in `styles.css`
2. Update gradient colors and border styles
3. Adjust card dimensions and animations

### Email Template Customization
1. Edit the email HTML template in `card_server.py`
2. Modify the `generate_email_html` method
3. Test with different email clients

### Integration with Email Services
1. Implement email sending in `card_integration.py`
2. Add your email service API credentials
3. Modify `process_individual_card` method

## Browser Support

- **3D Animations**: Modern browsers with CSS3 support
- **Email HTML**: Compatible with major email clients
- **Responsive**: Works on desktop, tablet, and mobile

## Dependencies

- Flask (web server)
- Flask-CORS (cross-origin requests)
- Requests (HTTP client)
- Pillow (image processing, if needed)

Install with:
```bash
pip install flask flask-cors requests pillow
```
