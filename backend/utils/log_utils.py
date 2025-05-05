import datetime
from database import get_db
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
import traceback
import json


def save_log(
    log_type,
    message,
    user_id=None,
    details=None,
    source=None,
    ip_address=None,
    status="info",
):
    """
    Save a log entry to the logs collection

    Parameters:
    - log_type: Type of log (auth, file, device, error, etc.)
    - message: Log message
    - user_id: ID of the user related to this log (optional)
    - details: Additional details as a dictionary (optional)
    - source: Source of the log (route, function, etc.)
    - ip_address: IP address of the client (optional)
    - status: Log status (info, warning, error, critical)

    Returns:
    - The inserted log document
    """
    try:
        db = get_db()

        # Try to get current user if not provided
        if user_id is None:
            try:
                current_user_id = get_jwt_identity()
                if current_user_id:
                    user = db.users.find_one({"_id": ObjectId(current_user_id)})
                    if user:
                        user_id = user.get("user_id")
            except Exception:
                # JWT might not be available in this context
                pass

        # Create log entry
        log_entry = {
            "log_type": log_type,
            "message": message,
            "timestamp": datetime.datetime.utcnow(),
            "status": status,
        }

        # Add optional fields if provided
        if user_id:
            log_entry["user_id"] = user_id

        if details:
            # Ensure details is serializable
            try:
                json.dumps(details)
                log_entry["details"] = details
            except (TypeError, OverflowError):
                # If not serializable, convert to string
                log_entry["details"] = str(details)

        if source:
            log_entry["source"] = source

        if ip_address:
            log_entry["ip_address"] = ip_address

        # Insert log entry
        result = db.logs.insert_one(log_entry)
        log_entry["_id"] = str(result.inserted_id)

        return log_entry

    except Exception as e:
        # If logging fails, print to console but don't raise exception
        print(f"Error saving log: {str(e)}")
        print(traceback.format_exc())
        return None


def get_logs(
    log_type=None,
    user_id=None,
    start_date=None,
    end_date=None,
    status=None,
    page=1,
    per_page=50,
):
    """
    Retrieve logs with optional filtering

    Parameters:
    - log_type: Filter by log type
    - user_id: Filter by user ID
    - start_date: Filter logs after this date
    - end_date: Filter logs before this date
    - status: Filter by log status
    - page: Page number for pagination
    - per_page: Number of logs per page

    Returns:
    - Dictionary with logs and pagination info
    """
    try:
        db = get_db()

        # Build query
        query = {}
        if log_type:
            query["log_type"] = log_type

        if user_id:
            query["user_id"] = user_id

        if status:
            query["status"] = status

        # Date range query
        if start_date or end_date:
            query["timestamp"] = {}

            if start_date:
                query["timestamp"]["$gte"] = start_date

            if end_date:
                query["timestamp"]["$lte"] = end_date

        # Get total count
        total = db.logs.count_documents(query)

        # Get paginated logs
        logs = list(
            db.logs.find(query)
            .sort("timestamp", -1)
            .skip((page - 1) * per_page)
            .limit(per_page)
        )

        # Convert ObjectId to string
        for log in logs:
            log["_id"] = str(log["_id"])
            if "user_id" in log:
                log["user_id"] = str(log["user_id"])
            print(log)

        return {
            "logs": logs,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page,
        }

    except Exception as e:
        print(f"Error retrieving logs: {str(e)}")
        print(traceback.format_exc())
        return {"logs": [], "total": 0, "page": page, "per_page": per_page, "pages": 0}


def clear_old_logs(days_to_keep=30):
    """
    Clear logs older than the specified number of days

    Parameters:
    - days_to_keep: Number of days of logs to keep

    Returns:
    - Number of logs deleted
    """
    try:
        db = get_db()

        # Calculate cutoff date
        cutoff_date = datetime.datetime.utcnow() - datetime.timedelta(days=days_to_keep)

        # Delete old logs
        result = db.logs.delete_many({"timestamp": {"$lt": cutoff_date}})

        return result.deleted_count

    except Exception as e:
        print(f"Error clearing old logs: {str(e)}")
        print(traceback.format_exc())
        return 0
