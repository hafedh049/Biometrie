from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
import datetime
import uuid
from database import serialize_doc, get_db
from utils.auth_utils import admin_required
from utils.log_utils import save_log

partition_bp = Blueprint("partitions", __name__)


@partition_bp.route("/", methods=["GET"])
@jwt_required()
def get_partitions():
    db = get_db()
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    status = request.args.get("status")
    format_type = request.args.get("format")
    device_id = request.args.get("device_id")

    # Build query
    query = {}
    if status:
        query["status"] = status
    if format_type:
        query["format"] = format_type
    if device_id:
        query["device_id"] = device_id

    # Get total count
    total = db.partitions.count_documents(query)

    # Get paginated partitions
    partitions = list(
        db.partitions.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})
    save_log(
        log_type="partition",
        message=f"User {current_user['username']} viewed partition list",
        user_id=current_user.get("_id"),
        details={
            "filters": {
                "status": status,
                "format": format_type,
                "device_id": device_id,
            },
            "count": total,
        },
        source="partition_routes.get_partitions",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "partitions": [serialize_doc(partition) for partition in partitions],
                "total": total,
                "page": page,
                "per_page": per_page,
                "pages": (total + per_page - 1) // per_page,
            }
        ),
        200,
    )


@partition_bp.route("/<partition_id>", methods=["GET"])
@jwt_required()
def get_partition(partition_id):
    db = get_db()
    # Find partition by ID or partition_id field
    partition = None
    if ObjectId.is_valid(partition_id):
        partition = db.partitions.find_one({"_id": ObjectId(partition_id)})

    if not partition:
        partition = db.partitions.find_one({"partition_id": partition_id})

    if not partition:
        save_log(
            log_type="partition",
            message=f"Partition not found: {partition_id}",
            source="partition_routes.get_partition",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Partition not found"}), 404

    # Get device info
    device = db.devices.find_one({"device_id": partition.get("device_id")})

    # Get files in this partition
    files = list(db.files.find({"partition_id": partition.get("partition_id")}))

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})
    save_log(
        log_type="partition",
        message=f"User {current_user['username']} viewed partition: {partition.get('partition_name')}",
        user_id=current_user.get("_id"),
        details={
            "partition_id": partition.get("partition_id"),
            "device_id": partition.get("device_id"),
            "file_count": len(files),
        },
        source="partition_routes.get_partition",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "partition": serialize_doc(partition),
                "device": serialize_doc(device),
                "files": [serialize_doc(file) for file in files],
            }
        ),
        200,
    )


@partition_bp.route("/", methods=["POST"])
@jwt_required()
@admin_required
def create_partition():
    db = get_db()
    data = request.get_json()

    # Validate required fields
    required_fields = ["partition_name", "device_id", "format", "size"]
    for field in required_fields:
        if field not in data:
            save_log(
                log_type="partition",
                message=f"Partition creation failed - Missing field: {field}",
                source="partition_routes.create_partition",
                ip_address=request.remote_addr,
                status="warning",
            )
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Check if device exists
    device = db.devices.find_one({"_id": ObjectId(data["device_id"])})
    if not device:
        save_log(
            log_type="partition",
            message=f"Partition creation failed - Device not found: {data['device_id']}",
            source="partition_routes.create_partition",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Device not found"}), 404

    # Create new partition
    new_partition = {
        "partition_id": str(uuid.uuid4()),
        "partition_name": data["partition_name"],
        "device_id": data["device_id"],
        "format": data["format"],
        "size": data["size"],
        "files": 0,
        "status": data.get("status", "active"),
        "created_at": datetime.datetime.utcnow(),
    }

    db.partitions.insert_one(new_partition)

    # Update device's partitions list
    db.devices.update_one(
        {"device_id": data["device_id"]},
        {"$push": {"partitions": new_partition["partition_id"]}},
    )

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})
    save_log(
        log_type="partition",
        message=f"User {current_user['username']} created partition: {data['partition_name']}",
        user_id=current_user.get("_id"),
        details={
            "partition_id": new_partition["partition_id"],
            "device_id": data["device_id"],
            "format": data["format"],
            "size": data["size"],
        },
        source="partition_routes.create_partition",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "message": "Partition created successfully",
                "partition": serialize_doc(new_partition),
            }
        ),
        201,
    )


@partition_bp.route("/<partition_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_partition(partition_id):
    db = get_db()
    data = request.get_json()

    # Find partition to update
    partition = None
    if ObjectId.is_valid(partition_id):
        partition = db.partitions.find_one({"_id": ObjectId(partition_id)})

    if not partition:
        partition = db.partitions.find_one({"partition_id": partition_id})

    if not partition:
        save_log(
            log_type="partition",
            message=f"Partition update failed - Partition not found: {partition_id}",
            source="partition_routes.update_partition",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Partition not found"}), 404

    # Prepare update data
    update_data = {}

    if "partition_name" in data:
        update_data["partition_name"] = data["partition_name"]

    if "format" in data:
        update_data["format"] = data["format"]

    if "size" in data:
        update_data["size"] = data["size"]

    if "status" in data:
        update_data["status"] = data["status"]

    # Update partition if there are changes
    if update_data:
        db.partitions.update_one({"_id": partition["_id"]}, {"$set": update_data})

    # Get updated partition
    updated_partition = db.partitions.find_one({"_id": partition["_id"]})

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})
    save_log(
        log_type="partition",
        message=f"User {current_user['username']} updated partition: {partition.get('partition_name')}",
        user_id=current_user.get("_id"),
        details={
            "partition_id": partition.get("partition_id"),
            "device_id": partition.get("device_id"),
            "changes": update_data,
        },
        source="partition_routes.update_partition",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "message": "Partition updated successfully",
                "partition": serialize_doc(updated_partition),
            }
        ),
        200,
    )


@partition_bp.route("/<partition_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_partition(partition_id):
    db = get_db()
    # Find partition to delete
    partition = None
    if ObjectId.is_valid(partition_id):
        partition = db.partitions.find_one({"_id": ObjectId(partition_id)})

    if not partition:
        partition = db.partitions.find_one({"partition_id": partition_id})

    if not partition:
        save_log(
            log_type="partition",
            message=f"Partition deletion failed - Partition not found: {partition_id}",
            source="partition_routes.delete_partition",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Partition not found"}), 404

    # Check if partition has files
    file_count = db.files.count_documents(
        {"partition_id": partition.get("partition_id")}
    )

    if file_count > 0:
        save_log(
            log_type="partition",
            message=f"Partition deletion failed - Partition has files: {partition.get('partition_name')}",
            details={
                "partition_id": partition.get("partition_id"),
                "device_id": partition.get("device_id"),
                "file_count": file_count,
            },
            source="partition_routes.delete_partition",
            ip_address=request.remote_addr,
            status="warning",
        )
        return (
            jsonify(
                {
                    "error": "Cannot delete partition with files",
                    "file_count": file_count,
                }
            ),
            400,
        )

    # Remove partition from device
    db.devices.update_one(
        {"device_id": partition.get("device_id")},
        {"$pull": {"partitions": partition.get("partition_id")}},
    )

    # Delete partition
    db.partitions.delete_one({"_id": partition["_id"]})

    # Log the action
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})
    save_log(
        log_type="partition",
        message=f"User {current_user['username']} deleted partition: {partition.get('partition_name')}",
        user_id=current_user.get("_id"),
        details={
            "partition_id": partition.get("partition_id"),
            "device_id": partition.get("device_id"),
        },
        source="partition_routes.delete_partition",
        ip_address=request.remote_addr,
    )

    return jsonify({"message": "Partition deleted successfully"}), 200
