import base64
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
import datetime
import uuid
import os
from werkzeug.utils import secure_filename
from database import serialize_doc, get_db
from utils.file_utils import (
    simple_decrypt_bytes,
    simple_encrypt_bytes,
)
from utils.log_utils import save_log

file_bp = Blueprint("files", __name__)


@file_bp.route("/", methods=["GET"])
@jwt_required()
def get_files():
    db = get_db()
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    file_type = request.args.get("file_type")
    partition_id = request.args.get("partition_id")
    include_data = request.args.get("include_data", "false").lower() == "true"

    # Get current user
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})

    # Build query
    query = {}

    # Regular users can only see their own files
    if current_user["role"] != "admin":
        query["user_id"] = str(current_user.get("_id"))

    if file_type:
        query["file_type"] = file_type
    if partition_id:
        query["partition_id"] = partition_id

    # Get total count
    total = db.files.count_documents(query)

    # Get paginated files
    files = list(
        db.files.find(query)
        .sort("upload_date", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )

    # Process files
    for file in files:
        file["_id"] = str(file["_id"])
        file["user_id"] = str(file["user_id"])
        file.pop("file_data", None)  # Remove any existing file_data field

        # Add file data if requested
        if include_data:
            try:
                # Construct the file path
                file_path = os.path.join(os.getcwd(), "uploads", file.get("file_path"))

                # Check if file exists
                if os.path.exists(file_path):
                    # Read the file
                    with open(file_path, "rb") as f:
                        file_data = f.read()

                    # Decrypt if necessary
                    if file.get("encrypted", False):
                        # Get fingerprint from user profile
                        fingerprint_hashes = current_user.get("fingerprint_hashes", [])
                        if fingerprint_hashes:
                            fingerprint = fingerprint_hashes[0]
                            file_data = simple_decrypt_bytes(file_data, fingerprint)

                    # Add base64 encoded data
                    file["file_data"] = base64.b64encode(file_data).decode("utf-8")
                    file["mime_type"] = get_mime_type(file.get("file_name"))
                else:
                    file["file_data"] = None
                    file["error"] = "File not found on disk"
            except Exception as e:
                file["file_data"] = None
                file["error"] = str(e)

    # Log the action
    save_log(
        log_type="file",
        message=f"User {current_user['username']} viewed file list",
        user_id=current_user.get("_id"),
        details={
            "filters": {"file_type": file_type, "partition_id": partition_id},
            "count": total,
            "is_admin": current_user["role"] == "admin",
            "include_data": include_data,
        },
        source="file_routes.get_files",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "files": [serialize_doc(file) for file in files],
                "total": total,
                "page": page,
                "per_page": per_page,
                "pages": (total + per_page - 1) // per_page,
            }
        ),
        200,
    )


@file_bp.route("/<file_id>", methods=["GET"])
@jwt_required()
def get_file(file_id):
    db = get_db()
    # Find file by ID or file_id field
    file = None
    if ObjectId.is_valid(file_id):
        file = db.files.find_one({"_id": ObjectId(file_id)})

    if not file:
        file = db.files.find_one({"file_id": file_id})

    if not file:
        save_log(
            log_type="file",
            message=f"File not found: {file_id}",
            source="file_routes.get_file",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "File not found"}), 404

    # Get current user
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})

    # Check permissions
    if file.get("user_id") != str(current_user.get("_id")):
        save_log(
            log_type="file",
            message=f"Unauthorized file access attempt: {file.get('file_name')}",
            user_id=current_user.get("_id"),
            details={"file_id": file.get("file_id"), "file_owner": file.get("user_id")},
            source="file_routes.get_file",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Unauthorized access"}), 403

    # Get partition and device info
    partition = db.partitions.find_one({"partition_id": file.get("partition_id")})
    device = None
    if partition:
        device = db.devices.find_one({"device_id": partition.get("device_id")})

    # Get file data
    try:
        # Construct the file path
        file_path = os.path.join(os.getcwd(), "uploads", file.get("file_path"))

        # Check if file exists
        if os.path.exists(file_path):
            # Read the file
            with open(file_path, "rb") as f:
                file_data = f.read()

            # Decrypt if necessary
            if file.get("encrypted", False):
                # Get fingerprint from user profile
                fingerprint_hashes = current_user.get("fingerprint_hashes", [])
                if not fingerprint_hashes:
                    save_log(
                        log_type="file",
                        message=f"File view failed - No fingerprints registered for user",
                        user_id=current_user.get("_id"),
                        source="file_routes.get_file",
                        ip_address=request.remote_addr,
                        status="warning",
                    )
                    return jsonify({"error": "No fingerprints registered"}), 400

                fingerprint = fingerprint_hashes[0]
                file_data = simple_decrypt_bytes(file_data, fingerprint)

            # Add base64 encoded data to file object
            file_copy = dict(file)  # Create a copy to avoid modifying the original
            file_copy["file_data"] = base64.b64encode(file_data).decode("utf-8")
            file_copy["mime_type"] = get_mime_type(file.get("file_name"))
        else:
            save_log(
                log_type="file",
                message=f"File not found on disk: {file_path}",
                user_id=current_user.get("_id"),
                source="file_routes.get_file",
                ip_address=request.remote_addr,
                status="error",
            )
            return jsonify({"error": "File not found on disk"}), 404
    except Exception as e:
        save_log(
            log_type="file",
            message=f"Error retrieving file data: {str(e)}",
            user_id=current_user.get("_id"),
            details={"error": str(e)},
            source="file_routes.get_file",
            ip_address=request.remote_addr,
            status="error",
        )
        return jsonify({"error": f"Error retrieving file data: {str(e)}"}), 500

    # Log the action
    save_log(
        log_type="file",
        message=f"User {current_user['username']} viewed file: {file.get('file_name')}",
        user_id=current_user.get("_id"),
        details={
            "file_id": file.get("file_id"),
            "file_type": file.get("file_type"),
            "file_size": file.get("file_size"),
            "encrypted": file.get("encrypted", False),
            "partition_id": file.get("partition_id"),
        },
        source="file_routes.get_file",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "file": serialize_doc(file_copy),
                "partition": serialize_doc(partition),
                "device": serialize_doc(device),
            }
        ),
        200,
    )


