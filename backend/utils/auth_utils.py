from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from database import get_db


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        db = get_db()
        current_user_id = get_jwt_identity()
        current_user = db.users.find_one({"_id": ObjectId(current_user_id)})

        if not current_user or current_user.get("role") != "admin":
            return jsonify({"error": "Admin privileges required"}), 403

        return fn(*args, **kwargs)

    return wrapper
