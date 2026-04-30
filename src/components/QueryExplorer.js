import React, { forwardRef, useImperativeHandle } from 'react';
import { useQueryExplorerState } from '../hooks/useQueryExplorerState';
import './queryExplorer.css';

function QueryRow({ item, isActive, onOpenQuery, onToggleDone }) {
  return (
    <div
      className={`query-item ${isActive ? 'is-active' : ''}`}
      onClick={() => onOpenQuery(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onOpenQuery(item);
        }
      }}
    >
      <span className="query-id">{String(item.id).padStart(2, '0')}</span>
      <span className="query-name">{item.name}</span>
      <span className="query-count">{item.count}</span>
      <button
        type="button"
        className={`check-btn ${item.done ? 'active' : ''}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleDone(item.fileKey);
        }}
        aria-label="Маркирай заявка"
      >
        ✓
      </button>
    </div>
  );
}

function FolderGroup({
  folder,
  isOpen,
  isActive,
  onSelectFolder,
  activeQueryKey,
  onOpenQuery,
  onToggleDone,
  isCreatingQuery,
  draftName,
  onDraftNameChange,
  onSubmitDraft,
  onCancelDraft,
}) {
  const handleDraftKeyDown = (event) => {
    if (event.key === 'Enter') {
      onSubmitDraft();
    }

    if (event.key === 'Escape') {
      onCancelDraft();
    }
  };

  return (
    <div className="folder-group">
      <button
        type="button"
        className={`folder-header ${isActive ? 'is-active' : ''}`}
        onClick={() => onSelectFolder(folder.name)}
      >
        {folder.name}
      </button>

      {isOpen && (
        <div>
          {folder.items.map((item) => (
            <QueryRow
              key={item.fileKey || item.id}
              item={item}
              isActive={activeQueryKey === item.fileKey}
              onOpenQuery={(query) =>
                onOpenQuery({ ...query, folderName: folder.name })
              }
              onToggleDone={onToggleDone}
            />
          ))}

          {isCreatingQuery && (
            <div className="create-row">
              <input
                type="text"
                className="create-input"
                placeholder="Име на заявка"
                value={draftName}
                onChange={(event) => onDraftNameChange(event.target.value)}
                onKeyDown={handleDraftKeyDown}
                autoFocus
              />
              <button
                type="button"
                className="mini-btn save"
                onClick={onSubmitDraft}
              >
                Запази
              </button>
              <button
                type="button"
                className="mini-btn cancel"
                onClick={onCancelDraft}
              >
                Отказ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const QueryExplorer = forwardRef(function QueryExplorer({ onSelectQuery }, ref) {
  const {
    folders,
    openFolders,
    activeFolderName,
    activeQueryKey,
    draft,
    setDraft,
    handleSelectFolder,
    handleToggleDone,
    handleOpenQuery,
    handleAddQuery,
    handleAddFolder,
    handleCancelDraft,
    handleSubmitDraft,
    handleDraftKeyDown,
    handleUpdateQueryCount,
  } = useQueryExplorerState(onSelectQuery);

  useImperativeHandle(ref, () => ({
    updateQueryCount: handleUpdateQueryCount,
  }), [handleUpdateQueryCount]);

  return (
    <section className="query-explorer-wrap" aria-label="Stark Query Explorer">
      <div className="explorer">
        <div className="explorer-header">
          <span>Заявки</span>
          <div className="actions">
            <button
              type="button"
              className="action-icon"
              title="Нова заявка"
              onClick={handleAddQuery}
            >
              +Q
            </button>
            <button
              type="button"
              className="action-icon"
              title="Нова папка"
              onClick={handleAddFolder}
            >
              +F
            </button>
          </div>
        </div>

        <div className="query-list">
          {folders.map((folder) => (
            <FolderGroup
              key={folder.name}
              folder={folder}
              isOpen={Boolean(openFolders[folder.name])}
              isActive={activeFolderName === folder.name}
              onSelectFolder={handleSelectFolder}
              activeQueryKey={activeQueryKey}
              onOpenQuery={handleOpenQuery}
              onToggleDone={handleToggleDone}
              isCreatingQuery={
                draft.type === 'query' && draft.targetFolderName === folder.name
              }
              draftName={draft.value}
              onDraftNameChange={(value) =>
                setDraft((prev) => ({ ...prev, value }))
              }
              onSubmitDraft={handleSubmitDraft}
              onCancelDraft={handleCancelDraft}
            />
          ))}

          {draft.type === 'folder' && (
            <div className="create-row create-folder-row">
              <input
                type="text"
                className="create-input"
                placeholder="Име на папка"
                value={draft.value}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, value: event.target.value }))
                }
                onKeyDown={handleDraftKeyDown}
                autoFocus
              />
              <button
                type="button"
                className="mini-btn save"
                onClick={handleSubmitDraft}
              >
                Запази
              </button>
              <button
                type="button"
                className="mini-btn cancel"
                onClick={handleCancelDraft}
              >
                Отказ
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default QueryExplorer;
