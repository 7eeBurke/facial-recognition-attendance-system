# Face Recognition Attendance System

## Overview

This project is a Facial Recognition Attendance System that automates attendance tracking. The system is built using Next.js for the frontend, Flask for the backend, and Firebase for data storage and authentication.

## Features

- **Real-time Face Recognition**: Uses OpenCV and Dlib's face_recognition library.
- **Session Management**: Organise attendance sessions with schedules.
- **Automated Attendance Tracking**: Stores attendance records in Firebase.
- **Dashboard**: View attendance data and session details.

## Installation & Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js** (Latest version)
- **Python 3.8+**
- **Git**

### Clone the Repository

```sh
 git clone https://github.com/7eeBurke/facial-recognition-attendance-system.git
 cd FacRecSys
```

### Backend Setup (Flask)

1. Activate virtual environment:

```sh
cd backend
source myenv/bin/activate  # MacOS/Linux
myenv\Scripts\activate  # Windows
```

2. Create a `.env` file in the `backend/` directory and add your Firebase credentials:

```sh
FIREBASE_PRIVATE_KEY={private-key}
```

3. Run the Flask server:

```sh
python app.py
```

### Frontend Setup (Next.js)

1. Install dependencies:

```sh
cd ../frontend
npm install
```

2. Create a `.env` file in the `frontend/` directory:

```sh
NEXT_PUBLIC_FIREBASE_API_KEY=api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=app_id

NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5000
```

3. Start the development server:

```sh
npm run dev
```

## Running the Application

1. Start the Flask backend first.
2. Run the Next.js frontend.
3. Open `http://localhost:3000`.

## How to Use

1. Create an account or login.
2. Create sessions.
3. Create link to session with 'Link' button.
4. Send link to participants to sign up with photo ID.
5. Start facial recognition to mark attendance.
6. View attendance records on dashboard or download as Excel spreadsheet.
