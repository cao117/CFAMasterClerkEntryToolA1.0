from flask import Flask, jsonify
from datetime import datetime

app = Flask(__name__)

# Your existing get-date endpoint
@app.route('/get-date')
def get_date():
    current_datetime = datetime.now()
    return jsonify({
        "date": current_datetime.strftime("%Y-%m-%d %H:%M:%S") # Changed key from "current_date" to "date" for consistency with browser image
    })

# NEW: MCP Discovery Endpoint
@app.route('/')
def mcp_discovery():
    return jsonify({
        "tools": [
            {
                "name": "get_current_date",
                "description": "Retrieves the current date and time from a local Flask server.",
                "input_schema": {
                    "type": "object",
                    "properties": {},
                    "required": []
                },
                "path": "/get-date",
                "method": "GET"
            }
        ]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)