@file_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_file():
    db = get_db()
    # Check if file is in request
    if "file" not in request.files:
        save_log(
            log_type="file",
            message="File upload failed - No file part",
            source="file_routes.upload_file",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]

    # Check if file is selected
    if file.filename == "":
        save_log(
            log_type="file",
            message="File upload failed - No file selected",
            source="file_routes.upload_file",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "No file selected"}), 400

    # Get form data
    partition_id = request.form.get("partition_id")
    encrypt = request.form.get("encrypt", "true").lower() == "true"

    # Validate partition
    partition = db.partitions.find_one({"partition_id": partition_id})
    if not partition:
        save_log(
            log_type="file",
            message=f"File upload failed - Partition not found: {partition_id}",
            source="file_routes.upload_file",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Partition not found"}), 404

    # Check if partition is active
    if partition.get("status") != "active":
        save_log(
            log_type="file",
            message=f"File upload failed - Partition not active: {partition_id}",
            source="file_routes.upload_file",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Partition is not active"}), 400

    # Get current user
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})

    # Secure filename
    filename = secure_filename(file.filename)

    file_id = str(uuid.uuid4())

    # Read file data directly into memory
    file_data = file.read()
    file_size = len(file_data)

    # Get file type
    file_type = filename.split(".")[-1].upper() if "." in filename else "UNKNOWN"

    # Encrypt file if requested
    if encrypt:
        # Get the first fingerprint hash from the user's profile
        fingerprint_hashes = current_user.get("fingerprint_hashes", [])

        if not fingerprint_hashes:
            save_log(
                log_type="file",
                message="File upload failed - No fingerprints registered for user",
                user_id=current_user.get("_id"),
                source="file_routes.upload_file",
                ip_address=request.remote_addr,
                status="warning",
            )
            return (
                jsonify(
                    {
                        "error": "No fingerprints registered. Please register a fingerprint first."
                    }
                ),
                400,
            )

        # Use the first fingerprint hash for encryption
        fingerprint = fingerprint_hashes[0]

        # Encrypt the file data directly in memory
        file_data = simple_encrypt_bytes(file_data, fingerprint)

    # Create uploads directory if it doesn't exist
    os.makedirs(os.path.join(os.getcwd(), "uploads"), exist_ok=True)

    # Save the file to disk
    file_extension = filename.split(".")[-1]
    file_path = os.path.join(os.getcwd(), "uploads", f"{file_id}.{file_extension}")

    with open(file_path, "wb") as f:
        f.write(file_data)

    # Create file record
    new_file = {
        "file_id": file_id,
        "file_name": filename,
        "file_size": file_size,  # Original file size before encryption
        "file_type": file_type,
        "partition_id": partition_id,
        "user_id": str(current_user.get("_id")),
        "encrypted": encrypt,
        "upload_date": datetime.datetime.utcnow(),
        "last_modified_date": datetime.datetime.utcnow(),
        "file_path": f"{file_id}.{file_extension}",
    }

    # Insert file record
    db.files.insert_one(new_file)

    # Update partition file count
    db.partitions.update_one({"partition_id": partition_id}, {"$inc": {"files": 1}})

    save_log(
        log_type="file",
        message=f"User {current_user['username']} uploaded file: {filename}",
        user_id=current_user.get("_id"),
        details={
            "file_id": new_file["file_id"],
            "file_type": file_type,
            "file_size": file_size,
            "encrypted": encrypt,
            "partition_id": partition_id,
            "fingerprint_used": encrypt,
        },
        source="file_routes.upload_file",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {"message": "File uploaded successfully", "file": serialize_doc(new_file)}
        ),
        201,
    )


