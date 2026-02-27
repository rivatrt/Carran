const API_BASE = "/api";

const getHeaders = () => {
  const apiKey = localStorage.getItem("api_key") || "";
  return {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  };
};

export const getMessages = async () => {
  return JSON.parse(localStorage.getItem("chat_history") || "[]");
};

export const saveMessages = (messages) => {
  localStorage.setItem("chat_history", JSON.stringify(messages));
};

export const sendMessage = async (messages) => {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(messages),
  });
  if (response.status === 401) throw new Error("Unauthorized");
  return response.json();
};

export const getConfig = async () => {
  const response = await fetch(`${API_BASE}/config`, {
    headers: getHeaders(),
  });
  if (response.status === 401) throw new Error("Unauthorized");
  return response.json();
};

export const updateConfig = async (config) => {
  const response = await fetch(`${API_BASE}/config`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(config),
  });
  if (response.status === 401) throw new Error("Unauthorized");
  return response.json();
};

export const getStatus = async () => {
  const response = await fetch(`${API_BASE}/status`);
  return response.json();
};

export const checkAuth = async () => {
  const response = await fetch(`${API_BASE}/auth-check`, {
    headers: getHeaders(),
  });
  return response.status === 200;
};
