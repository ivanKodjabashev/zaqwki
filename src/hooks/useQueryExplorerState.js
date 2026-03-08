import { useCallback, useEffect, useState } from 'react';
import {
  createFileKey,
  deleteQueryFileData,
  loadExplorerState,
  normalizeFolders,
  saveExplorerState,
} from '../services/queryDataService';

export const useQueryExplorerState = (onSelectQuery) => {
  const [folders, setFolders] = useState([]);
  const [openFolders, setOpenFolders] = useState({});
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

      deleteQueryFileData(selected).catch((error) => {
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

      const deletions = folderToDelete.items.map((item) => deleteQueryFileData(item));

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

      setFolders((prev) =>
        prev.map((folder) => {
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
            items: [...folder.items, newItem],
          };
        })
      );

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
        const data = await loadExplorerState();
        if (data) {
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
        await saveExplorerState({
          folders,
          openFolders,
          activeFolderName,
          activeQueryKey,
        });
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

  return {
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
  };
};