@file_bp.route("/<file_id>/download", methods=["GET"])
@jwt_required()
def download_file(file_id):
    db = get_db()
    # Find file
    file = None
    if ObjectId.is_valid(file_id):
        file = db.files.find_one({"_id": ObjectId(file_id)})

    if not file:
        file = db.files.find_one({"file_id": file_id})

    if not file:
        save_log(
            log_type="file",
            message=f"File download failed - File not found: {file_id}",
            source="file_routes.download_file",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "File not found"}), 404

    # Get current user
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})

    # Check permissions
    if file.get("user_id") != str(current_user.get("_id")):
        save_log(
            log_type="file",
            message=f"Unauthorized file download attempt: {file.get('file_name')}",
            user_id=current_user.get("user_id"),
            details={"file_id": file.get("file_id"), "file_owner": file.get("user_id")},
            source="file_routes.download_file",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Unauthorized access"}), 403

    # Construct the file path in the uploads directory
    file_path = os.path.join(os.getcwd(), "uploads", file.get("file_path"))

    # Check if file exists
    if not os.path.exists(file_path):
        save_log(
            log_type="file",
            message=f"File download failed - File not found on disk: {file_path}",
            user_id=current_user.get("user_id"),
            source="file_routes.download_file",
            ip_address=request.remote_addr,
            status="error",
        )
        return jsonify({"error": "File not found on server"}), 404

    # Read the file into memory
    with open(file_path, "rb") as f:
        file_data = f.read()

    # Check if file is encrypted
    if file.get("encrypted", True):
        try:
            # Get fingerprint from user profile
            fingerprint_hashes = current_user.get("fingerprint_hashes", [])

            if not fingerprint_hashes:
                save_log(
                    log_type="file",
                    message=f"File download failed - No fingerprints registered for user",
                    user_id=current_user.get("user_id"),
                    source="file_routes.download_file",
                    ip_address=request.remote_addr,
                    status="warning",
                )
                return jsonify({"error": "No fingerprints registered"}), 400

            # Use the first fingerprint hash for decryption
            fingerprint = fingerprint_hashes[0]

            # Decrypt the file data directly in memory
            file_data = simple_decrypt_bytes(file_data, fingerprint)

            # Log the action
            save_log(
                log_type="file",
                message=f"User {current_user['username']} downloaded encrypted file: {file.get('file_name')}",
                user_id=current_user.get("user_id"),
                details={
                    "file_id": file.get("file_id"),
                    "file_type": file.get("file_type"),
                    "file_size": len(file_data),
                    "partition_id": file.get("partition_id"),
                },
                source="file_routes.download_file",
                ip_address=request.remote_addr,
            )
        except Exception as e:
            save_log(
                log_type="file",
                message=f"File decryption failed: {str(e)}",
                user_id=current_user.get("user_id"),
                details={"error": str(e)},
                source="file_routes.download_file",
                ip_address=request.remote_addr,
                status="error",
            )
            return jsonify({"error": f"Decryption failed: {str(e)}"}), 500
    else:
        # Log the action for non-encrypted files
        save_log(
            log_type="file",
            message=f"User {current_user['username']} downloaded file: {file.get('file_name')}",
            user_id=current_user.get("user_id"),
            details={
                "file_id": file.get("file_id"),
                "file_type": file.get("file_type"),
                "file_size": len(file_data),
                "partition_id": file.get("partition_id"),
            },
            source="file_routes.download_file",
            ip_address=request.remote_addr,
        )

    # Convert binary data to base64 for JSON response
    file_data_base64 = base64.b64encode(file_data).decode("utf-8")

    # Return file data as JSON
    return (
        jsonify(
            {
                "file_name": file.get("file_name"),
                "file_type": file.get("file_type"),
                "file_size": len(file_data),
                "file_data": file_data_base64,
                "mime_type": get_mime_type(file.get("file_name")),
            }
        ),
        200,
    )


def get_mime_type(filename):
    """Helper function to determine MIME type based on file extension"""
    extension = filename.split(".")[-1].lower() if "." in filename else ""
    mime_types = {
        "pdf": "application/pdf",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "txt": "text/plain",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls": "application/vnd.ms-excel",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "ppt": "application/vnd.ms-powerpoint",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "mp3": "audio/mpeg",
        "mp4": "video/mp4",
        "zip": "application/zip",
        # Add more MIME types as needed
    }
    return mime_types.get(extension, "application/octet-stream")


@file_bp.route("/<file_id>", methods=["DELETE"])
@jwt_required()
def delete_file(file_id):
    db = get_db()
    # Find file
    file = None
    if ObjectId.is_valid(file_id):
        file = db.files.find_one({"_id": ObjectId(file_id)})

    if not file:
        file = db.files.find_one({"file_id": file_id})

    if not file:
        save_log(
            log_type="file",
            message=f"File deletion failed - File not found: {file_id}",
            source="file_routes.delete_file",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "File not found"}), 404

    # Get current user
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})

    # Check permissions
    if file.get("user_id") != str(current_user.get("_id")):
        save_log(
            log_type="file",
            message=f"Unauthorized file deletion attempt: {file.get('file_name')}",
            user_id=current_user.get("user_id"),
            details={"file_id": file.get("file_id"), "file_owner": file.get("user_id")},
            source="file_routes.delete_file",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Unauthorized access"}), 403

    # Construct the file path in the uploads directory
    file_name = file.get("file_name")
    file_path = os.path.join("uploads", f"{file.get("file_path")}.enc")

    # Delete the physical file if it exists
    physical_file_deleted = False
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            physical_file_deleted = True
        except Exception as e:
            save_log(
                log_type="file",
                message=f"Error deleting physical file: {file_path}",
                user_id=current_user.get("user_id"),
                details={"error": str(e)},
                source="file_routes.delete_file",
                ip_address=request.remote_addr,
                status="error",
            )
            # Continue with database deletion even if physical file deletion fails

    # Delete file from database
    db.files.delete_one({"_id": file["_id"]})

    # Update partition file count
    db.partitions.update_one(
        {"partition_id": file.get("partition_id")}, {"$inc": {"files": -1}}
    )

    # Log the action
    save_log(
        log_type="file",
        message=f"User {current_user['username']} deleted file: {file.get('file_name')}",
        user_id=current_user.get("user_id"),
        details={
            "file_id": file.get("file_id"),
            "file_type": file.get("file_type"),
            "partition_id": file.get("partition_id"),
            "physical_file_deleted": physical_file_deleted,
            "file_path": file_path,
        },
        source="file_routes.delete_file",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "message": "File deleted successfully",
                "physical_file_deleted": physical_file_deleted,
            }
        ),
        200,
    )


