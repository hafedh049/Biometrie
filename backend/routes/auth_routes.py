from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import uuid
from database import get_db, serialize_doc
from utils.fingerprint_utils import process_fingerprint
from utils.validators import validate_email, validate_password
from bson import ObjectId
from utils.log_utils import save_log
import base64
import hashlib
import numpy as np
import cv2
from PIL import Image
import io


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    db = get_db()

    # Validate required fields
    required_fields = ["username", "email", "password", "phone_number"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Validate email format
    if not validate_email(data["email"]):
        return jsonify({"error": "Invalid email format"}), 400

    # Validate password strength
    if not validate_password(data["password"]):
        return (
            jsonify(
                {
                    "error": "Password must be at least 8 characters and include uppercase, lowercase, number and special character"
                }
            ),
            400,
        )

    # Check if user already exists
    if db.users.find_one({"email": data["email"]}):
        save_log(
            log_type="auth",
            message=f"Registration failed - Email already exists: {data['email']}",
            source="auth_routes.register",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Email already registered"}), 409

    if db.users.find_one({"username": data["username"]}):
        save_log(
            log_type="auth",
            message=f"Registration failed - Username already exists: {data['username']}",
            source="auth_routes.register",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Username already taken"}), 409

    # Create new user
    new_user = {
        "user_id": str(uuid.uuid4()),
        "username": data["username"],
        "email": data["email"],
        "password": generate_password_hash(data["password"]),
        "phone_number": data["phone_number"],
        "fingerprint_hashes": [],
        "fingerprint_pictures": [],
        "last_login": None,
        "last_logout": None,
        "account_status": "active",
        "role": "client",
        "created_at": datetime.datetime.utcnow(),
    }

    db.users.insert_one(new_user)

    save_log(
        log_type="auth",
        message=f"User registered successfully: {data['username']}",
        user_id=new_user["user_id"],
        source="auth_routes.register",
        ip_address=request.remote_addr,
        status="info",
    )

    # Remove password before returning
    new_user.pop("password", None)

    return (
        jsonify(
            {"message": "User registered successfully", "user": serialize_doc(new_user)}
        ),
        201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    db = get_db()

    # Check login method
    if "email" in data and "password" in data:
        # Email/password login
        user = db.users.find_one({"email": data["email"]})

        if not user or not check_password_hash(user["password"], data["password"]):
            save_log(
                log_type="auth",
                message=f"Login failed - Invalid credentials for email: {data.get('email', 'unknown')}",
                source="auth_routes.login",
                ip_address=request.remote_addr,
                status="warning",
            )
            return jsonify({"error": "Invalid email or password"}), 401

    elif "fingerprint" in data:
        # Fingerprint login with base64 encoded image
        fingerprint_b64 = data["fingerprint"]

        try:
            # Process the base64 encoded fingerprint image
            if isinstance(fingerprint_b64, str):
                # Remove data URL prefix if present
                if fingerprint_b64.startswith("data:image"):
                    fingerprint_b64 = fingerprint_b64.split(",")[1]

                # Decode base64 to binary
                fingerprint_binary = base64.b64decode(fingerprint_b64)

                # Process the fingerprint image and get the hash
                fingerprint_hash = process_fingerprint(fingerprint_binary)

            else:
                save_log(
                    log_type="auth",
                    message="Login failed - Fingerprint data must be a base64 string",
                    source="auth_routes.login",
                    ip_address=request.remote_addr,
                    status="error",
                )
                return jsonify({"error": "Invalid fingerprint format"}), 400

        except Exception as e:
            save_log(
                log_type="auth",
                message=f"Login failed - Error processing fingerprint data: {str(e)}",
                source="auth_routes.login",
                ip_address=request.remote_addr,
                status="error",
            )
            return jsonify({"error": "Invalid fingerprint format"}), 400

        # Find user by fingerprint hash (checking if hash exists in the fingerprint_hashes array)
        user = db.users.find_one({"fingerprint_hashes": {"$in": [fingerprint_hash]}})

        if not user:
            save_log(
                log_type="auth",
                message="Login failed - Fingerprint not recognized",
                source="auth_routes.login",
                ip_address=request.remote_addr,
                status="warning",
            )
            return jsonify({"error": "Fingerprint not recognized"}), 401
    else:
        save_log(
            log_type="auth",
            message="Login failed - Invalid login method",
            source="auth_routes.login",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Invalid login method"}), 400

    # Check if account is active
    if user["account_status"] != "active":
        save_log(
            log_type="auth",
            message=f"Login failed - Account not active for user: {user['username']}",
            user_id=user.get("user_id"),
            source="auth_routes.login",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Account is not active"}), 403

    # Update last login
    db.users.update_one(
        {"_id": user["_id"]}, {"$set": {"last_login": datetime.datetime.utcnow()}}
    )

    # Generate tokens
    access_token = create_access_token(identity=str(user["_id"]))
    refresh_token = create_refresh_token(identity=str(user["_id"]))

    save_log(
        log_type="auth",
        message=f"User logged in successfully: {user['username']}",
        user_id=user.get("user_id"),
        source="auth_routes.login",
        ip_address=request.remote_addr,
        status="info",
    )

    # Get fingerprint information
    fingerprint_hashes = user.get("fingerprint_hashes", [])

    return (
        jsonify(
            {
                "message": "Login successful",
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": {
                    "user_id": f"{user['_id']}",
                    "username": user["username"],
                    "email": user["email"],
                    "role": user["role"],
                    "account_status": user["account_status"],
                    "fingerprint_hashes": fingerprint_hashes,
                },
            }
        ),
        200,
    )


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)

    save_log(
        log_type="auth",
        message="Access token refreshed",
        source="auth_routes.refresh",
        ip_address=request.remote_addr,
        status="info",
    )

    return jsonify({"access_token": access_token}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    user_id = get_jwt_identity()
    db = get_db()

    # Get user details for logging
    user = db.users.find_one({"_id": ObjectId(user_id)})

    # Update last logout
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"last_logout": datetime.datetime.utcnow()}},
    )

    # Log logout
    save_log(
        log_type="auth",
        message=f"User logged out: {user['username']}",
        user_id=user.get("user_id"),
        source="auth_routes.logout",
        ip_address=request.remote_addr,
        status="info",
    )

    # Note: JWT tokens cannot be invalidated without a blacklist
    # In a production environment, you would implement a token blacklist

    return jsonify({"message": "Logout successful"}), 200


@auth_bp.route("/reset-password-request", methods=["POST"])
def reset_password_request():
    data = request.get_json()
    db = get_db()

    if "email" not in data:
        return jsonify({"error": "Email is required"}), 400

    user = db.users.find_one({"email": data["email"]})

    if not user:
        save_log(
            log_type="auth",
            message=f"User highjacking using email: {data['email']}",
            user_id=None,
            source="auth_routes.reset_password_request",
            ip_address=request.remote_addr,
            status="critical",
        )
        # Don't reveal that the user doesn't exist
        return (
            jsonify(
                {
                    "message": "If your email is registered, you will receive a reset link"
                }
            ),
            200,
        )

    # Generate reset token (in a real app, you would send this via email)
    reset_token = str(uuid.uuid4())
    expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1)

    db.password_resets.insert_one(
        {"user_id": user["_id"], "token": reset_token, "expires_at": expiry}
    )

    # In a real app, send email with reset link
    # For demo purposes, we'll just return the token
    return (
        jsonify(
            {
                "message": "Password reset link sent",
                "reset_token": reset_token,  # Remove this in production
            }
        ),
        200,
    )


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    db = get_db()

    if "token" not in data or "new_password" not in data:
        return jsonify({"error": "Token and new password are required"}), 400

    # Validate password strength
    if not validate_password(data["new_password"]):
        return (
            jsonify(
                {
                    "error": "Password must be at least 8 characters and include uppercase, lowercase, number and special character"
                }
            ),
            400,
        )

    # Find valid reset token
    reset_request = db.password_resets.find_one(
        {"token": data["token"], "expires_at": {"$gt": datetime.datetime.utcnow()}}
    )

    if not reset_request:
        return jsonify({"error": "Invalid or expired token"}), 400

    # Update password
    db.users.update_one(
        {"_id": reset_request["user_id"]},
        {"$set": {"password": generate_password_hash(data["new_password"])}},
    )

    # Delete used token
    db.password_resets.delete_one({"_id": reset_request["_id"]})

    return jsonify({"message": "Password reset successful"}), 200


@auth_bp.route("/update-fingerprint", methods=["POST"])
@jwt_required()
def update_fingerprint():
    user_id = get_jwt_identity()
    data = request.get_json()
    db = get_db()

    if "fingerprint" not in data:
        return jsonify({"error": "Fingerprint data is required"}), 400

    fingerprint_b64 = data["fingerprint"]

    try:
        # Process the base64 encoded fingerprint image
        if isinstance(fingerprint_b64, str):
            # Remove data URL prefix if present
            if fingerprint_b64.startswith("data:image"):
                fingerprint_b64 = fingerprint_b64.split(",")[1]

            # Decode base64 to binary
            fingerprint_binary = base64.b64decode(fingerprint_b64)

            # Process the fingerprint image and get the hash
            fingerprint_hash = process_fingerprint(fingerprint_binary)

        else:
            save_log(
                log_type="auth",
                message="Fingerprint update failed - Fingerprint data must be a base64 string",
                user_id=user_id,
                source="auth_routes.update_fingerprint",
                ip_address=request.remote_addr,
                status="error",
            )
            return jsonify({"error": "Invalid fingerprint format"}), 400

    except Exception as e:
        save_log(
            log_type="auth",
            message=f"Fingerprint update failed - Error processing fingerprint data: {str(e)}",
            user_id=user_id,
            source="auth_routes.update_fingerprint",
            ip_address=request.remote_addr,
            status="error",
        )
        return jsonify({"error": "Invalid fingerprint format"}), 400

    # Update user's fingerprint
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$push": {
                "fingerprint_hashes": fingerprint_hash,
            }
        },
    )

    save_log(
        log_type="auth",
        message="Fingerprint updated successfully",
        user_id=user_id,
        source="auth_routes.update_fingerprint",
        ip_address=request.remote_addr,
        status="info",
    )

    return (
        jsonify(
            {
                "message": "Fingerprint updated successfully",
                "fingerprint_hash": fingerprint_hash,
            }
        ),
        200,
    )
