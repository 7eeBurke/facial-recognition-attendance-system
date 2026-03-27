import React from 'react';

export default function EditSessionForm({
	editedSession,
	setEditedSession,
	onApplyChanges,
	onCancelChanges,
	DayChange,
	AddDay,
	DeleteDay,
	daysOfWeek,
	error,
}) {
	return (
		<div>
			<input
				type="text"
				value={editedSession.name}
				onChange={(e) =>
					setEditedSession({ ...editedSession, name: e.target.value })
				}
				className="bg-neutral-700 text-white p-2 rounded mb-4 w-full border border-neutral-500"
				placeholder="Session Name"
			/>
			<div className="flex justify-between mb-4">
				<div>
					<span className="font-semibold">Start Date:</span>
					<input
						type="date"
						value={editedSession.startDate}
						onChange={(e) =>
							setEditedSession({ ...editedSession, startDate: e.target.value })
						}
						className="bg-neutral-700 text-white p-2 rounded ml-2 border border-neutral-500"
					/>
				</div>
				<div>
					<span className="font-semibold">End Date:</span>
					<input
						type="date"
						value={editedSession.endDate}
						onChange={(e) =>
							setEditedSession({ ...editedSession, endDate: e.target.value })
						}
						className="bg-neutral-700 text-white p-2 rounded ml-2 border border-neutral-500"
					/>
				</div>
			</div>
			<h3 className="text-lg font-semibold border-b border-gray-600 pb-2 mb-4">
				Schedule:
			</h3>
			<ul className="space-y-3">
				{editedSession.days.map((dayInfo, index) => (
					<li key={index} className="flex items-center mb-2">
						<select
							value={dayInfo.day}
							onChange={(e) => DayChange(index, 'day', e.target.value)}
							className="bg-neutral-700 text-white p-2 rounded ml-2 border border-neutral-500 w-1/4"
						>
							<option value="" disabled>
								Select Day
							</option>
							{daysOfWeek.map((day) => (
								<option key={day} value={day}>
									{day}
								</option>
							))}
						</select>
						<input
							type="time"
							value={dayInfo.startTime}
							onChange={(e) => DayChange(index, 'startTime', e.target.value)}
							className="bg-neutral-700 text-white p-2 rounded ml-2 border border-neutral-500 w-1/4"
						/>
						<span className="mx-2">to</span>
						<input
							type="time"
							value={dayInfo.endTime}
							onChange={(e) => DayChange(index, 'endTime', e.target.value)}
							className="bg-neutral-700 text-white p-2 rounded ml-2 border border-neutral-500 w-1/4"
						/>
						<button
							onClick={() => DeleteDay(index)}
							className="ml-4 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
						>
							Delete
						</button>
					</li>
				))}
			</ul>
			<button
				onClick={AddDay}
				className="mt-4 bg-neutral-700 text-white px-4 py-2 rounded border border-neutral-500 w-full"
			>
				Add Day
			</button>
			<div className="flex space-x-4 mt-6 justify-center">
				<button
					onClick={onApplyChanges}
					className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
				>
					Apply
				</button>
				<button
					onClick={onCancelChanges}
					className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
				>
					Cancel
				</button>
			</div>
			{error && <p className="text-red-500 mt-4 text-center">{error}</p>}
		</div>
	);
}
