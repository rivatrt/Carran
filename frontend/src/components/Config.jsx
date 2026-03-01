import React, { useState, useEffect } from 'react';
import { getConfig, updateConfig, getStatus } from '../api';

const Config = ({ onLogout }) => {
  const [config, setConfig] = useState({
    telegram_token: '',
    ai_provider: 'PollinationsAI',
    allowed_user_ids: [],
    proxy: '',
    browser_cookies: '[]'
  });
  const [status, setStatus] = useState({ status: 'unknown', bot_active: false });
  const [message, setMessage] = useState('');
  const [newUserId, setNewUserId] = useState('');

  useEffect(() => {
    getConfig().then(setConfig);
    getStatus().then(setStatus);
  }, []);

  const handleSave = async () => {
    try {
      await updateConfig(config);
      setMessage('Configuration saved successfully!');
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage('Error saving configuration.');
    }
  };

  const addUser = () => {
    if (newUserId && !config.allowed_user_ids.includes(parseInt(newUserId))) {
      setConfig({
        ...config,
        allowed_user_ids: [...config.allowed_user_ids, parseInt(newUserId)]
      });
      setNewUserId('');
    }
  };

  const removeUser = (id) => {
    setConfig({
      ...config,
      allowed_user_ids: config.allowed_user_ids.filter(uid => uid !== id)
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-hide">
      <div className="max-w-3xl mx-auto space-y-8 pb-10">
        <header className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-gray-500 mt-2">Customize your Carran AI experience</p>
        </header>

        <section className="bg-[#121212] rounded-[2.5rem] p-8 border border-[#222222] shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></span>
            System Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] p-5 rounded-[1.5rem] border border-[#1a1a1a]">
              <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Backend Server</p>
              <p className="text-xl font-bold text-white capitalize">{status.status}</p>
            </div>
            <div className="bg-[#0a0a0a] p-5 rounded-[1.5rem] border border-[#1a1a1a]">
              <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Telegram Bot</p>
              <p className={`text-xl font-bold ${status.bot_active ? 'text-green-500' : 'text-red-500'}`}>
                {status.bot_active ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#121212] rounded-[2.5rem] p-8 border border-[#222222] shadow-xl space-y-8">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-3 ml-1">Telegram Bot Token</label>
            <input
              type="password"
              value={config.telegram_token}
              onChange={(e) => setConfig({ ...config, telegram_token: e.target.value })}
              className="w-full bg-[#0a0a0a] text-white border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-800"
              placeholder="123456789:ABCDEF..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-3 ml-1">Admin User IDs</label>
            <div className="flex space-x-3 mb-4">
              <input
                type="number"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="flex-1 bg-[#0a0a0a] text-white border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Telegram User ID"
              />
              <button onClick={addUser} className="bg-white text-black font-bold px-8 rounded-2xl hover:bg-gray-200 transition-all active:scale-95">Add</button>
            </div>
            <div className="flex flex-wrap gap-3">
              {config.allowed_user_ids.map(id => (
                <div key={id} className="bg-blue-600/10 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-xl flex items-center group">
                  <span className="font-mono text-sm">{id}</span>
                  <button onClick={() => removeUser(id)} className="ml-3 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              {config.allowed_user_ids.length === 0 && <p className="text-gray-700 text-sm italic ml-1">No admin users configured</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-3 ml-1">AI Engine Provider</label>
            <div className="relative">
              <select
                value={config.ai_provider}
                onChange={(e) => setConfig({ ...config, ai_provider: e.target.value })}
                className="w-full bg-[#0a0a0a] text-white border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="PollinationsAI">PollinationsAI (Free, Super Fast)</option>
                <option value="Gemini">Google Gemini (Advanced)</option>
                <option value="ChatGPT">OpenAI ChatGPT (Classic)</option>
                <option value="Blackbox">Blackbox AI (Coding Expert)</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-3 ml-1">Global Proxy (Optional)</label>
            <input
              type="text"
              value={config.proxy}
              onChange={(e) => setConfig({ ...config, proxy: e.target.value })}
              className="w-full bg-[#0a0a0a] text-white border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-800"
              placeholder="http://user:pass@host:port"
            />
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 text-white font-bold py-5 rounded-3xl hover:bg-blue-700 transition-all shadow-[0_10px_40px_rgba(37,99,235,0.3)] transform active:scale-[0.98]"
            >
              Save Changes
            </button>
          </div>

          {message && (
            <div className={`p-5 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 ${message.includes('Error') ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
              <p className="text-center font-semibold">{message}</p>
            </div>
          )}
        </section>

        <section className="bg-red-900/5 rounded-[2.5rem] p-8 border border-red-900/20 shadow-xl mt-8">
          <h3 className="text-lg font-bold text-red-500 mb-4">Danger Zone</h3>
          <p className="text-sm text-gray-500 mb-6">Disconnecting will remove your local access key. You will need to retrieve it from Termux to log back in.</p>
          <button
            onClick={onLogout}
            className="w-full bg-red-600/10 text-red-500 font-bold py-4 rounded-3xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-all active:scale-[0.98]"
          >
            Log Out & De-authorize
          </button>
        </section>

        <p className="text-center text-gray-700 text-xs py-10 uppercase tracking-[0.3em]">
          Version 1.6 Lite • Build 2026.1
        </p>
      </div>
    </div>
  );
};

export default Config;
