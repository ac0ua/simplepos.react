// API Configuration
// Use window.location.hostname to support both localhost and network access

export const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const port = 5000;
  return `http://${hostname}:${port}`;
};

export const API_BASE_URL = getApiBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;
