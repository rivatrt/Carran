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
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 font-sans">
        <div className="bg-[#121212] p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-[#222222]">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
              <span className="text-white text-4xl font-bold">M</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Manus AI</h1>
            <p className="text-gray-500 mt-2">Sign in to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#1e1e1e] text-white border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600"
                placeholder="Access Key"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg"
            >
              Sign In
            </button>
            <p className="text-xs text-gray-600 text-center">
              Check your Termux console for the key.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans">
      <header className="px-6 py-6 flex justify-between items-center bg-[#000000]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold">M</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Manus AI</h1>
        </div>
        <nav className="bg-[#121212] p-1.5 rounded-[1.5rem] flex space-x-1 border border-[#222222]">
          <button
            onClick={() => setTab('chat')}
            className={`px-6 py-2 rounded-[1.2rem] text-sm font-semibold transition-all ${tab === 'chat' ? 'bg-[#2563eb] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Chat
          </button>
          <button
            onClick={() => setTab('config')}
            className={`px-6 py-2 rounded-[1.2rem] text-sm font-semibold transition-all ${tab === 'config' ? 'bg-[#2563eb] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Settings
          </button>
        </nav>
        <button
          onClick={() => { localStorage.removeItem('api_key'); setIsAuthed(false); }}
          className="w-10 h-10 bg-[#121212] rounded-2xl flex items-center justify-center border border-[#222222] hover:bg-red-900/20 transition-colors group"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto w-full">
        {tab === 'chat' ? <Chat /> : <Config />}
      </main>
    </div>
  );
}

export default App;
