'use client';

import {
	addDoc,
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db, storage } from '../../firebase';

export default function SessionSignUpPage() {
	const { id } = useParams();
	const [session, setSession] = useState(null);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [photoFile, setPhotoFile] = useState(null); // Store the file directly
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);

	// Fetch session data when 'id' is available
	useEffect(() => {
		if (id) {
			const fetchSession = async () => {
				try {
					const docRef = doc(db, 'sessions', id);
					const docSnap = await getDoc(docRef);

					if (docSnap.exists()) {
						setSession(docSnap.data());
					} else {
						setError('Session not found');
					}
				} catch (err) {
					setError('Error fetching session data');
				}
			};

			fetchSession();
		}
	}, [id]);

	// Function to  sign-up
	const SignUp = async () => {
		if (!name || !email || !photoFile) {
			setError('Please fill in all fields and upload a photo ID');
			return;
		}

		try {
			// Check if the participant already exists
			const alreadySignedUp = await checkIfParticipantExists(id, email);

			if (alreadySignedUp) {
				setError('You have already signed up for this session');
				return;
			}

			// Upload the photo only when signing up
			const fileName = `${name.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
			const photoRef = ref(storage, `session_participants/${fileName}`);

			await uploadBytes(photoRef, photoFile);
			const downloadURL = await getDownloadURL(photoRef);

			// Add participant to the session
			await addParticipantToSession(id, {
				name,
				email,
				photoID: `session_participants/${fileName}`,
			});

			setSuccess(true);
			setName('');
			setEmail('');
			setPhotoFile(null); // Clear photo file after sign-up
		} catch (err) {
			console.error('Error signing up:', err);
			setError('Error signing up. Please try again later.');
		}
	};

	// Function to check if participant already exists
	const checkIfParticipantExists = async (sessionId, email) => {
		const participantsRef = collection(
			doc(db, 'sessions', sessionId),
			'participants'
		);
		const q = query(participantsRef, where('email', '==', email));
		const querySnapshot = await getDocs(q);
		return !querySnapshot.empty;
	};

	// Function to add participant to Firestore
	const addParticipantToSession = async (sessionId, participantData) => {
		const sessionRef = doc(db, 'sessions', sessionId);
		await addDoc(collection(sessionRef, 'participants'), participantData);
	};

	if (!session) {
		return <div>Loading...</div>;
	}

	return (
		<div className="min-h-screen bg-grey-900 text-white p-6">
			<div className="max-w-lg mx-auto bg-grey-800 p-6 rounded shadow-md space-y-6">
				<h2 className="text-3xl font-semibold text-center mb-4">
					{session.name}
				</h2>

				<div className="flex justify-between mb-6">
					<p className="text-sm font-medium">
						<strong>Start Date:</strong>{' '}
						{new Date(session.startDate).toLocaleDateString()}
					</p>
					<p className="text-sm font-medium">
						<strong>End Date:</strong>{' '}
						{new Date(session.endDate).toLocaleDateString()}
					</p>
				</div>

				<h3 className="text-xl font-semibold text-center border-b border-gray-600 mb-4">
					Schedule
				</h3>

				<ul className="grid grid-cols-2 gap-4">
					{session.days.map((day, index) => (
						<li
							key={index}
							className="bg-indigo-600 text-white rounded-full py-2 px-4 text-center"
						>
							{day.day}: {day.startTime} - {day.endTime}
						</li>
					))}
				</ul>

				{error && <p className="text-red-500">{error}</p>}
				{success && (
					<p className="text-green-500">You have successfully signed up!</p>
				)}

				<form onSubmit={(e) => e.preventDefault()}>
					<div className="mb-4">
						<label htmlFor="name" className="block text-sm font-semibold">
							Name
						</label>
						<input
							type="text"
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full p-2 rounded bg-neutral-700 text-white"
							placeholder="Enter your name"
						/>
					</div>

					<div className="mb-4">
						<label htmlFor="email" className="block text-sm font-semibold">
							Email
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full p-2 rounded bg-neutral-700 text-white"
							placeholder="Enter your email"
						/>
					</div>

					<div className="mb-4">
						<label htmlFor="photoID" className="block text-sm font-semibold">
							Upload Photo ID
						</label>
						<input
							type="file"
							id="photoID"
							onChange={(e) => setPhotoFile(e.target.files[0])} // Store the file
							className="w-full p-2 rounded bg-neutral-700 text-white"
						/>
					</div>

					<button
						type="button"
						onClick={SignUp}
						className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
					>
						Sign Up
					</button>
				</form>
			</div>
		</div>
	);
}
