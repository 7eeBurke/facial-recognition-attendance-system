'use client';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	query,
	updateDoc,
	where,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import DeleteConfirmationModal from './components/deleteConfirmationModal';
import EditSessionForm from './components/editSessionForm';
import Header from './components/header';
import SessionDetails from './components/sessionDetails';
import SessionList from './components/sessionList';

export default function Dashboard() {
	const [sessions, setSessions] = useState([]);
	const [selectedSession, setSelectedSession] = useState(null);
	const [isEditing, setIsEditing] = useState(false);
	const [editedSession, setEditedSession] = useState(null);
	const [error, setError] = useState(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [user, setUser] = useState(null);
	const router = useRouter();

	// Handle user auth
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			if (currentUser) {
				fetchUserSessions(currentUser.uid);
			} else {
				setSessions([]);
			}
		});
		return () => unsubscribe();
	}, []);

	// Function to fetch sessions of logged in user
	const fetchUserSessions = (userId) => {
		const q = query(collection(db, 'sessions'), where('userId', '==', userId));
		onSnapshot(q, (snapshot) => {
			const userSessions = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
			setSessions(userSessions);
		});
	};

	// Function to handle signing out
	const SignOut = async () => {
		try {
			await signOut(auth);
			router.replace('/');
			console.log('Successfully signed out!');
		} catch (error) {
			console.error('Error signing out:', error);
		}
	};

	const AddSession = () => {
		const newSession = {
			name: '',
			days: [{ day: '', startTime: '', endTime: '' }],
			startDate: '',
			endDate: '',
			userId: user.uid,
		};
		setSelectedSession(newSession);
		setEditedSession(newSession);
		setIsEditing(true);
	};

	const ApplyChanges = async () => {
		if (validateSession(editedSession)) {
			try {
				if (editedSession.id) {
					const sessionRef = doc(db, 'sessions', editedSession.id);
					await updateDoc(sessionRef, {
						name: editedSession.name,
						days: editedSession.days,
						startDate: editedSession.startDate,
						endDate: editedSession.endDate,
					});
					// Update the selectedSession with the new details
					setSelectedSession((prevSession) => ({
						...prevSession,
						name: editedSession.name,
						days: editedSession.days,
						startDate: editedSession.startDate,
						endDate: editedSession.endDate,
					}));
				} else {
					// Add new session
					const newSessionRef = await addDoc(collection(db, 'sessions'), {
						...editedSession,
						userId: user.uid,
					});
					// Set the selected session to the new one
					setSelectedSession({ id: newSessionRef.id, ...editedSession });
				}
				setIsEditing(false);
				setError(null);
			} catch (error) {
				console.error('Error applying changes:', error);
				setError('An error occurred while saving your changes.');
			}
		} else {
			setError('All fields are required. Please complete the form.');
		}
	};

	// Validation logic for the session
	const validateSession = (session) => {
		if (!session.name || !session.startDate || !session.endDate) return false;
		for (const day of session.days) {
			if (!day.day || !day.startTime || !day.endTime) return false;
		}
		return true;
	};

	const SessionSelect = (session) => {
		setSelectedSession(session);
		setEditedSession(null);
		setIsEditing(false);
	};

	const EditSession = () => {
		setIsEditing(true);
		setEditedSession({ ...selectedSession });
	};

	const CancelChanges = () => {
		if (editedSession?.id) {
			setEditedSession(selectedSession);
		} else {
			setEditedSession(null);
			setSelectedSession(null);
		}
		setIsEditing(false);
		setError(null);
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB');
	};

	const DayChange = (index, field, value) => {
		const updatedDays = editedSession.days.map((day, i) =>
			i === index ? { ...day, [field]: value } : day
		);
		setEditedSession({ ...editedSession, days: updatedDays });
	};

	const AddDay = () => {
		const newDay = { day: '', startTime: '', endTime: '' };
		setEditedSession({
			...editedSession,
			days: [...editedSession.days, newDay],
		});
	};

	const DeleteDay = (index) => {
		const updatedDays = editedSession.days.filter((_, i) => i !== index);
		setEditedSession({ ...editedSession, days: updatedDays });
	};

	const ShowDeleteConfirm = () => {
		setShowDeleteConfirm(true);
	};

	const ConfirmDelete = async () => {
		try {
			// Delete the selected session from Firestore
			const sessionRef = doc(db, 'sessions', selectedSession.id);
			await deleteDoc(sessionRef);

			// Clear selected session and close the delete confirmation modal
			setSelectedSession(null);
			setShowDeleteConfirm(false);

			console.log('Session successfully deleted!');
		} catch (error) {
			console.error('Error deleting session:', error);
			setError('Failed to delete the session. Please try again.');
		}
	};

	const CancelDelete = () => {
		setShowDeleteConfirm(false);
	};

	const daysOfWeek = [
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
		'Sunday',
	];

	return (
		<div className="min-h-screen bg-grey-900 text-white p-4">
			<Header onSignOut={SignOut} />

			<div className="flex space-x-6">
				<SessionList
					sessions={sessions}
					onAddSession={AddSession}
					onSelectSession={SessionSelect}
					selectedSessionId={selectedSession?.id}
				/>

				<div className="flex-1 bg-grey-800 p-6 rounded shadow-md space-y-6">
					{selectedSession ? (
						isEditing ? (
							<EditSessionForm
								editedSession={editedSession}
								setEditedSession={setEditedSession}
								onApplyChanges={ApplyChanges}
								onCancelChanges={CancelChanges}
								DayChange={DayChange}
								AddDay={AddDay}
								DeleteDay={DeleteDay}
								daysOfWeek={daysOfWeek}
								error={error}
							/>
						) : (
							<SessionDetails
								selectedSession={selectedSession}
								onEdit={EditSession}
								onDelete={ShowDeleteConfirm}
								formatDate={formatDate}
							/>
						)
					) : (
						<p className="text-neutral-300">Select a session to view details</p>
					)}
				</div>
			</div>

			{showDeleteConfirm && (
				<DeleteConfirmationModal
					onConfirmDelete={ConfirmDelete}
					onCancelDelete={CancelDelete}
				/>
			)}
		</div>
	);
}
