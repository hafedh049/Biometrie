from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from bson import ObjectId
import datetime
import uuid
from database import get_db, serialize_doc
from utils.validators import validate_email, validate_password
from utils.auth_utils import admin_required
from utils.log_utils import save_log

user_bp = Blueprint("users", __name__)


@user_bp.route("/", methods=["GET"])
@jwt_required()
@admin_required
def get_users():
    db = get_db()
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    status = request.args.get("status")

    # Build query
    query = {}
    if status:
        query["account_status"] = status

    # Get total count
    total = db.users.count_documents(query)

    # Get paginated users
    users = list(
        db.users.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )

    # Remove passwords
    for user in users:
        user.pop("password", None)

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})
    save_log(
        log_type="user",
        message=f"Admin {current_user['username']} viewed user list",
        user_id=current_user.get("_id"),
        details={"filters": {"status": status}, "count": total},
        source="user_routes.get_users",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "users": [serialize_doc(user) for user in users],
                "total": total,
                "page": page,
                "per_page": per_page,
                "pages": (total + per_page - 1) // per_page,
            }
        ),
        200,
    )


@user_bp.route("/<user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    db = get_db()
    # Check if requesting own profile or admin
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})

    if str(current_user["_id"]) != user_id and current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized access"}), 403

    # Find user by ID or user_id field
    user = None
    if ObjectId.is_valid(user_id):
        user = db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        user = db.users.find_one({"user_id": user_id})

    if not user:
        save_log(
            log_type="user",
            message=f"Unauthorized user profile access attempt: {user_id}",
            user_id=current_user.get("_id"),
            source="user_routes.get_user",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "User not found"}), 404

    # Remove password
    user.pop("password", None)

    save_log(
        log_type="user",
        message=f"User {current_user['username']} viewed profile: {user['username']}",
        user_id=current_user.get("_id"),
        details={"viewed_user_id": user.get("user_id")},
        source="user_routes.get_user",
        ip_address=request.remote_addr,
    )

    return jsonify({"user": serialize_doc(user)}), 200


@user_bp.route("/", methods=["POST"])
@jwt_required()
@admin_required
def create_user():
    db = get_db()
    data = request.get_json()

    # Validate required fields
    required_fields = ["username", "email", "password", "phone_number"]
    for field in required_fields:
        if field not in data:
            save_log(
                log_type="user",
                message=f"User creation failed - Missing field: {field}",
                source="user_routes.create_user",
                ip_address=request.remote_addr,
                status="warning",
            )
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Validate email format
    if not validate_email(data["email"]):
        save_log(
            log_type="user",
            message=f"User creation failed - Invalid email format: {data['email']}",
            source="user_routes.create_user",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Invalid email format"}), 400

    # Validate password strength
    if not validate_password(data["password"]):
        save_log(
            log_type="user",
            message=f"User creation failed - Weak password for user: {data['username']}",
            source="user_routes.create_user",
            ip_address=request.remote_addr,
            status="warning",
        )
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
            log_type="user",
            message=f"User creation failed - Email already exists: {data['email']}",
            source="user_routes.create_user",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Email already registered"}), 409

    if db.users.find_one({"username": data["username"]}):
        save_log(
            log_type="user",
            message=f"User creation failed - Username already exists: {data['username']}",
            source="user_routes.create_user",
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
        "account_status": data.get("account_status", "active"),
        "role": data.get("role", "client"),
        "created_at": datetime.datetime.utcnow(),
    }

    db.users.insert_one(new_user)

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})
    save_log(
        log_type="user",
        message=f"Admin {current_user['username']} created user: {data['username']}",
        user_id=current_user.get("_id"),
        details={
            "new_user_id": new_user["user_id"],
            "role": data.get("role", "client"),
            "status": data.get("account_status", "active"),
        },
        source="user_routes.create_user",
        ip_address=request.remote_addr,
    )

    # Remove password before returning
    new_user.pop("password", None)

    return (
        jsonify(
            {"message": "User created successfully", "user": serialize_doc(new_user)}
        ),
        201,
    )


