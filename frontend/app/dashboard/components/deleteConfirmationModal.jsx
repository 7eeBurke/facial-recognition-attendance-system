import React from 'react';

export default function DeleteConfirmationModal({
	onConfirmDelete,
	onCancelDelete,
}) {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-grey-900 bg-opacity-50">
			<div className="bg-grey-800 p-6 rounded shadow-lg text-center">
				<h3 className="text-lg font-semibold mb-4 text-red-500">
					Confirm Delete
				</h3>
				<p className="text-gray-300 mb-6">
					Are you sure you want to delete this session?
				</p>
				<div className="flex justify-center space-x-4">
					<button
						onClick={onConfirmDelete}
						className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
					>
						Delete
					</button>
					<button
						onClick={onCancelDelete}
						className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
