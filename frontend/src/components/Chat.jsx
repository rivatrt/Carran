import React, { useState, useEffect, useRef } from 'react';
import { getMessages, saveMessages } from '../api';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState(null); // 'thinking', 'executing', 'done'
  const [currentStep, setCurrentStep] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getMessages().then(setMessages);
  }, []);

  useEffect(() => {
    saveMessages(messages);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || status) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setStatus('thinking');
    setCurrentStep('Thinking...');

    try {
      const apiKey = localStorage.getItem('api_key');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(newMessages),
      });

      if (!response.ok) throw new Error('Failed to connect to server');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let currentMessages = [...newMessages];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.replace('data: ', ''));

            if (data.status === 'thinking') {
              setStatus('thinking');
              setCurrentStep('Analyzing...');
            } else if (data.status === 'thought') {
              assistantContent = data.content;
              setStatus('thought');
              setCurrentStep('Brainstorming...');
              // Update messages with the thought
              setMessages([...currentMessages, { role: 'assistant', content: assistantContent }]);
            } else if (data.status === 'executing') {
              setStatus('executing');
              setCurrentStep(`Executing: ${data.command}`);
            } else if (data.status === 'result') {
              const systemMsg = { role: 'system', content: data.output };
              currentMessages = [...currentMessages, { role: 'assistant', content: assistantContent }, systemMsg];
              setMessages(currentMessages);
              assistantContent = ''; // Reset for next loop
            } else if (data.status === 'done') {
              setStatus(null);
              setCurrentStep('');
            } else if (data.status === 'error') {
              setMessages([...currentMessages, { role: 'system', content: `Error: ${data.message}` }]);
              setStatus(null);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([...newMessages, { role: 'system', content: 'Connection error. Please check your API key and server status.' }]);
      setStatus(null);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 lg:p-6">
      <div className="flex-1 overflow-y-auto mb-6 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
            <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mb-6">
              <span className="text-white text-5xl font-bold">M</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
            <p className="max-w-xs">I'm your autonomous AI agent. I can write code, run commands, and solve problems.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] lg:max-w-[70%] rounded-[2rem] px-6 py-4 transition-all duration-300 ${
              m.role === 'user'
                ? 'bg-[#2563eb] text-white shadow-[0_4px_20px_rgba(37,99,235,0.2)] rounded-tr-sm'
                : m.role === 'system'
                ? 'bg-[#1a1a1a] text-blue-400 font-mono text-sm border border-[#222222] rounded-tl-sm'
                : 'bg-[#121212] text-gray-200 border border-[#222222] shadow-xl rounded-tl-sm'
            }`}>
              {m.role === 'system' && <div className="text-[10px] uppercase tracking-wider mb-2 opacity-50">Command Output</div>}
              <pre className="whitespace-pre-wrap font-sans leading-relaxed">{m.content}</pre>
            </div>
          </div>
        ))}

        {status && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-[#121212] border border-[#222222] rounded-[2rem] px-6 py-4 flex items-center space-x-4 shadow-2xl rounded-tl-sm">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm font-medium text-gray-400">{currentStep}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative group max-w-4xl mx-auto w-full">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-20 transition duration-500"></div>
        <div className="relative flex items-center bg-[#121212] border border-[#222222] rounded-[2.5rem] p-2 pr-4 shadow-2xl focus-within:border-blue-500/50 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent text-white px-6 py-3 focus:outline-none placeholder:text-gray-600"
            placeholder="Describe your goal..."
            disabled={status}
          />
          <button
            onClick={handleSend}
            disabled={status || !input.trim()}
            className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 transition-all shadow-lg transform active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex justify-center space-x-6 text-[10px] text-gray-600 uppercase tracking-[0.2em]">
          <span>Autonomous Mode</span>
          <span>•</span>
          <span>No API Keys Needed</span>
          <span>•</span>
          <span>Samsung AMOLED Style</span>
        </div>
      </div>
    </div>
  );
};

export default Chat;
