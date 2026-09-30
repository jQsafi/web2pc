import axios from 'axios';

// You can override the port or base URL via environment variables (.env)
// Example: VITE_API_PORT=5002 or VITE_API_URL=http://localhost:5001/api
const API_PORT = import.meta.env.VITE_API_PORT || 5001;
const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:${API_PORT}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const pin = localStorage.getItem('web2pc-pin');
  if (pin) {
    config.headers['x-pin'] = pin;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('web2pc-pin');
      window.location.reload(); // Reload to show login screen
    }
    return Promise.reject(error);
  }
);

export const systemSleep = () => api.post('/system/sleep');
export const systemLock = () => api.post('/system/lock');

export const volUp = () => api.post('/volume/up');
export const volDown = () => api.post('/volume/down');
export const volMute = () => api.post('/volume/mute');

export const mediaPlayPause = () => api.post('/media/playpause');
export const mediaNext = () => api.post('/media/next');
export const mediaPrev = () => api.post('/media/prev');

export const searchApps = (q) => api.get(`/apps/search?q=${q}`);
export const launchApp = (appPath) => api.post('/apps/launch', { appPath });
export const closeApp = (appName) => api.post('/apps/close', { appName });

export const runTerminal = (command) => api.post('/terminal/run', { command });

export const mouseMove = (dx, dy) => api.post('/mouse/move', { dx, dy });
export const mouseScroll = (dx, dy) => api.post('/mouse/scroll', { dx, dy });
export const mouseClick = (button = 'left', double = false) => api.post('/mouse/click', { button, double });
export const keyboardType = (text, key) => api.post('/keyboard/type', { text, key });

export default api;
