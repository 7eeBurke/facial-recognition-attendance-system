from flask import Flask, jsonify, request
from flask_cors import CORS
import cv2
import json
import io
import os
import numpy as np
from PIL import Image
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, storage, firestore
import face_recognition
import base64
import datetime

app = Flask(__name__)
CORS(app) # Allows frontend to make requests to backend

# Load Firebase credentials
load_dotenv()
firebase_private_key = os.getenv('FIREBASE_PRIVATE_KEY')
private_key = json.loads(firebase_private_key)

cred = credentials.Certificate(private_key)
firebase_admin.initialize_app(cred, {
    'storageBucket': 'final-year-project-21b25.appspot.com'
})

# Initialise Firestore
db = firestore.client()

def load_images_for_session(session_id):
    bucket = storage.bucket()
    participants = get_session_participants(session_id)

    known_face_encodings = []
    known_face_names = []

    if participants:
        for participant in participants:
            try:
                blob = bucket.blob(participant['photoID'])
                image_data = blob.download_as_bytes()
                image = Image.open(io.BytesIO(image_data))

                face_encoding = face_recognition.face_encodings(np.array(image))[0]
                known_face_encodings.append(face_encoding)
                known_face_names.append(participant['name'])
            except Exception as e:
                print(f"Error processing participant {participant['name']}: {e}")
                continue

    return known_face_encodings, known_face_names

# Get participants for session
def get_session_participants(session_id):
    participants_ref = db.collection("sessions").document(session_id).collection("participants")
    participants = []

    try:
        docs = participants_ref.stream()
        for doc in docs:
            participant = doc.to_dict()
            if 'photoID' in participant and 'name' in participant:
                participants.append(participant)
    except Exception as e:
        print(f"Error fetching participants: {e}")

    return participants

def initialise_attendance_for_class(session_id, class_date, time_slot):
    # Start attendance for class, mark everyone as absent by default
    participants = get_session_participants(session_id)
    attendance_ref = db.collection("sessions").document(session_id).collection("attendance")

    doc_id = f"{class_date}_{time_slot.replace(':', '')}"  # Unique ID for date and time
    attendance_doc = {
        "date": class_date,
        "timeSlot": time_slot,
        "participants": [{"name": p["name"], "status": "absent"} for p in participants],
        "totalPresent": 0,
        "totalParticipants": len(participants),
    }

    # Create or change the document
    attendance_ref.document(doc_id).set(attendance_doc)


def record_attendance(session_id, participant_name, class_date, time_slot):
    # Update attendance for recognised participant
    attendance_ref = db.collection("sessions").document(session_id).collection("attendance")
    doc_id = f"{class_date}_{time_slot.replace(':', '')}"
    attendance_doc = attendance_ref.document(doc_id)

    # Fetch the attendance doc
    doc = attendance_doc.get()
    if not doc.exists:
        print("Attendance document not initialised.")
        initialise_attendance_for_class(session_id, class_date, time_slot)
        doc = attendance_doc.get() 

    data = doc.to_dict()
    participants = data["participants"]

    # Update participant status
    updated = False
    for participant in participants:
        if participant["name"] == participant_name and participant["status"] == "absent":
            participant["status"] = "present"
            participant["timestamp"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            data["totalPresent"] += 1
            updated = True
            break

    # Update Firestore
    if updated:
        attendance_doc.update(data)


@app.route('/get-attendance-table', methods=['GET'])
def get_attendance_table():
    # Generate attendance table for session
    #Columns: Name, Att %, ession date + time
    session_id = request.args.get('sessionId')
    if not session_id:
        return jsonify({"error": "Missing sessionId"}), 400

    try:
        attendance_ref = db.collection("sessions").document(session_id).collection("attendance")
        participants_ref = db.collection("sessions").document(session_id).collection("participants")

        # Fetch all participants
        participants = {}
        for doc in participants_ref.stream():
            participant_data = doc.to_dict()
            participants[participant_data["name"]] = {"total_present": 0, "sessions": {}}

        # Fetch all attendance docs
        session_dates = []  # List of unique date + time keys
        for doc in attendance_ref.stream():
            record = doc.to_dict()
            date = record.get("date")
            time_slot = record.get("timeSlot")
            date_time_key = f"{date} ({time_slot})"

            # Track session dates
            if date_time_key not in session_dates:
                session_dates.append(date_time_key)

            # Update participant attendance
            for participant in record.get("participants", []):
                name = participant["name"]
                status = participant["status"]
                if name in participants:
                    participants[name]["sessions"][date_time_key] = "✓" if status == "present" else "-"
                    if status == "present":
                        participants[name]["total_present"] += 1

        # Calculate attendance percentage
        total_sessions = len(session_dates)
        for name, data in participants.items():
            data["percentage"] = round((data["total_present"] / total_sessions) * 100, 2) if total_sessions > 0 else 0

        # Prepare response data
        table_data = []
        for name, data in participants.items():
            row = {
                "Name": name,
                "Att. %": data["percentage"],
            }
            # Add session attendance for each date + time
            for date_time in session_dates:
                row[date_time] = data["sessions"].get(date_time, "-")
            table_data.append(row)

        # Return table data
        return jsonify({
            "columns": ["Name", "Att. %"] + session_dates,
            "data": table_data
        }), 200

    except Exception as e:
        print(f"Error generating attendance table: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/process-frame', methods=['POST'])
def process_frame():
    # Process a single frame sent from the frontend + return
    session_id = request.args.get('sessionId')
    class_date = request.args.get('classDate')
    time_slot = request.args.get('timeSlot')  

    if not session_id or not class_date or not time_slot:
        return jsonify({"error": "Missing sessionId, classDate, or timeSlot"}), 400

    print(f"Processing frame for sessionId: {session_id}, classDate: {class_date}, timeSlot: {time_slot}")

    try:
        # Load known faces for the session
        known_face_encodings, known_face_names = load_images_for_session(session_id)

        # Get frame data
        frame_data = request.json.get('frame')
        if not frame_data:
            return jsonify({"error": "No frame data provided"}), 400

        # Decode the base64 encoded frame
        frame_bytes = np.frombuffer(base64.b64decode(frame_data.split(",")[1]), dtype=np.uint8)
        frame = cv2.imdecode(frame_bytes, cv2.IMREAD_COLOR)

        # Resize + process the frame
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

        # Detect faces
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
        face_names = []

        # Match faces to known participants
        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
            name = "Unknown"

            if True in matches:
                face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    name = known_face_names[best_match_index]

            face_names.append(name)

            # Record attendance for recognised participants
            if name != "Unknown":
                record_attendance(session_id, name, class_date, time_slot)

        # Respond with the detected faces
        return jsonify({
            "face_locations": face_locations,
            "face_names": face_names
        }), 200

    except Exception as e:
        print(f"Error processing frame: {e}")
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)
