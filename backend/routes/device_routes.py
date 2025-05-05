from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
import datetime
import uuid
from database import get_db, serialize_doc
from utils.auth_utils import admin_required
from utils.log_utils import save_log

device_bp = Blueprint("devices", __name__)


@device_bp.route("/", methods=["GET"])
@jwt_required()
def get_devices():
    db = get_db()
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    status = request.args.get("status")
    device_type = request.args.get("device_type")

    # Build query
    query = {}
    if status:
        query["status"] = status
    if device_type:
        query["device_type"] = device_type

    # Get total count
    total = db.devices.count_documents(query)

    # Get paginated devices
    devices = list(
        db.devices.find(query)
        .sort("added_date", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})
    save_log(
        log_type="device",
        message=f"User {current_user['username']} viewed device list",
        user_id=current_user.get("_id"),
        details={
            "filters": {"status": status, "device_type": device_type},
            "count": total,
        },
        source="device_routes.get_devices",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "devices": [serialize_doc(device) for device in devices],
                "total": total,
                "page": page,
                "per_page": per_page,
                "pages": (total + per_page - 1) // per_page,
            }
        ),
        200,
    )


@device_bp.route("/<device_id>", methods=["GET"])
@jwt_required()
def get_device(device_id):
    db = get_db()
    # Find device by ID or device_id field
    device = None
    if ObjectId.is_valid(device_id):
        device = db.devices.find_one({"_id": ObjectId(device_id)})

    if not device:
        device = db.devices.find_one({"device_id": device_id})

    if not device:
        save_log(
            log_type="device",
            message=f"Device not found: {device_id}",
            source="device_routes.get_device",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Device not found"}), 404

    # Get partitions for this device
    partitions = list(db.partitions.find({"device_id": device.get("device_id")}))

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})
    save_log(
        log_type="device",
        message=f"User {current_user['username']} viewed device: {device.get('device_name')}",
        user_id=current_user.get("_id"),
        details={
            "device_id": device.get("device_id"),
            "partition_count": len(partitions),
        },
        source="device_routes.get_device",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "device": serialize_doc(device),
                "partitions": [serialize_doc(partition) for partition in partitions],
            }
        ),
        200,
    )


@device_bp.route("/", methods=["POST"])
@jwt_required()
@admin_required
def create_device():
    db = get_db()
    data = request.get_json()

    # Validate required fields
    required_fields = ["device_name", "device_type", "capacity"]
    for field in required_fields:
        if field not in data:
            save_log(
                log_type="device",
                message=f"Device creation failed - Missing field: {field}",
                source="device_routes.create_device",
                ip_address=request.remote_addr,
                status="warning",
            )
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Create new device
    new_device = {
        "device_id": str(uuid.uuid4()),
        "device_name": data["device_name"],
        "device_description": data.get("device_description", ""),
        "device_type": data["device_type"],
        "capacity": data["capacity"],
        "partitions": [],
        "status": data.get("status", "active"),
        "added_date": datetime.datetime.utcnow(),
    }

    db.devices.insert_one(new_device)

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})
    save_log(
        log_type="device",
        message=f"User {current_user['username']} created device: {data['device_name']}",
        user_id=current_user.get("_id"),
        details={
            "device_id": new_device["device_id"],
            "device_type": data["device_type"],
            "capacity": data["capacity"],
        },
        source="device_routes.create_device",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "message": "Device created successfully",
                "device": serialize_doc(new_device),
            }
        ),
        201,
    )


@device_bp.route("/<device_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_device(device_id):
    db = get_db()
    data = request.get_json()

    # Find device to update
    device = None
    if ObjectId.is_valid(device_id):
        device = db.devices.find_one({"_id": ObjectId(device_id)})

    if not device:
        device = db.devices.find_one({"device_id": device_id})

    if not device:
        save_log(
            log_type="device",
            message=f"Device update failed - Device not found: {device_id}",
            source="device_routes.update_device",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Device not found"}), 404

    # Prepare update data
    update_data = {}

    if "device_name" in data:
        update_data["device_name"] = data["device_name"]

    if "device_description" in data:
        update_data["device_description"] = data["device_description"]

    if "device_type" in data:
        update_data["device_type"] = data["device_type"]

    if "capacity" in data:
        update_data["capacity"] = data["capacity"]

    if "status" in data:
        update_data["status"] = data["status"]

    # Update device if there are changes
    if update_data:
        db.devices.update_one({"_id": device["_id"]}, {"$set": update_data})

    # Get updated device
    updated_device = db.devices.find_one({"_id": device["_id"]})

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})

    save_log(
        log_type="device",
        message=f"User {current_user['username']} updated device: {device.get('device_name')}",
        user_id=current_user.get("_id"),
        details={"device_id": device.get("device_id"), "changes": update_data},
        source="device_routes.update_device",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "message": "Device updated successfully",
                "device": serialize_doc(updated_device),
            }
        ),
        200,
    )


@device_bp.route("/<device_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_device(device_id):
    db = get_db()
    # Find device to delete
    device = None
    if ObjectId.is_valid(device_id):
        device = db.devices.find_one({"_id": ObjectId(device_id)})

    if not device:
        device = db.devices.find_one({"device_id": device_id})

    if not device:
        save_log(
            log_type="device",
            message=f"Device deletion failed - Device not found: {device_id}",
            source="device_routes.delete_device",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Device not found"}), 404

    # Check if device has partitions
    partitions = list(db.partitions.find({"device_id": device.get("device_id")}))

    if partitions:
        # Get file count in partitions
        partition_ids = [p.get("partition_id") for p in partitions]
        file_count = db.files.count_documents({"partition_id": {"$in": partition_ids}})

        if file_count > 0:
            save_log(
                log_type="device",
                message=f"Device deletion failed - Device has files: {device.get('device_name')}",
                details={
                    "device_id": device.get("device_id"),
                    "partition_count": len(partitions),
                    "file_count": file_count,
                },
                source="device_routes.delete_device",
                ip_address=request.remote_addr,
                status="warning",
            )
            return (
                jsonify(
                    {
                        "error": "Cannot delete device with files",
                        "file_count": file_count,
                    }
                ),
                400,
            )

        # Delete partitions
        db.partitions.delete_many({"device_id": device.get("device_id")})

    # Delete device
    db.devices.delete_one({"_id": device["_id"]})

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})

    save_log(
        log_type="device",
        message=f"User {current_user['username']} deleted device: {device.get('device_name')}",
        user_id=current_user.get("_id"),
        details={
            "device_id": device.get("device_id"),
            "partition_count": len(partitions) if partitions else 0,
        },
        source="device_routes.delete_device",
        ip_address=request.remote_addr,
    )

    return (
        jsonify({"message": "Device and associated partitions deleted successfully"}),
        200,
    )
