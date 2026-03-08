import { useState } from 'react';
import './App.css';
import Main from './components/main';
import QueryExplorer from './components/QueryExplorer';

function App() {
  const [selectedQuery, setSelectedQuery] = useState(null);

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
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
