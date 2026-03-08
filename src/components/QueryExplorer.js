import { useCallback, useEffect, useState } from 'react';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './queryExplorer.css';

const queryExplorerDocRef = doc(db, 'appData', 'queryExplorer');

const createFileKey = () =>
  `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const normalizeFolders = (sourceFolders) =>
  sourceFolders.map((folder, folderIndex) => ({
    ...folder,
    items: (folder.items || []).map((item, itemIndex) => ({
      ...item,
      fileKey:
        item.fileKey ||
        `legacy_${folderIndex}_${itemIndex}_${String(item.id || itemIndex)}`,
    })),
  }));

const getQueryDocId = (item) => `queryFile_${item.fileKey || `legacy_${item.id}`}`;

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

function QueryExplorer({ onSelectQuery }) {
  const [folders, setFolders] = useState([
  ]);
  const [openFolders, setOpenFolders] = useState({
  });
  const [activeFolderName, setActiveFolderName] = useState('');
  const [activeQueryKey, setActiveQueryKey] = useState(null);
  const [isExplorerLoaded, setIsExplorerLoaded] = useState(false);
  const [draft, setDraft] = useState({
    type: null,
    targetFolderName: '',
    value: '',
  });

  const getNextQueryId = (sourceFolders) => {
    const ids = sourceFolders.flatMap((folder) =>
      folder.items.map((item) => item.id)
    );
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  };

  const getUniqueFolderName = (sourceFolders, requestedName) => {
    const existing = new Set(sourceFolders.map((folder) => folder.name));

    if (!existing.has(requestedName)) {
      return requestedName;
    }

    let counter = 2;
    while (existing.has(`${requestedName} (${counter})`)) {
      counter += 1;
    }

    return `${requestedName} (${counter})`;
  };

  const handleSelectFolder = (folderName) => {
    setActiveQueryKey(null);
    setActiveFolderName(folderName);
    setOpenFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  const handleDeleteSelection = useCallback(() => {
    if (activeQueryKey) {
      const selected = folders
        .flatMap((folder) =>
          folder.items.map((item) => ({ ...item, folderName: folder.name }))
        )
        .find((item) => item.fileKey === activeQueryKey);

      if (!selected) {
        return;
      }

      setFolders((prev) =>
        prev.map((folder) => ({
          ...folder,
          items: folder.items.filter((item) => item.fileKey !== activeQueryKey),
        }))
      );
      setActiveQueryKey(null);

      deleteDoc(doc(db, 'appData', getQueryDocId(selected))).catch((error) => {
        console.error('Failed to delete query file:', error);
      });
      return;
    }

    if (activeFolderName) {
      const folderToDelete = folders.find((folder) => folder.name === activeFolderName);
      if (!folderToDelete) {
        return;
      }

      setFolders((prev) => prev.filter((folder) => folder.name !== activeFolderName));
      setOpenFolders((prev) => {
        const next = { ...prev };
        delete next[activeFolderName];
        return next;
      });
      setActiveFolderName('');
      setActiveQueryKey(null);

      const deletions = folderToDelete.items.map((item) =>
        deleteDoc(doc(db, 'appData', getQueryDocId(item)))
      );

      Promise.all(deletions).catch((error) => {
        console.error('Failed to delete one or more files from folder:', error);
      });
    }
  }, [activeQueryKey, activeFolderName, folders]);

  const handleToggleDone = (fileKey) => {
    setFolders((prev) => {
      let targetItem = null;
      let sourceFolderName = '';

      const withoutTarget = prev.map((folder) => {
        const remainingItems = [];

        folder.items.forEach((item) => {
          if (item.fileKey === fileKey) {
            targetItem = item;
            sourceFolderName = folder.name;
            return;
          }
          remainingItems.push(item);
        });

        return {
          ...folder,
          items: remainingItems,
        };
      });

      if (!targetItem) {
        return prev;
      }

      if (sourceFolderName === 'АКТИВНИ') {
        const doneItem = { ...targetItem, done: true };
        const archiveIndex = withoutTarget.findIndex(
          (folder) => folder.name === 'АРХИВ'
        );

        if (activeQueryKey === fileKey) {
          setActiveFolderName('АРХИВ');
        }

        if (archiveIndex === -1) {
          setOpenFolders((openPrev) => ({ ...openPrev, АРХИВ: true }));
          return [...withoutTarget, { name: 'АРХИВ', items: [doneItem] }];
        }

        return withoutTarget.map((folder, index) =>
          index === archiveIndex
            ? { ...folder, items: [...folder.items, doneItem] }
            : folder
        );
      }

      if (sourceFolderName === 'АРХИВ') {
        const activeItem = { ...targetItem, done: false };
        const activeIndex = withoutTarget.findIndex(
          (folder) => folder.name === 'АКТИВНИ'
        );

        if (activeQueryKey === fileKey) {
          setActiveFolderName('АКТИВНИ');
        }

        if (activeIndex === -1) {
          setOpenFolders((openPrev) => ({ ...openPrev, АКТИВНИ: true }));
          return [...withoutTarget, { name: 'АКТИВНИ', items: [activeItem] }];
        }

        return withoutTarget.map((folder, index) =>
          index === activeIndex
            ? { ...folder, items: [...folder.items, activeItem] }
            : folder
        );
      }

      return withoutTarget.map((folder) =>
        folder.name === sourceFolderName
          ? {
              ...folder,
              items: [...folder.items, { ...targetItem, done: !targetItem.done }],
            }
          : folder
      );
    });
  };

  const handleOpenQuery = (query) => {
    setActiveQueryKey(query.fileKey);
    if (query.folderName) {
      setActiveFolderName(query.folderName);
    }
  };

  const handleAddQuery = () => {
    const targetFolder = activeFolderName || folders[0]?.name;

    if (!targetFolder) {
      return;
    }

    setDraft({
      type: 'query',
      targetFolderName: targetFolder,
      value: '',
    });
    setOpenFolders((prev) => ({ ...prev, [targetFolder]: true }));
  };

  const handleAddFolder = () => {
    setDraft({
      type: 'folder',
      targetFolderName: '',
      value: '',
    });
  };

  const handleCancelDraft = () => {
    setDraft({
      type: null,
      targetFolderName: '',
      value: '',
    });
  };

  const handleSubmitDraft = () => {
    const rawName = draft.value.trim();

    if (!rawName) {
      return;
    }

    if (draft.type === 'query') {
      const nextId = getNextQueryId(folders);
      const newFileKey = createFileKey();

      setFolders((prev) => {
        return prev.map((folder) => {
          if (folder.name !== draft.targetFolderName) {
            return folder;
          }

          const newItem = {
            id: nextId,
            fileKey: newFileKey,
            name: rawName,
            count: 0,
            done: false,
          };

          return {
            ...folder,
            items: [
              ...folder.items,
              newItem,
            ],
          };
        });
      });

      setActiveQueryKey(newFileKey);
      setActiveFolderName(draft.targetFolderName);
    }

    if (draft.type === 'folder') {
      setFolders((prev) => {
        const uniqueName = getUniqueFolderName(prev, rawName);
        setOpenFolders((openPrev) => ({ ...openPrev, [uniqueName]: true }));
        setActiveFolderName(uniqueName);
        return [...prev, { name: uniqueName, items: [] }];
      });
    }

    handleCancelDraft();
  };

  const handleDraftKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSubmitDraft();
    }

    if (event.key === 'Escape') {
      handleCancelDraft();
    }
  };

  useEffect(() => {
    const loadExplorer = async () => {
      try {
        const snapshot = await getDoc(queryExplorerDocRef);
        if (snapshot.exists()) {
          const data = snapshot.data();

          if (Array.isArray(data.folders)) {
            setFolders(normalizeFolders(data.folders));
          }

          if (data.openFolders && typeof data.openFolders === 'object') {
            setOpenFolders(data.openFolders);
          }

          if (typeof data.activeFolderName === 'string' && data.activeFolderName) {
            setActiveFolderName(data.activeFolderName);
          }

          if (typeof data.activeQueryKey === 'string' && data.activeQueryKey) {
            setActiveQueryKey(data.activeQueryKey);
          }
        }
      } catch (error) {
        console.error('Failed to load query explorer:', error);
      } finally {
        setIsExplorerLoaded(true);
      }
    };

    loadExplorer();
  }, []);

  useEffect(() => {
    if (!isExplorerLoaded) {
      return;
    }

    const saveExplorer = async () => {
      try {
        await setDoc(
          queryExplorerDocRef,
          {
            folders,
            openFolders,
            activeFolderName,
            activeQueryKey,
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Failed to save query explorer:', error);
      }
    };

    saveExplorer();
  }, [folders, openFolders, activeFolderName, activeQueryKey, isExplorerLoaded]);

  useEffect(() => {
    if (!onSelectQuery) {
      return;
    }

    const foundQuery = folders
      .flatMap((folder) =>
        folder.items.map((item) => ({ ...item, folderName: folder.name }))
      )
      .find((item) => item.fileKey === activeQueryKey);

    onSelectQuery(foundQuery || null);
  }, [folders, activeQueryKey, onSelectQuery]);

  useEffect(() => {
    const handleKeyDelete = (event) => {
      const target = event.target;
      const isTypingTarget =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isTypingTarget) {
        return;
      }

      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }

      if (!activeQueryKey && !activeFolderName) {
        return;
      }

      event.preventDefault();
      handleDeleteSelection();
    };

    window.addEventListener('keydown', handleKeyDelete);
    return () => window.removeEventListener('keydown', handleKeyDelete);
  }, [activeQueryKey, activeFolderName, handleDeleteSelection]);

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
