from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import datetime
from database import get_db, serialize_doc
from utils.auth_utils import admin_required
from utils.log_utils import get_logs, clear_old_logs

log_bp = Blueprint("logs", __name__)


@log_bp.route("/", methods=["GET"])
@jwt_required()
@admin_required
def get_log_entries():
    # Parse query parameters
    log_type = request.args.get("log_type")
    user_id = request.args.get("user_id")
    status = request.args.get("status")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))

    # Parse date parameters
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")

    start_date = None
    end_date = None

    if start_date_str:
        try:
            start_date = datetime.datetime.fromisoformat(
                start_date_str.replace("Z", "+00:00")
            )
        except ValueError:
            return (
                jsonify(
                    {
                        "error": "Invalid start_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"
                    }
                ),
                400,
            )

    if end_date_str:
        try:
            end_date = datetime.datetime.fromisoformat(
                end_date_str.replace("Z", "+00:00")
            )
        except ValueError:
            return (
                jsonify(
                    {
                        "error": "Invalid end_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"
                    }
                ),
                400,
            )

    # Get logs
    result = get_logs(
        log_type=log_type,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        status=status,
        page=page,
        per_page=per_page,
    )

    return jsonify(result), 200


@log_bp.route("/clear", methods=["POST"])
@jwt_required()
@admin_required
def clear_logs():
    data = request.get_json()
    days_to_keep = data.get("days_to_keep", 30)

    if not isinstance(days_to_keep, int) or days_to_keep < 1:
        return jsonify({"error": "days_to_keep must be a positive integer"}), 400

    deleted_count = clear_old_logs(days_to_keep)

    return (
        jsonify(
            {
                "message": f"Successfully cleared logs older than {days_to_keep} days",
                "deleted_count": deleted_count,
            }
        ),
        200,
    )


@log_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required
def get_log_stats():
    db = get_db()

    # Get counts by log type
    pipeline = [
        {"$group": {"_id": "$log_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    log_types = list(db.logs.aggregate(pipeline))

    # Get counts by status
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    statuses = list(db.logs.aggregate(pipeline))

    # Get recent error logs
    error_logs = list(
        db.logs.find({"status": {"$in": ["error", "critical"]}})
        .sort("timestamp", -1)
        .limit(10)
    )

    # Convert ObjectId to string
    for log in error_logs:
        log["_id"] = str(log["_id"])

    return (
        jsonify(
            {
                "log_types": log_types,
                "statuses": statuses,
                "recent_errors": error_logs,
                "total_logs": db.logs.count_documents({}),
            }
        ),
        200,
    )
