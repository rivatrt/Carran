import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Config from './components/Config';
import { checkAuth } from './api';

function App() {
  const [tab, setTab] = useState('chat');
  const [apiKey, setApiKey] = useState(localStorage.getItem('api_key') || '');
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    if (apiKey) {
      checkAuth().then(setIsAuthed).catch(() => setIsAuthed(false));
    }
  }, [apiKey]);

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem('api_key', apiKey);
    checkAuth().then(setIsAuthed).catch(() => {
        setIsAuthed(false);
        alert("Invalid API Key");
    });
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Manus AI Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your API Key"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
            >
              Login
            </button>
            <p className="text-xs text-gray-500 text-center">
              Check the terminal where you started the backend to find your API Key.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Manus AI Clone</h1>
        <nav className="space-x-4">
          <button
            onClick={() => setTab('chat')}
            className={`px-3 py-1 rounded ${tab === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
          >
            Chat
          </button>
          <button
            onClick={() => setTab('config')}
            className={`px-3 py-1 rounded ${tab === 'config' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
          >
            Settings
          </button>
          <button
            onClick={() => { localStorage.removeItem('api_key'); setIsAuthed(false); }}
            className="text-red-500 text-sm"
          >
            Logout
          </button>
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">
        {tab === 'chat' ? <Chat /> : <Config />}
      </main>
    </div>
  );
}

export default App;
