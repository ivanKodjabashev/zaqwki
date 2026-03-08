import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const queryExplorerDocRef = doc(db, 'appData', 'queryExplorer');

export const createFileKey = () =>
  `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const normalizeFolders = (sourceFolders) =>
  sourceFolders.map((folder, folderIndex) => ({
    ...folder,
    items: (folder.items || []).map((item, itemIndex) => ({
      ...item,
      fileKey:
        item.fileKey ||
        `legacy_${folderIndex}_${itemIndex}_${String(item.id || itemIndex)}`,
    })),
  }));

export const getQueryDocId = (item) =>
  `queryFile_${item.fileKey || `legacy_${item.id}`}`;

export const loadExplorerState = async () => {
  const snapshot = await getDoc(queryExplorerDocRef);
  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
};

export const saveExplorerState = async ({
  folders,
  openFolders,
  activeFolderName,
  activeQueryKey,
}) => {
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
};

export const deleteQueryFileData = async (item) => {
  await deleteDoc(doc(db, 'appData', getQueryDocId(item)));
};

export const loadQueryRows = async (selectedQuery) => {
  const queryDocId = selectedQuery.fileKey || `legacy_${selectedQuery.id}`;
  const queryDocRef = doc(db, 'appData', `queryFile_${queryDocId}`);
  const snapshot = await getDoc(queryDocRef);

  if (!snapshot.exists()) {
    return { queryDocId, rows: [] };
  }

  const data = snapshot.data();
  return {
    queryDocId,
    rows: Array.isArray(data.rows) ? data.rows : [],
  };
};

export const saveQueryRows = async ({ selectedQuery, rows }) => {
  const queryDocId = selectedQuery.fileKey || `legacy_${selectedQuery.id}`;
  const queryDocRef = doc(db, 'appData', `queryFile_${queryDocId}`);

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

  return queryDocId;
};
