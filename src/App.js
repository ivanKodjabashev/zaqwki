import { useEffect, useState } from 'react';
import './App.css';
import AuthForm from './components/AuthForm';
import Main from './components/main';
import QueryExplorer from './components/QueryExplorer';
import { signOutUser, subscribeToAuthChanges } from './firebase';

function App() {
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [authUser, setAuthUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setAuthUser(user);
      setSelectedQuery(null);
    });

    return unsubscribe;
  }, []);

  if (authUser === undefined) {
    return (
      <div className="auth-shell auth-shell-loading">
        <p className="auth-loading-text">Проверка на сесията...</p>
      </div>
    );
  }

  if (!authUser) {
    return <AuthForm />;
  }

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-session-bar">
          <div>
            <p className="app-session-label">Профил</p>
            <p className="app-session-email">{authUser.email}</p>
          </div>
          <button
            type="button"
            className="app-signout-btn"
            onClick={signOutUser}
          >
            Изход
          </button>
        </div>
        <QueryExplorer onSelectQuery={setSelectedQuery} />
      </aside>
      <main className="app-main">
        <h1 className="app-main-title">
          {selectedQuery ? `Заявка: ${selectedQuery.name}` : 'Заявката'}
        </h1>
        <Main selectedQuery={selectedQuery} />
      </main>
    </div>
  );
}

export default App;
