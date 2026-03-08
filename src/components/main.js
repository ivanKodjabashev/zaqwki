import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './main.css';

function Main({ selectedQuery }) {
	const [rows, setRows] = useState([]);
	const [isRowsLoaded, setIsRowsLoaded] = useState(false);
	const [loadedQueryKey, setLoadedQueryKey] = useState(null);
	const [isDeleteMode, setIsDeleteMode] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [selectedRowId, setSelectedRowId] = useState(null);
	const [editingRowId, setEditingRowId] = useState(null);
	const [editName, setEditName] = useState('');
	const [editQuantity, setEditQuantity] = useState('0');

	const handleAddRow = () => {
		const nextId = rows.length > 0 ? rows[rows.length - 1].id + 1 : 1;
		setRows([
			...rows,
			{
				id: nextId,
				name: `Нов артикул ${nextId}`,
				quantity: 0,
				done: false,
			},
		]);
	};

	const handleToggleDeleteMode = () => {
		setIsDeleteMode((prev) => !prev);
		setIsEditMode(false);
		setSelectedRowId(null);
		setEditingRowId(null);
	};

	const handleToggleEditMode = () => {
		setIsEditMode((prev) => !prev);
		setIsDeleteMode(false);
		setSelectedRowId(null);
		setEditingRowId(null);
	};

	const handleSelectRow = (id) => {
		if (!isDeleteMode) {
			return;
		}
		setSelectedRowId(id);
	};

	const handleDeleteSelectedRow = (id) => {
		setRows((prevRows) => prevRows.filter((row) => row.id !== id));
		setSelectedRowId(null);
		setIsDeleteMode(false);
	};

	const handleStartEditRow = (row) => {
		setEditingRowId(row.id);
		setEditName(row.name);
		setEditQuantity(String(row.quantity));
	};

	const handleCancelEdit = () => {
		setEditingRowId(null);
		setEditName('');
		setEditQuantity('0');
	};

	const handleSaveEdit = (id) => {
		const parsedQuantity = Number(editQuantity);

		if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
			return;
		}

		setRows((prevRows) =>
			prevRows.map((row) =>
				row.id === id
					? {
							...row,
							name: editName.trim() || row.name,
							quantity: parsedQuantity,
					  }
					: row
			)
		);

		handleCancelEdit();
	};

	const handleToggleDone = (id) => {
		setRows(
			rows.map((row) =>
				row.id === id ? { ...row, done: !row.done } : row
			)
		);
	};

	const handlePrint = () => {
		const tableElement = document.getElementById('inventoryTable');

		if (!tableElement) {
			return;
		}

		const printWindow = window.open('', '_blank', 'width=900,height=700');
		if (!printWindow) {
			return;
		}

		printWindow.document.write(`
			<!DOCTYPE html>
			<html lang="bg">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Print Table</title>
				<style>
					body {
						font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
						margin: 24px;
					}
					table {
						width: 100%;
						border-collapse: collapse;
					}
					th,
					td {
						padding: 12px;
						text-align: left;
						border: 1px solid #d7dee7;
					}
					th {
						background: #f1f5f9;
					}
					.done-btn,
					.row-delete-btn,
					.row-edit-btn,
					.row-save-btn,
					.row-cancel-btn,
					.row-delete-placeholder,
					.edit-input {
						display: none !important;
					}
				</style>
			</head>
			<body>
				${tableElement.outerHTML}
			</body>
			</html>
		`);

		printWindow.document.close();
		printWindow.focus();
		printWindow.print();
		printWindow.close();
	};

	useEffect(() => {
		setRows([]);
		setIsRowsLoaded(false);
		setLoadedQueryKey(null);
		setIsDeleteMode(false);
		setIsEditMode(false);
		setSelectedRowId(null);
		setEditingRowId(null);

		if (!selectedQuery) {
			setIsRowsLoaded(true);
			setLoadedQueryKey(null);
			return;
		}

		const queryDocId = selectedQuery.fileKey || `legacy_${selectedQuery.id}`;
		const queryDocRef = doc(db, 'appData', `queryFile_${queryDocId}`);

		const loadRows = async () => {
			try {
				const snapshot = await getDoc(queryDocRef);
				if (snapshot.exists()) {
					const data = snapshot.data();
					if (Array.isArray(data.rows)) {
						setRows(data.rows);
					}
				}
			} catch (error) {
				console.error('Failed to load query rows:', error);
			} finally {
				setIsRowsLoaded(true);
				setLoadedQueryKey(queryDocId);
			}
		};

		loadRows();
	}, [selectedQuery]);

	useEffect(() => {
		if (!selectedQuery || !isRowsLoaded) {
			return;
		}

		const queryDocId = selectedQuery.fileKey || `legacy_${selectedQuery.id}`;

		if (loadedQueryKey !== queryDocId) {
			return;
		}

		const queryDocRef = doc(db, 'appData', `queryFile_${queryDocId}`);

		const saveRows = async () => {
			try {
				await setDoc(
					queryDocRef,
					{
						queryId: selectedQuery.id,
						fileKey: selectedQuery.fileKey || null,
						queryName: selectedQuery.name,
						rows,
					},
					{ merge: true }
				);
			} catch (error) {
				console.error('Failed to save query rows:', error);
			}
		};

		saveRows();
	}, [rows, isRowsLoaded, selectedQuery, loadedQueryKey]);

	if (!selectedQuery) {
		return (
			<main className="inventory-page">
				<p className="empty-query-hint">
					Избери или създай нова заявка отляво, за да започнеш да пишеш.
				</p>
			</main>
		);
	}

	return (
		<main className="inventory-page">
			<div className="controls">
				<button type="button" className="btn btn-add" onClick={handleAddRow}>
					Добави ред
				</button>
				<button
					type="button"
					className={`btn btn-edit ${isEditMode ? 'is-active' : ''}`}
					onClick={handleToggleEditMode}
				>
					{isEditMode ? 'Откажи редакция' : 'Edit'}
				</button>
				<button
					type="button"
					className={`btn btn-remove ${isDeleteMode ? 'is-active' : ''}`}
					onClick={handleToggleDeleteMode}
				>
					{isDeleteMode ? 'Откажи изтриване' : 'Изтрий ред'}
				</button>
				<button type="button" className="btn btn-print" onClick={handlePrint}>
					Принтирай таблица
				</button>
			</div>

			{isDeleteMode && (
				<p className="delete-mode-hint">
					Избери ред от таблицата, след което натисни "Изтрий" отдясно.
				</p>
			)}

			{isEditMode && (
				<p className="edit-mode-hint">
					Натисни "Редактирай" на желания ред, промени име и брой, после запази.
				</p>
			)}

			<table id="inventoryTable">
				<thead>
					<tr>
						<th className="number-col">Номер</th>
						<th className="name-col">Име</th>
						<th className="count-col">Брой</th>
						<th className="status-col">Статус</th>
						{(isDeleteMode || isEditMode) && (
							<th className="action-col">Действие</th>
						)}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr
							key={row.id}
							onClick={() => handleSelectRow(row.id)}
							className={
								isDeleteMode && selectedRowId === row.id ? 'selected-row' : ''
							}
						>
							<td>{row.id}</td>
							<td>
								{isEditMode && editingRowId === row.id ? (
									<input
										type="text"
										className="edit-input"
										value={editName}
										onChange={(event) => setEditName(event.target.value)}
									/>
								) : (
									row.name
								)}
							</td>
							<td>
								{isEditMode && editingRowId === row.id ? (
									<input
										type="number"
										min="0"
										className="edit-input edit-qty-input"
										value={editQuantity}
										onChange={(event) => setEditQuantity(event.target.value)}
									/>
								) : (
									row.quantity
								)}
							</td>
							<td>
								<button
									type="button"
									className={`done-btn ${row.done ? 'is-done' : ''}`}
									onClick={() => handleToggleDone(row.id)}
									aria-label="Маркирай статус"
								>
									✓
								</button>
							</td>
							{isEditMode && (
								<td>
									{editingRowId === row.id ? (
										<div className="edit-actions">
											<button
												type="button"
												className="row-save-btn"
												onClick={(event) => {
													event.stopPropagation();
													handleSaveEdit(row.id);
												}}
											>
												Запази
											</button>
											<button
												type="button"
												className="row-cancel-btn"
												onClick={(event) => {
													event.stopPropagation();
													handleCancelEdit();
												}}
											>
												Откажи
											</button>
										</div>
									) : (
										<button
											type="button"
											className="row-edit-btn"
											onClick={(event) => {
												event.stopPropagation();
												handleStartEditRow(row);
											}}
										>
											Редактирай
										</button>
									)}
								</td>
							)}
							{isDeleteMode && (
								<td>
									{selectedRowId === row.id ? (
										<button
											type="button"
											className="row-delete-btn"
											onClick={(event) => {
												event.stopPropagation();
												handleDeleteSelectedRow(row.id);
											}}
										>
											Изтрий
										</button>
									) : (
										<span className="row-delete-placeholder">Избери ред</span>
									)}
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</main>
	);
}

export default Main;
