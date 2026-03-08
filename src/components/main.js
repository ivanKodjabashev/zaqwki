import { useMainRows } from '../hooks/useMainRows';
import './main.css';

function Main({ selectedQuery }) {
	const {
		rows,
		isDeleteMode,
		isEditMode,
		selectedRowId,
		editingRowId,
		editName,
		editQuantity,
		isCreatingRow,
		newRowName,
		newRowQuantity,
		setEditName,
		setEditQuantity,
		setNewRowName,
		setNewRowQuantity,
		handleAddRow,
		handleCancelCreateRow,
		handleSaveNewRow,
		handleCreateRowKeyDown,
		handleToggleDeleteMode,
		handleToggleEditMode,
		handleSelectRow,
		handleDeleteSelectedRow,
		handleStartEditRow,
		handleCancelEdit,
		handleSaveEdit,
		handleToggleDone,
		handlePrint,
	} = useMainRows(selectedQuery);

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
					{isCreatingRow ? 'Добавяне...' : 'Добави ред'}
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

			{isCreatingRow && (
				<div className="create-row-panel">
					<input
						type="text"
						className="edit-input"
						placeholder="Име на артикул"
						value={newRowName}
						onChange={(event) => setNewRowName(event.target.value)}
						onKeyDown={handleCreateRowKeyDown}
						autoFocus
					/>
					<input
						type="number"
						min="0"
						className="edit-input edit-qty-input"
						placeholder="Брой"
						value={newRowQuantity}
						onChange={(event) => setNewRowQuantity(event.target.value)}
						onKeyDown={handleCreateRowKeyDown}
					/>
					<button
						type="button"
						className="row-save-btn"
						onClick={handleSaveNewRow}
					>
						Запази
					</button>
					<button
						type="button"
						className="row-cancel-btn"
						onClick={handleCancelCreateRow}
					>
						Отказ
					</button>
				</div>
			)}

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

			<div className="table-scroll">
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
			</div>
		</main>
	);
}

export default Main;
