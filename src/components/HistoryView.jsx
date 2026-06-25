import React from 'react';
import { Trash2, Calendar, Clipboard, ArrowRight, Grid, AlertCircle } from 'lucide-react';

export default function HistoryView({ history, onSelectHistoryItem, onDeleteHistoryItem, onClearHistory, onGoToScan }) {
  
  // Format timestamp (e.g., "Hace 2 min" or "22 Jun, 20:34")
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} hr`;

    // Otherwise format date
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extract all colors as a flat array for rendering the preview bar
  const getFlatColors = (item) => {
    if (item.type === 'single-color' && item.colors) {
      return item.colors.map(c => c.hex);
    }
    if (item.type === 'palette' && item.categories) {
      const colors = [];
      item.categories.forEach(cat => {
        cat.colors.forEach(col => {
          colors.push(col.hex);
        });
      });
      return colors;
    }
    return [];
  };

  return (
    <div className="history-card">
      <div className="history-header">
        <div>
          <h2 className="section-title">Historial</h2>
          <p className="section-subtitle">Tus paletas y colores guardados</p>
        </div>
        {history.length > 0 && (
          <button onClick={onClearHistory} className="btn-clear-history">
            <Trash2 size={16} />
            <span>Borrar todo</span>
          </button>
        )}
      </div>

      <div className="history-body mt-3">
        {history.length === 0 ? (
          <div className="history-empty-state">
            <div className="empty-icon-wrapper">
              <Grid size={32} className="empty-icon" />
            </div>
            <h3>Historial vacío</h3>
            <p>Aún no has escaneado ningún color o paleta. ¡Comienza ahora!</p>
            <button onClick={onGoToScan} className="btn btn-primary mt-3">
              Escanear Código QR
            </button>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => {
              const flatColors = getFlatColors(item);
              return (
                <div key={item.id} className="history-item">
                  <div 
                    className="history-item-clickable" 
                    onClick={() => onSelectHistoryItem(item)}
                  >
                    <div className="history-item-meta">
                      <span className="history-item-name">{item.name}</span>
                      <span className="history-item-time">
                        <Calendar size={12} className="mr-1" />
                        {formatTime(item.timestamp)}
                      </span>
                    </div>

                    {/* Color Preview Strip */}
                    {flatColors.length > 0 && (
                      <div className="history-color-strip">
                        {flatColors.slice(0, 6).map((hex, idx) => (
                          <div 
                            key={idx} 
                            className="history-color-dot"
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        ))}
                        {flatColors.length > 6 && (
                          <span className="history-color-more">+{flatColors.length - 6}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHistoryItem(item.id);
                    }} 
                    className="btn-delete-item" 
                    title="Eliminar de historial"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
