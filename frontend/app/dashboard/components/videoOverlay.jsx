import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { db } from '../../firebase';

export default function FacialRecognitionOverlay({
	sessionId,
	sessionName,
	onClose,
}) {
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [recognitionResult, setRecognitionResult] = useState([]);
	const frameCountRef = useRef(0);

	const stopVideoStream = () => {
		if (videoRef.current && videoRef.current.srcObject) {
			const tracks = videoRef.current.srcObject.getTracks();
			tracks.forEach((track) => track.stop());
		}
	};

	// Start the video feed when the component mounts
	useEffect(() => {
		const startVideoFeed = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: true,
				});
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
			} catch (err) {
				console.error('Error accessing video stream:', err);
				alert('Could not access your camera. Please allow camera permissions.');
			}
		};

		startVideoFeed();

		// Stop the video feed when the component unmounts
		return () => stopVideoStream();
	}, []);

	const fetchSessionSchedule = async (sessionId) => {
		try {
			const sessionRef = doc(db, 'sessions', sessionId);
			const sessionDoc = await getDoc(sessionRef);

			if (!sessionDoc.exists()) {
				console.error('Session not found');
				return null;
			}

			const sessionData = sessionDoc.data();
			const { days, startDate, endDate } = sessionData;

			return { days, startDate, endDate };
		} catch (error) {
			console.error('Error fetching session schedule:', error);
			return null;
		}
	};

	const getCurrentTimeSlot = async (sessionId) => {
		const sessionSchedule = await fetchSessionSchedule(sessionId);
		if (!sessionSchedule) return null;

		const { days, startDate, endDate } = sessionSchedule;
		const now = new Date();
		const currentDay = now.toLocaleString('en-US', { weekday: 'long' });

		// Check if current date is within the sessions startDate and endDate
		const sessionStart = new Date(startDate);
		const sessionEnd = new Date(endDate);
		if (now < sessionStart || now > sessionEnd) {
			console.warn('Current date is outside the session schedule.');
			return null;
		}

		// Match current time with the sessions days
		const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

		for (const daySchedule of days) {
			if (daySchedule.day === currentDay) {
				const [startHour, startMinute] = daySchedule.startTime
					.split(':')
					.map(Number);
				const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number);

				const startTime = startHour * 60 + startMinute;
				const endTime = endHour * 60 + endMinute;

				if (currentTime >= startTime && currentTime < endTime) {
					return `${daySchedule.startTime} - ${daySchedule.endTime}`;
				}
			}
		}

		return null; // No active time slot
	};

	// Send frame to backend for recognition
	const sendFrameToBackend = async (imageData) => {
		const currentDate = new Date().toISOString().split('T')[0]; // Todays date
		const currentTimeSlot = await getCurrentTimeSlot(sessionId);

		if (!currentTimeSlot) {
			alert('No session scheduled for the current time.');
			return;
		}

		setIsProcessing(true); // Set processing state
		try {
			const response = await fetch(
				`http://127.0.0.1:5000/process-frame?sessionId=${sessionId}&classDate=${currentDate}&timeSlot=${currentTimeSlot}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ frame: imageData }),
				}
			);

			const data = await response.json();
			if (data.face_names && data.face_locations) {
				setRecognitionResult(data); // Update recognition results
			} else {
				setRecognitionResult([]);
			}
		} catch (error) {
			console.error('Error processing frame:', error);
		} finally {
			setIsProcessing(false); // Reset processing state
		}
	};

	// Capture and send frames at intervals
	useEffect(() => {
		const processFrames = () => {
			if (!videoRef.current || !canvasRef.current) return;

			const canvas = canvasRef.current;
			const context = canvas.getContext('2d');
			context.clearRect(0, 0, canvas.width, canvas.height);

			// Flip the video feed horizontally
			context.save();
			context.scale(-1, 1); // Flip horizontally
			context.translate(-canvas.width, 0); // Adjust the position
			context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
			context.restore();

			// Draw boxes on the canvas
			if (recognitionResult.face_locations && recognitionResult.face_names) {
				recognitionResult.face_locations.forEach((location, index) => {
					const [top, right, bottom, left] = location.map((coord) => coord * 4); // Scale back to original size

					const isRecognized =
						recognitionResult.face_names[index] !== 'Unknown';
					const boxColor = isRecognized ? 'green' : 'red';
					const textColor = isRecognized ? 'green' : 'red';
					context.lineWidth = 4;

					context.strokeRect(left, top, right - left, bottom - top);

					context.strokeStyle = boxColor;
					context.fillStyle = textColor;
					context.font = '16px Arial';
					context.fillText(
						recognitionResult.face_names[index] || 'Unknown',
						left + 5,
						bottom - 10
					);
				});
			}

			// Send every 90th frame for recognition (4 seconds)
			frameCountRef.current += 1;
			if (frameCountRef.current % 120 === 0) {
				const frameData = canvas.toDataURL('image/jpeg');
				sendFrameToBackend(frameData);
			}
		};

		const interval = setInterval(() => {
			if (!isProcessing) {
				processFrames();
			}
		}, 33); // Video feed is 30fps

		return () => clearInterval(interval);
	}, [isProcessing, recognitionResult]);

	return (
		<div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-70 z-50">
			<div className="bg-grey-900 text-white p-6 rounded shadow-lg w-3/4 max-w-4xl">
				{/* Header */}
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold">{sessionName || 'Session'}</h2>
					<button
						onClick={() => {
							stopVideoStream();
							onClose();
						}}
						className="text-red-400 hover:text-red-200 text-4xl"
					>
						&times;
					</button>
				</div>
				<div
					id="video-container"
					className="bg-black rounded overflow-hidden aspect-video relative"
				>
					<video
						ref={videoRef}
						autoPlay
						muted
						className="w-full h-full object-cover"
					></video>
					<canvas
						ref={canvasRef}
						width="640"
						height="480"
						className="absolute top-0 left-0 w-full h-full"
					></canvas>
				</div>
			</div>
		</div>
	);
}