@file_bp.route("/<file_id>", methods=["PUT"])
@jwt_required()
def update_file(file_id):
    db = get_db()
    data = request.get_json()

    # Find file
    file = None
    if ObjectId.is_valid(file_id):
        file = db.files.find_one({"_id": ObjectId(file_id)})

    if not file:
        file = db.files.find_one({"file_id": file_id})

    if not file:
        save_log(
            log_type="file",
            message=f"File update failed - File not found: {file_id}",
            source="file_routes.update_file",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "File not found"}), 404

    # Get current user
    current_user_id = get_jwt_identity()
    current_user = db.users.find_one({"_id": ObjectId(current_user_id)})

    # Check permissions
    if file.get("user_id") != str(current_user.get("_id")):
        save_log(
            log_type="file",
            message=f"Unauthorized file update attempt: {file.get('file_name')}",
            user_id=current_user.get("_id"),
            details={"file_id": file.get("file_id"), "file_owner": file.get("user_id")},
            source="file_routes.update_file",
            ip_address=request.remote_addr,
            status="warning",
        )
        return jsonify({"error": "Unauthorized access"}), 403

    # Prepare update data
    update_data = {}

    if "file_name" in data:
        update_data["file_name"] = data["file_name"]
        update_data["file_path"] = f"{file.get('partition_id')}/{data['file_name']}"

    # Update file if there are changes
    if update_data:
        update_data["last_modified_date"] = datetime.datetime.utcnow()

        db.files.update_one({"_id": file["_id"]}, {"$set": update_data})

    # Get updated file
    updated_file = db.files.find_one({"_id": file["_id"]})

    # Remove file data from response
    updated_file.pop("file_data", None)

    save_log(
        log_type="file",
        message=f"User {current_user['username']} updated file: {file.get('file_name')}",
        user_id=current_user.get("user_id"),
        details={"file_id": file.get("file_id"), "changes": update_data},
        source="file_routes.update_file",
        ip_address=request.remote_addr,
    )

    return (
        jsonify(
            {
                "message": "File updated successfully",
                "file": serialize_doc(updated_file),
            }
        ),
        200,
    )
