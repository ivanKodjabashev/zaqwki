import { useEffect, useState } from 'react';
import { loadQueryRows, saveQueryRows } from '../services/queryDataService';
import { printTableOnly } from '../utils/printTableOnly';

export const useMainRows = (selectedQuery) => {
  const [rows, setRows] = useState([]);
  const [isRowsLoaded, setIsRowsLoaded] = useState(false);
  const [loadedQueryKey, setLoadedQueryKey] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('0');
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [newRowName, setNewRowName] = useState('');
  const [newRowQuantity, setNewRowQuantity] = useState('0');

  const handleAddRow = () => {
    setIsCreatingRow(true);
    setNewRowName('');
    setNewRowQuantity('0');
    setIsDeleteMode(false);
    setIsEditMode(false);
    setSelectedRowId(null);
    setEditingRowId(null);
  };

  const handleCancelCreateRow = () => {
    setIsCreatingRow(false);
    setNewRowName('');
    setNewRowQuantity('0');
  };

  const handleSaveNewRow = () => {
    const parsedQuantity = Number(newRowQuantity);
    const trimmedName = newRowName.trim();

    if (!trimmedName || Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      return;
    }

    const nextId = rows.length > 0 ? Math.max(...rows.map((row) => row.id)) + 1 : 1;
    setRows((prevRows) => [
      ...prevRows,
      {
        id: nextId,
        name: trimmedName,
        quantity: parsedQuantity,
        done: false,
      },
    ]);

    handleCancelCreateRow();
  };

  const handleCreateRowKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSaveNewRow();
    }

    if (event.key === 'Escape') {
      handleCancelCreateRow();
    }
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
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, done: !row.done } : row
      )
    );
  };

  const handlePrint = () => {
    printTableOnly('inventoryTable');
  };

  useEffect(() => {
    setRows([]);
    setIsRowsLoaded(false);
    setLoadedQueryKey(null);
    setIsDeleteMode(false);
    setIsEditMode(false);
    setSelectedRowId(null);
    setEditingRowId(null);
    setIsCreatingRow(false);
    setNewRowName('');
    setNewRowQuantity('0');

    if (!selectedQuery) {
      setIsRowsLoaded(true);
      setLoadedQueryKey(null);
      return;
    }

    const loadRows = async () => {
      try {
        const { queryDocId, rows: loadedRows } = await loadQueryRows(selectedQuery);
        setRows(loadedRows);
        setLoadedQueryKey(queryDocId);
      } catch (error) {
        console.error('Failed to load query rows:', error);
      } finally {
        setIsRowsLoaded(true);
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

    const saveRows = async () => {
      try {
        await saveQueryRows({ selectedQuery, rows });
      } catch (error) {
        console.error('Failed to save query rows:', error);
      }
    };

    saveRows();
  }, [rows, isRowsLoaded, selectedQuery, loadedQueryKey]);

  return {
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
  };
};
