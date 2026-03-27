import React from 'react';

export default function SessionList({
	sessions,
	onAddSession,
	onSelectSession,
	selectedSessionId,
}) {
	return (
		<div className="flex flex-col items-start w-80 max-h-[75vh] overflow-y-auto">
			<button
				onClick={onAddSession}
				className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded mb-4 w-full"
			>
				Add New Session
			</button>
			<div className="flex flex-col gap-4 w-full">
				{sessions.length > 0 ? (
					sessions.map((session) => (
						<div
							key={session.id}
							onClick={() => onSelectSession(session)}
							className={`cursor-pointer bg-grey-800 p-4 rounded shadow-md w-full ${
								selectedSessionId === session.id ? 'ring-2 ring-indigo-500' : ''
							}`}
						>
							<h3 className="text-xl font-semibold">{session.name}</h3>
						</div>
					))
				) : (
					<p className="text-gray-400">No sessions found.</p>
				)}
			</div>
		</div>
	);
}
