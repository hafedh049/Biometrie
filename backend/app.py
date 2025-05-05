from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os
from datetime import timedelta
from database import init_db
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.device_routes import device_bp
from routes.partition_routes import partition_bp
from routes.file_routes import file_bp
from routes.log_routes import log_bp

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure JWT
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "princeoflight")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
jwt = JWTManager(app)

# Initialize database
db = init_db()

# Register blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(user_bp, url_prefix="/api/users")
app.register_blueprint(device_bp, url_prefix="/api/devices")
app.register_blueprint(partition_bp, url_prefix="/api/partitions")
app.register_blueprint(file_bp, url_prefix="/api/files")
app.register_blueprint(log_bp, url_prefix="/api/logs")


# Root route
@app.route("/")
def index():
    return jsonify({"message": "Welcome to SecureNight API"})


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Server error"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")
