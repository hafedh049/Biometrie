from uuid import uuid4
from pymongo import MongoClient
import os
from bson import ObjectId
import datetime

# MongoDB connection
client = None
db = None


def init_db():
    global client, db
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
    client = MongoClient(mongo_uri)
    db = client["secure_night"]

    # Create admin user if not exists
    if db.users.count_documents({"email": "admin@example.com"}) == 0:
        create_admin_user()

    # Create client user if not exists
    if db.users.count_documents({"email": "client@example.com"}) == 0:
        create_client_user()

    # Create indexes
    db.users.create_index("email", unique=True)
    db.users.create_index("username", unique=True)
    db.devices.create_index("device_id", unique=True)
    db.partitions.create_index("partition_id", unique=True)
    db.files.create_index("file_id", unique=True)

    return db


def get_db():
    global db
    if db is None:
        db = init_db()
    return db


def create_admin_user():
    from werkzeug.security import generate_password_hash

    global db

    admin_user = {
        "user_id": str(uuid4()),
        "username": "admin",
        "email": "admin@example.com",
        "password": generate_password_hash("admin123"),
        "phone_number": "+1234567890",
        "fingerprint_hashes": [],
        "fingerprint_pictures": [],
        "last_login": None,
        "last_logout": None,
        "account_status": "active",
        "role": "admin",
        "created_at": datetime.datetime.utcnow(),
    }

    db.users.insert_one(admin_user)
    print("Admin user created successfully")


def create_client_user():
    from werkzeug.security import generate_password_hash

    global db

    client_user = {
        "user_id": str(uuid4()),
        "username": "client",
        "email": "client@example.com",
        "password": generate_password_hash("client123"),
        "phone_number": "+1234567890",
        "fingerprint_hashes": [],
        "fingerprint_pictures": [],
        "last_login": None,
        "last_logout": None,
        "account_status": "active",
        "role": "client",
        "created_at": datetime.datetime.utcnow(),
    }

    db.users.insert_one(client_user)
    print("Client user created successfully")


# Helper function to convert ObjectId to string in MongoDB documents
def serialize_doc(doc):
    if doc is None:
        return None

    if "_id" in doc:
        doc["_id"] = str(doc["_id"])

    return doc
