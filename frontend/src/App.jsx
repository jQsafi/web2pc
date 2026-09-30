import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1, 
  Power, Lock, Search, Terminal, MousePointer2, Keyboard 
} from 'lucide-react';
import * as api from './api';
import './App.css';

function App() {
  const [appSearch, setAppSearch] = useState('');
  const [apps, setApps] = useState([]);
  
  const [cmd, setCmd] = useState('');
  const [termOut, setTermOut] = useState('');

  const [keyboardInput, setKeyboardInput] = useState('');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('web2pc-pin'));
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pin = params.get('pin');
    if (pin) {
      localStorage.setItem('web2pc-pin', pin);
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = () => {
    if (pinInput.length === 4) {
      localStorage.setItem('web2pc-pin', pinInput);
      setIsAuthenticated(true);
    }
  };

  // Trackpad State
  const prevPos = useRef({ x: 0, y: 0 });
  const tpState = useRef({ touches: 0, moved: false });

  const handleSearchApp = async () => {
    if (!appSearch) return;
    const res = await api.searchApps(appSearch);
    setApps(res.data.apps || []);
  };

  const handleLaunch = async (path) => {
    await api.launchApp(path);
  };

  const handleCloseApp = async (name) => {
    await api.closeApp(name);
  };

  const runTerminal = async () => {
    if (!cmd) return;
    setTermOut('Running...');
    try {
      const res = await api.runTerminal(cmd);
      setTermOut(res.data.output || 'Success (No Output)');
    } catch (e) {
      setTermOut(e.response?.data?.error || e.message);
    }
  };

  const handleTouchStart = (e) => {
    tpState.current.touches = e.touches.length;
    tpState.current.moved = false;
    prevPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e) => {
    tpState.current.moved = true;
    const touch = e.touches[0];
    const dx = touch.clientX - prevPos.current.x;
    const dy = touch.clientY - prevPos.current.y;
    
    if (e.touches.length === 2) {
      api.mouseScroll(Math.round(dx * 1.5), Math.round(dy * 1.5));
    } else {
      api.mouseMove(Math.round(dx * 2), Math.round(dy * 2));
    }
    
    prevPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    if (!tpState.current.moved) {
      if (tpState.current.touches === 2) {
        api.mouseClick('right');
      } else if (tpState.current.touches === 1) {
        api.mouseClick('left');
      }
    }
    tpState.current.touches = 0;
  };

  const handleKeyboardType = async () => {
    if (!keyboardInput) return;
    await api.keyboardType(keyboardInput).catch(() => {
      // If we get an error, likely 401, logout
      localStorage.removeItem('web2pc-pin');
      setIsAuthenticated(false);
    });
    setKeyboardInput('');
  };

  if (!isAuthenticated) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gridTemplateColumns: '1fr' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h2 className="panel-title"><Lock size={20} /> Enter PIN</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Check your PC terminal for the 4-digit PIN or scan the QR code.</p>
          <input 
            type="password" 
            placeholder="0000" 
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
            style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5rem', marginBottom: '1rem', width: '100%' }}
            maxLength={4}
          />
          <button className="btn primary" onClick={handleLogin} style={{ width: '100%' }}>Connect</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      
      {/* Media & Volume */}
      <div className="glass-panel">
        <h2 className="panel-title"><Volume2 size={20} /> Media & Volume</h2>
        
        <div className="btn-grid">
          <button className="btn" onClick={api.mediaPrev}><SkipBack size={20} /> Prev</button>
          <button className="btn primary" onClick={api.mediaPlayPause}><Play size={16} /><Pause size={16} /></button>
          <button className="btn" onClick={api.mediaNext}><SkipForward size={20} /> Next</button>
          
          <button className="btn" onClick={api.volDown}><Volume1 size={20} /> Vol -</button>
          <button className="btn" onClick={api.volMute}><VolumeX size={20} /> Mute</button>
          <button className="btn" onClick={api.volUp}><Volume2 size={20} /> Vol +</button>
        </div>
      </div>

      {/* System Power */}
      <div className="glass-panel">
        <h2 className="panel-title"><Power size={20} /> System Power</h2>
        <div className="btn-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button className="btn" onClick={api.systemLock}><Lock size={20} /> Lock Screen</button>
          <button className="btn danger" onClick={api.systemSleep}><Power size={20} /> Sleep PC</button>
        </div>
      </div>

      {/* Trackpad & Keyboard */}
      <div className="glass-panel">
        <h2 className="panel-title"><MousePointer2 size={20} /> Trackpad & Keyboard</h2>
        <div 
          className="trackpad-area"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          Drag (1 finger = move, 2 = scroll). Tap (1 = left click, 2 = right)
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="Type on PC..." 
            value={keyboardInput}
            onChange={(e) => setKeyboardInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleKeyboardType() }}
          />
          <button className="btn primary" onClick={handleKeyboardType}><Keyboard size={20}/></button>
        </div>
      </div>

      {/* Application Control */}
      <div className="glass-panel">
        <h2 className="panel-title"><Search size={20} /> Applications</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input 
            type="text" 
            placeholder="Search apps (e.g., Spotify)..." 
            value={appSearch}
            onChange={(e) => setAppSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchApp() }}
          />
          <button className="btn primary" onClick={handleSearchApp}>Search</button>
        </div>
        
        <div className="app-list">
          {apps.map((app, idx) => (
            <div key={idx} className="app-item">
              <span>{app.name}</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button className="btn primary" onClick={() => handleLaunch(app.path)}>Launch</button>
                <button className="btn danger" onClick={() => handleCloseApp(app.name)}>Close</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal */}
      <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
        <h2 className="panel-title"><Terminal size={20} /> Remote Terminal</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input 
            type="text" 
            placeholder="Enter shell command (e.g., ls -la)..." 
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runTerminal() }}
          />
          <button className="btn primary" onClick={runTerminal}>Run</button>
        </div>
        
        <div className="terminal-output">
          {termOut || '> Output will appear here...'}
        </div>
      </div>

    </div>
  );
}

export default App;
