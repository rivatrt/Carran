import React, { useState, useEffect } from 'react';
import { getConfig, updateConfig, getStatus } from '../api';

const Config = () => {
  const [config, setConfig] = useState({
    telegram_token: '',
    ai_provider: 'PollinationsAI',
    allowed_user_ids: [],
    proxy: ''
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
      setMessage('Configuration saved successfully! Restart the server to apply changes to the Telegram bot.');
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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow mt-10 overflow-y-auto max-h-[85vh]">
      <h2 className="text-2xl font-bold mb-6">Configuration</h2>

      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="font-semibold mb-2">System Status</h3>
        <p>Backend: <span className="text-green-600">{status.status}</span></p>
        <p>Telegram Bot: <span className={status.bot_active ? 'text-green-600' : 'text-red-600'}>
          {status.bot_active ? 'Active' : 'Inactive'}
        </span></p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Telegram Bot Token</label>
          <input
            type="password"
            value={config.telegram_token}
            onChange={(e) => setConfig({ ...config, telegram_token: e.target.value })}
            className="mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your telegram bot token"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Telegram User IDs</label>
          <div className="flex space-x-2 mb-2">
            <input
              type="number"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              className="flex-1 border rounded-md px-3 py-2"
              placeholder="User ID (e.g. 12345678)"
            />
            <button onClick={addUser} className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.allowed_user_ids.map(id => (
              <span key={id} className="bg-gray-200 px-2 py-1 rounded flex items-center">
                {id}
                <button onClick={() => removeUser(id)} className="ml-2 text-red-500 font-bold">×</button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">AI Provider</label>
          <select
            value={config.ai_provider}
            onChange={(e) => setConfig({ ...config, ai_provider: e.target.value })}
            className="mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="PollinationsAI">PollinationsAI (Free, Fast)</option>
            <option value="Gemini">Gemini (Free Web Version)</option>
            <option value="ChatGPT">ChatGPT (Free Web Version)</option>
            <option value="Blackbox">Blackbox AI (Free)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Proxy (Optional)</label>
          <input
            type="text"
            value={config.proxy}
            onChange={(e) => setConfig({ ...config, proxy: e.target.value })}
            className="mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="http://user:pass@host:port"
          />
          <p className="text-xs text-gray-500 mt-1">Recommended for bypassing strict anti-bot detection.</p>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
        >
          Save Configuration
        </button>

        {message && (
          <div className={`p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Config;
