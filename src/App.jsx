import React, { useState, useEffect } from 'react';
import Scanner from './components/Scanner';
import PaletteView from './components/PaletteView';
import HistoryView from './components/HistoryView';
import Toast from './components/Toast';
import { parsePaletteText } from './utils/paletteParser';
import { QrCode, History, Palette } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('scan'); // 'scan', 'history', 'palette'
  const [activeData, setActiveData] = useState(null);
  const [history, setHistory] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('colorsync_history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error('Error al cargar historial:', e);
    }
  }, []);

  // Save history to localStorage when it changes
  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('colorsync_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error('Error al guardar historial:', e);
    }
  };

  const handleScanSuccess = (text) => {
    const parsed = parsePaletteText(text);
    if (!parsed) {
      triggerToast('Error: No se pudo leer el contenido.');
      return;
    }

    // Add to history
    const newHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...parsed
    };

    const updatedHistory = [newHistoryItem, ...history];
    saveHistory(updatedHistory);

    // Display the palette
    setActiveData(parsed);
    setActiveTab('palette');
    triggerToast('¡Código QR escaneado con éxito!');
  };

  const handleSelectHistoryItem = (item) => {
    setActiveData(item);
    setActiveTab('palette');
  };

  const handleDeleteHistoryItem = (id) => {
    const updatedHistory = history.filter(item => item.id !== id);
    saveHistory(updatedHistory);
    triggerToast('Elemento eliminado del historial');
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Seguro que quieres borrar todo tu historial?')) {
      saveHistory([]);
      triggerToast('Historial borrado');
    }
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon-wrapper">
            <Palette size={22} className="logo-icon" />
          </div>
          <div>
            <h1>ColorSync <span className="text-gradient">QR</span></h1>
            <p className="app-tagline">De PC a Teléfono al instante</p>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="app-main-content">
        {activeTab === 'scan' && (
          <Scanner 
            onScanSuccess={handleScanSuccess} 
          />
        )}

        {activeTab === 'history' && (
          <HistoryView 
            history={history}
            onSelectHistoryItem={handleSelectHistoryItem}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
            onGoToScan={() => setActiveTab('scan')}
          />
        )}

        {activeTab === 'palette' && (
          <PaletteView 
            parsedData={activeData}
            onBack={() => setActiveTab('scan')}
            onTriggerToast={triggerToast}
          />
        )}
      </main>

      {/* Bottom Nav Bar */}
      <nav className="bottom-nav">
        <button 
          onClick={() => setActiveTab('scan')}
          className={`nav-item ${activeTab === 'scan' || activeTab === 'palette' ? 'active' : ''}`}
        >
          <QrCode size={22} />
          <span>Escanear</span>
        </button>

        <button 
          onClick={() => setActiveTab('history')}
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
        >
          <History size={22} />
          <span>Historial</span>
        </button>
      </nav>

      {/* Toast Notification */}
      <Toast 
        message={toastMessage} 
        onClose={() => setToastMessage('')} 
      />
    </div>
  );
}
