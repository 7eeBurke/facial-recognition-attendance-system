import { saveAs } from 'file-saver';
import React, { useState } from 'react';
import { FaCamera } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import FacialRecognitionOverlay from './videoOverlay';

export default function SessionDetails({
	selectedSession,
	onEdit,
	onDelete,
	formatDate,
}) {
	const [isLoading, setIsLoading] = useState(false);
	const [showOverlay, setShowOverlay] = useState(false);
	const [attendanceTable, setAttendanceTable] = useState({
		columns: [],
		data: [],
	});
	const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
	const [showAttendance, setShowAttendance] = useState(false);

	// Function to handle link generation
	const GenerateLink = () => {
		const link = `${window.location.origin}/session/${selectedSession.id}`;
		navigator.clipboard
			.writeText(link)
			.then(() => {
				alert('Link copied to clipboard!');
			})
			.catch((err) => {
				console.error('Error copying link:', err);
			});
	};

	const DownloadExcel = () => {
		// Convert table data into an array of objects for Excel
		const { columns, data } = attendanceTable;

		// Create rows for the Excel file
		const excelData = data.map((row) => {
			const formattedRow = {};
			columns.forEach((col) => {
				formattedRow[col] = row[col];
			});
			return formattedRow;
		});

		// Add columns and data to a worksheet
		const worksheet = XLSX.utils.json_to_sheet(excelData, { header: columns });

		// Set column widths
		const columnWidths = columns.map((col) => ({
			wch: Math.max(col.length, 10),
		}));
		worksheet['!cols'] = columnWidths;

		// Create a workbook and append the worksheet
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, selectedSession.name);

		// Write and download the Excel file
		const excelBuffer = XLSX.write(workbook, {
			bookType: 'xlsx',
			type: 'array',
		});
		const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
		saveAs(blob, `${selectedSession.name}_attendance.xlsx`);
	};

	// Function to fetch the attendance table
	const fetchAttendanceTable = async () => {
		setIsAttendanceLoading(true);
		try {
			const response = await fetch(
				`http://127.0.0.1:5000/get-attendance-table?sessionId=${selectedSession.id}`
			);
			if (!response.ok) {
				throw new Error('Failed to fetch attendance table.');
			}
			const data = await response.json();
			setAttendanceTable(data); // Update attendance table state
			setShowAttendance(true); // Show attendance modal
		} catch (error) {
			console.error('Error fetching attendance table:', error);
			alert('Failed to fetch attendance. Please try again later.');
		} finally {
			setIsAttendanceLoading(false);
		}
	};

	// Function to start facial recognition
	const StartRecognition = () => {
		setShowOverlay(true);
	};

	return (
		<div>
			{/* Header */}
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-2xl font-semibold border-b border-gray-600 pb-2">
					{selectedSession.name}
				</h2>
				<button
					onClick={StartRecognition}
					className="bg-grey-800 text-white w-24 h-24 rounded-full hover:bg-neutral-700 flex items-center justify-center"
					title="Start Facial Recognition"
					disabled={isLoading}
				>
					<FaCamera className="text-5xl" />
				</button>
			</div>

			{/* Session Info */}
			<div className="mb-4">
				<span className="font-semibold">Start Date:</span>{' '}
				{formatDate(selectedSession.startDate)}
			</div>
			<div className="mb-4">
				<span className="font-semibold">End Date:</span>{' '}
				{formatDate(selectedSession.endDate)}
			</div>

			<h3 className="text-lg font-semibold border-b border-gray-600 pb-2 mb-4">
				Schedule:
			</h3>
			<ul className="grid grid-cols-2 gap-4">
				{selectedSession.days.map((day, index) => (
					<li
						key={index}
						className="bg-neutral-700 text-white rounded-full py-2 px-4 text-center"
					>
						{day.day}: {day.startTime} - {day.endTime}
					</li>
				))}
			</ul>

			{/* Buttons */}
			<div className="flex justify-between mt-6">
				<div className="space-x-4">
					<button
						onClick={GenerateLink}
						className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
					>
						Add Participants
					</button>
					<button
						onClick={fetchAttendanceTable}
						className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
						disabled={isAttendanceLoading}
					>
						{isAttendanceLoading ? 'Loading...' : 'View Attendance'}
					</button>
				</div>
				<div className="space-x-4">
					<button
						onClick={onEdit}
						className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
					>
						Update
					</button>
					<button
						onClick={onDelete}
						className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
					>
						Delete
					</button>
				</div>
			</div>

			{/* Recognition Overlay */}
			{showOverlay && (
				<FacialRecognitionOverlay
					sessionId={selectedSession.id}
					sessionName={selectedSession.name}
					onClose={() => setShowOverlay(false)}
				/>
			)}

			{/* Attendance Records */}
			{showAttendance && (
				<div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-70 z-50">
					<div className="relative bg-grey-900 text-white p-6 rounded shadow-lg w-3/4 h-3/4 overflow-y-auto">
						<h2 className="text-2xl font-bold mb-4 text-center">
							{selectedSession.name}
						</h2>
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse table-fixed">
								<thead>
									<tr>
										{attendanceTable.columns.map((col, index) => (
											<th
												key={index}
												className="border-b p-2 text-center bg-grey-800 sticky top-0"
												style={{ minWidth: '120px' }}
											>
												{col}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{attendanceTable.data.length > 0 ? (
										attendanceTable.data.map((row, rowIndex) => (
											<tr key={rowIndex}>
												{attendanceTable.columns.map((col, colIndex) => (
													<td
														key={colIndex}
														className="border-b p-2 text-center"
														style={{ minWidth: '120px' }}
													>
														{row[col] || '-'}
													</td>
												))}
											</tr>
										))
									) : (
										<tr>
											<td
												colSpan={attendanceTable.columns.length}
												className="text-center py-4"
											>
												No attendance records found.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
						<div className="absolute bottom-4 right-4 flex space-x-4">
							<button
								onClick={DownloadExcel}
								className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
							>
								Download
							</button>
							<button
								onClick={() => setShowAttendance(false)}
								className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