@user_bp.route("/<user_id>", methods=["PUT"])
@jwt_required()
def update_user(user_id):
    db = get_db()
    data = request.get_json()
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})

    # Find user to update
    user = None
    if ObjectId.is_valid(user_id):
        user = db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        user = db.users.find_one({"user_id": user_id})

    if not user:
        save_log(
            log_type="user",
            message=f"User update failed - User not found: {user_id}",
            user_id=current_user.get("_id"),
            source="user_routes.update_user",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "User not found"}), 404

    # Check permissions
    if str(current_user["_id"]) != str(user["_id"]) and current_user["role"] != "admin":
        save_log(
            log_type="user",
            message=f"Unauthorized user update attempt: {user['username']}",
            user_id=current_user.get("_id"),
            details={"target_user_id": user.get("user_id")},
            source="user_routes.update_user",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Unauthorized access"}), 403

    # Prepare update data
    update_data = {}

    # Only admin can update these fields
    if current_user["role"] == "admin":
        if "account_status" in data:
            update_data["account_status"] = data["account_status"]

        if "role" in data:
            update_data["role"] = data["role"]

    # Fields any user can update for themselves
    if "phone_number" in data:
        update_data["phone_number"] = data["phone_number"]

    if "email" in data and data["email"] != user["email"]:
        if not validate_email(data["email"]):
            save_log(
                log_type="user",
                message=f"User update failed - Invalid email format: {data['email']}",
                user_id=current_user.get("_id"),
                source="user_routes.update_user",
                ip_address=request.remote_addr,
                status="warning",
            )
            return jsonify({"error": "Invalid email format"}), 400

        # Check if email is already taken
        if db.users.find_one({"email": data["email"], "_id": {"$ne": user["_id"]}}):
            save_log(
                log_type="user",
                message=f"User update failed - Email already exists: {data['email']}",
                user_id=current_user.get("_id"),
                source="user_routes.update_user",
                ip_address=request.remote_addr,
                status="warning",
            )
            return jsonify({"error": "Email already registered"}), 409

        update_data["email"] = data["email"]

    if "username" in data and data["username"] != user["username"]:
        # Check if username is already taken
        if db.users.find_one(
            {"username": data["username"], "_id": {"$ne": user["_id"]}}
        ):
            save_log(
                log_type="user",
                message=f"User update failed - Username already exists: {data['username']}",
                user_id=current_user.get("_id"),
                source="user_routes.update_user",
                ip_address=request.remote_addr,
                status="warning",
            )
            return jsonify({"error": "Username already taken"}), 409

        update_data["username"] = data["username"]

    if "password" in data:
        if not validate_password(data["password"]):
            save_log(
                log_type="user",
                message=f"User update failed - Weak password for user: {user['username']}",
                user_id=current_user.get("_id"),
                source="user_routes.update_user",
                ip_address=request.remote_addr,
                status="warning",
            )
            return (
                jsonify(
                    {
                        "error": "Password must be at least 8 characters and include uppercase, lowercase, number and special character"
                    }
                ),
                400,
            )

        update_data["password"] = generate_password_hash(data["password"])

    # Update user if there are changes
    if update_data:
        db.users.update_one({"_id": user["_id"]}, {"$set": update_data})

    # Get updated user
    updated_user = db.users.find_one({"_id": user["_id"]})
    updated_user.pop("password", None)

    # Log the action
    log_details = {
        "target_user_id": user.get("user_id"),
        "changes": {k: v for k, v in update_data.items() if k != "password"},
    }

    if "password" in update_data:
        log_details["changes"]["password"] = "changed"

    save_log(
        log_type="user",
        message=f"User {current_user['username']} updated user: {user['username']}",
        user_id=current_user.get("_id"),
        details=log_details,
        source="user_routes.update_user",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "message": "User updated successfully",
                "user": serialize_doc(updated_user),
            }
        ),
        200,
    )


@user_bp.route("/<user_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_user(user_id):
    db = get_db()
    # Find user to delete
    user = None
    if ObjectId.is_valid(user_id):
        user = db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        user = db.users.find_one({"user_id": user_id})

    if not user:
        save_log(
            log_type="user",
            message=f"User deletion failed - User not found: {user_id}",
            source="user_routes.delete_user",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "User not found"}), 404

    file_count = db.files.count_documents({"user_id": user.get("_id")})

    # Delete user's files
    db.files.delete_many({"user_id": user.get("_id")})

    # Delete user
    db.users.delete_one({"_id": user["_id"]})

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})
    save_log(
        log_type="user",
        message=f"Admin {current_user['username']} deleted user: {user['username']}",
        user_id=current_user.get("_id"),
        details={"deleted_user_id": user.get("user_id"), "deleted_files": file_count},
        source="user_routes.delete_user",
        ip_address=request.remote_addr,
    )

    return jsonify({"message": "User and associated data deleted successfully"}), 200


@user_bp.route("/dashboard/stats", methods=["GET"])
@jwt_required()
@admin_required
def get_dashboard_stats():
    db = get_db()
    # Get counts
    user_count = db.users.count_documents({})
    device_count = db.devices.count_documents({})
    partition_count = db.partitions.count_documents({})
    file_count = db.files.count_documents({})

    # Get recent activity
    recent_users = list(db.users.find().sort("created_at", -1).limit(5))
    recent_files = list(db.files.find().sort("upload_date", -1).limit(5))
    recent_devices = list(db.devices.find().sort("added_date", -1).limit(5))

    # Remove sensitive data
    for user in recent_users:
        user.pop("password", None)
        user.pop("fingerprint_hashes", None)

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})
    save_log(
        log_type="user",
        message=f"Admin {current_user['username']} viewed dashboard statistics",
        user_id=current_user.get("_id"),
        details={
            "user_count": user_count,
            "device_count": device_count,
            "partition_count": partition_count,
            "file_count": file_count,
        },
        source="user_routes.get_dashboard_stats",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "stats": {
                    "users": user_count,
                    "devices": device_count,
                    "partitions": partition_count,
                    "files": file_count,
                },
                "recent_activity": {
                    "users": [serialize_doc(user) for user in recent_users],
                    "files": [serialize_doc(file) for file in recent_files],
                    "devices": [serialize_doc(device) for device in recent_devices],
                },
            }
        ),
        200,
    )
