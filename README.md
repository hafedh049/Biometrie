  <h1>FingerScanner</h1>
  <p>Advanced Biometric Authentication System</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-13.4+-000000?style=flat&logo=next.js)](https://nextjs.org/)
  [![Flask](https://img.shields.io/badge/Flask-2.3.0+-000000?style=flat&logo=flask)](https://flask.palletsprojects.com/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.100.0+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
  [![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)

## 📋 Table of Contents

  

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
- [API Endpoints](#-api-endpoints)
- [Usage Examples](#-usage-examples)
- [Contributing](#-contributing)
- [License](#-license)
- [Team](#-team)
## 🔍 Overview

FingerScanner is an advanced biometric authentication system that leverages fingerprint recognition technology to provide secure, reliable, and user-friendly identity verification. The system processes fingerprint images, extracts unique minutiae points, and creates secure hash templates for authentication purposes.

> **Note:** This project was developed as part of a final year project (PFA) at [Your University].
## ✨ Features

- **High-Quality Fingerprint Processing**
  - Image enhancement and normalization
  - Minutiae extraction and template generation
  - Robust matching algorithm

- **Secure Authentication**
  - JWT-based authentication
  - Role-based access control
  - Multi-factor authentication options

- **User Management**
  - User registration and profile management
  - Administrative controls
  - Audit logging

- **Modern UI/UX**
  - Responsive design
  - Intuitive fingerprint capture interface
  - Real-time feedback

- **API Integration**
  - Comprehensive RESTful API
  - Swagger documentation
  - SDK for third-party integration
## 🛠 Technology Stack

### Frontend
- **Next.js** - React framework with App Router
- **shadcn/ui** - Component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **SWR** - React Hooks for data fetching
### Backend
- **Flask** - Python web framework for authentication service
- **FastAPI** - Modern API framework for fingerprint processing
- **MongoDB** - NoSQL database for data storage
- **JWT** - Token-based authentication
- **OpenCV & NumPy** - Image processing libraries
### DevOps
- **Docker & Docker Compose** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Nginx** - Reverse proxy
## 🏗 Architecture

FingerScanner follows a microservices architecture with the following components:

```

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐

│   Next.js UI    │────▶│  Flask Auth     │────▶│    MongoDB      │

│   (Frontend)    │◀────│  Service        │◀────│    Database     │

└─────────────────┘     └─────────────────┘     └─────────────────┘

         │                      │                       ▲

         │                      │                       │

         ▼                      ▼                       │

┌─────────────────┐     ┌─────────────────┐            │

│  FastAPI        │────▶│  User Management│────────────┘

│  Fingerprint    │◀────│  Service        │

└─────────────────┘     └─────────────────┘

```
## 📥 Installation

### Prerequisites

- Node.js 18.x or higher
- Python 3.10 or higher
- MongoDB 6.0 or higher
- Docker and Docker Compose (optional)
### Frontend Setup

1. **Clone the repository**

```bash

git clone https://github.com/hafedh049/Ramsys.git
cd Ramsys/frontend
```

2. **Install dependencies**

```bash
npm install --force
```

3. **Start the development server**

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Backend Setup

1. **Set up Python virtual environment**

```bash
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**

```bash
pip install -r requirements.txt
```

3. **Configure environment variables**

Create a `.env` file in the backend directory:

```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=princeoflight
MONGODB_URI=mongodb://localhost:27017/Ramsys
JWT_SECRET_KEY=princeoflight
```

4. **Start the Flask authentication service**

```bash
python app.y
```

The Flask service will be available at `http://localhost:5000`.
### Docker Setup (Alternative)

You can also use Docker Compose to run the entire stack:

```bash
docker-compose up -d
```
## 📡 API Endpoints

### Authentication API

#### Register User

> 🟢 **POST** `/api/auth/register`

Creates a new user account in the system.

**Request Body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecureP@ss123",
  "phone_number": "+1234567890"
}
```

**Response (201 Created):**

```json
{
  "message": "User registered successfully",
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "phone_number": "+1234567890",
    "account_status": "active",
    "role": "client",
    "created_at": "2023-04-15T14:30:45.123Z"
  }
}
```
#### Login

> 🟢 **POST** `/api/auth/login`

Authenticates a user and issues JWT tokens.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200 OK):**

```json
{
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "client",
    "account_status": "active"
  }
}
```
#### Refresh Token

> 🟢 **POST** `/api/auth/refresh`

Refreshes an expired access token using a valid refresh token.

**Headers:**

- `Authorization: Bearer {refresh_token}`

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
#### Logout

> 🟢 **POST** `/api/auth/logout`

Logs out a user by updating their last logout timestamp.

**Headers:**

- `Authorization: Bearer {access_token}`

**Response (200 OK):**

```json
{
  "message": "Logout successful"
}
```
#### Update Fingerprint

> 🟢 **POST** `/api/auth/update-fingerprint`

Updates a user's fingerprint data.

**Headers:**

- `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "fingerprint": "base64_encoded_fingerprint_image"
}
```

**Response (200 OK):**

```json
{
  "message": "Fingerprint updated successfully"
}
```
### User Management API

#### Get Users

> 🔵 **GET** `/api/users/`

Retrieves a paginated list of users (admin only).

**Headers:**

- `Authorization: Bearer {access_token}`

**Query Parameters:**

- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 10)
- `status`: Filter by account status

**Response (200 OK):**

```json
{
  "users": [...],
  "total": 42,
  "page": 1,
  "per_page": 10,
  "pages": 5
}
```
#### Get User

> 🔵 **GET** `/api/users/{user_id}`

Retrieves a specific user's profile.

**Headers:**

- `Authorization: Bearer {access_token}`

**Response (200 OK):**

```json
{
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "phone_number": "+1234567890",
    "account_status": "active",
    "role": "client",
    "created_at": "2023-04-15T14:30:45.123Z"
  }
}
```
#### Create User

> 🟢 **POST** `/api/users/`

Creates a new user (admin only).

**Headers:**

- `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "username": "jane_doe",
  "email": "jane@example.com",
  "password": "SecureP@ss456",
  "phone_number": "+0987654321",
  "role": "client",
  "account_status": "active"
}
```

**Response (201 Created):**

```json
{
  "message": "User created successfully",
  "user": {
    "user_id": "660f9500-f30c-52e5-b827-557766550111",
    "username": "jane_doe",
    "email": "jane@example.com",
    "phone_number": "+0987654321",
    "account_status": "active",
    "role": "client",
    "created_at": "2023-04-16T10:20:30.456Z"
  }
}
```
#### Update User

> 🟠 **PUT** `/api/users/{user_id}`

Updates a user's profile.

**Headers:**

- `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "username": "john_smith",
  "email": "john.smith@example.com",
  "phone_number": "+1234567890"
}
```

**Response (200 OK):**

```json
{
  "message": "User updated successfully",
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_smith",
    "email": "john.smith@example.com",
    "phone_number": "+1234567890",
    "account_status": "active",
    "role": "client",
    "created_at": "2023-04-15T14:30:45.123Z",
    "updated_at": "2023-04-16T09:15:22.456Z"
  }
}
```
#### Delete User

> 🔴 **DELETE** `/api/users/{user_id}`

Deletes a user and their associated data (admin only).

**Headers:**

- `Authorization: Bearer {access_token}`

**Response (200 OK):**

```json
{
  "message": "User deleted successfully"
}
```
### Fingerprint API

#### Process Fingerprint

> 🟢 **POST** `/api/fingerprint/process`

Processes a fingerprint image and extracts features.

**Headers:**

- `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "image": "base64_encoded_fingerprint_image",
  "options": {
    "enhance": true,
    "extract_minutiae": true
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "fingerprint_hash": "a1b2c3d4e5f6...",
  "quality_score": 0.85,
  "minutiae_count": 42
}
```
#### Verify Fingerprint

> 🟢 **POST** `/api/fingerprint/verify`

Verifies a fingerprint against a stored template.

**Headers:**

- `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "image": "base64_encoded_fingerprint_image",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**

```json
{
  "match": true,
  "confidence": 0.92,
  "verification_time_ms": 235
}
```
## 🚀 Usage Examples

### Authentication Flow

```javascript
// Register a new user
async function registerUser(userData) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return await response.json();
}

// Login
async function login(credentials) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.access_token);
    return { success: true, user: data.user };
  }
  return { success: false, error: data.error };
}

// Update fingerprint
async function updateFingerprint(fingerprintData) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/auth/update-fingerprint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ fingerprint: fingerprintData }),
  });
  return await response.json();
}
```
### Fingerprint Processing

```python
import cv2
import numpy as np
import base64
import requests

# Capture fingerprint image
def capture_fingerprint():
    # Code to capture fingerprint from a sensor
    # For this example, we'll load an image file
    image = cv2.imread('fingerprint.jpg', cv2.IMREAD_GRAYSCALE)
    return image

# Preprocess and encode the image
def process_and_encode(image):
    # Enhance the image
    enhanced = cv2.equalizeHist(image)
    
    # Encode as base64
    _, buffer = cv2.imencode('.jpg', enhanced)
    encoded = base64.b64encode(buffer).decode('utf-8')
    
    return encoded

# Send to API
def verify_fingerprint(encoded_image, user_id, api_url, token):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    payload = {
        'image': encoded_image,
        'user_id': user_id
    }
    
    response = requests.post(
        f'{api_url}/api/fingerprint/verify',
        json=payload,
        headers=headers
    )
    
    return response.json()

# Usage
image = capture_fingerprint()
encoded = process_and_encode(image)
result = verify_fingerprint(
    encoded,
    '550e8400-e29b-41d4-a716-446655440000',
    'http://localhost:8000',
    'your_access_token'
)

print(f"Match: {result['match']}, Confidence: {result['confidence']}")
```
## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and adhere to the existing coding style.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
## 👥 Team

> [! Important]
> **Hafedh GUENICHI**
> **Ibtihel SALHI**
> **Amel MABROUKI**
> **Sarra KHADHRAOUI**
> **Nesrine GANNOUNI**

> [! Success]
> **Made with ❤️ for our PFA project**

This **README** provides a comprehensive overview of your FingerScanner project with detailed setup instructions for both frontend and backend, API endpoint documentation with callouts, usage examples, and more. The design is visually appealing with emojis, badges, and well-structured sections.

You can customize it further by:
1. **Adding actual GitHub usernames and profile pictures for team members**
2. **Updating the project logo**
3. **Adding screenshots of the application**
4. **Expanding the usage examples for specific features**