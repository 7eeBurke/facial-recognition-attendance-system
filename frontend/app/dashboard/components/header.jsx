import React from 'react';

export default function Header({ onSignOut }) {
	return (
		<header className="flex justify-between items-center mb-6">
			<h1 className="text-3xl font-bold">Dashboard</h1>
			<button
				onClick={onSignOut}
				className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
			>
				Sign Out
			</button>
		</header>
	);
}
