import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [autoRemove, setAutoRemove] = useState(false);
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    chrome.storage?.local.get(['autoRemove'], (result) => {
      if (result.autoRemove) {
        setAutoRemove(true);
      }
    });

    pingTab();
  }, []);

  const pingTab = () => {
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) return;
        if (tabs[0].url?.startsWith("chrome://")) {
            setStatus("System Page");
        } else {
            setStatus("Ready");
        }
    });
  }

  const toggleAutoRemove = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAutoRemove(checked);
    chrome.storage?.local.set({ autoRemove: checked });
    if (checked) {
        sendMessage('REMOVE');
    }
  };

  const sendMessage = (action: string) => {
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      const id = tabs[0]?.id;
      if (id) {
        chrome.tabs.sendMessage(id, { action }).catch(err => {
            console.error(err);
            // "Receiving end does not exist" means content script isn't there
            if (err.message && err.message.includes("Receiving end does not exist")) {
                setStatus("Refresh Page Needed");
            } else {
                setStatus("Connection Error");
            }
        });
      }
    });
  };

  return (
    <div className="glass-card">
      <div className="header">
        <h1>Headless</h1>
        <div className={`status-badge ${autoRemove ? 'active' : ''}`}>
        {autoRemove ? 'Auto-Mode Active' : status}
        </div>
      </div>
      <div className="toggle-group">
        <label className="switch">
           <input type="checkbox" checked={autoRemove} onChange={toggleAutoRemove} />
           <span className="slider round"></span>
        </label>
        <span>Auto-Remove</span>
      </div>

      <button className="primary" onClick={() => sendMessage('REMOVE')}>
        Remove Header
      </button>

      <button onClick={() => sendMessage('RESTORE')}>
        Restore Header
      </button>
    </div>
  );
}

export default App;
