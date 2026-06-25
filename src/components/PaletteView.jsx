import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, Share2, Clipboard } from 'lucide-react';

export default function PaletteView({ parsedData, onBack, onTriggerToast }) {
  const [copiedHex, setCopiedHex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  
  // Persist preferences for including the '#' prefix
  const [includeHash, setIncludeHash] = useState(() => {
    try {
      const stored = localStorage.getItem('colorsync_include_hash');
      return stored !== null ? JSON.parse(stored) : true;
    } catch (e) {
      return true;
    }
  });

  const handleToggleHash = (val) => {
    setIncludeHash(val);
    try {
      localStorage.setItem('colorsync_include_hash', JSON.stringify(val));
    } catch (e) {}
  };

  if (!parsedData) return null;

  const copyToClipboard = (text, successMsg, hexKey = null) => {
    const handleSuccess = () => {
      onTriggerToast(successMsg);
      if (hexKey) {
        setCopiedHex(hexKey);
        setTimeout(() => setCopiedHex(null), 1500);
        if (parsedData.type === 'single-color') {
          setCopiedAll(true);
          setTimeout(() => setCopiedAll(false), 1500);
        }
      } else {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 1500);
      }
    };

    const handleFallback = () => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          handleSuccess();
        } else {
          onTriggerToast('No se pudo copiar. Inténtalo de nuevo.');
        }
      } catch (fallbackErr) {
        console.error('Error en el fallback de copia:', fallbackErr);
        onTriggerToast('No se pudo copiar. Inténtalo de nuevo.');
      }
      document.body.removeChild(textArea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(handleSuccess)
        .catch((err) => {
          console.error('Error al copiar al portapapeles:', err);
          handleFallback();
        });
    } else {
      handleFallback();
    }
  };

  const handleCopyColor = (hex, name) => {
    // Strip '#' if toggle is false
    const colorValue = includeHash ? hex : (hex.startsWith('#') ? hex.slice(1) : hex);
    copyToClipboard(colorValue, `¡Copiado ${name}: ${colorValue}!`, hex);
  };

  const handleCopyPalette = () => {
    if (parsedData.rawText) {
      copyToClipboard(parsedData.rawText, '¡Paleta completa copiada en formato texto!');
    }
  };

  return (
    <div className="palette-view-card">
      <div className="palette-view-header">
        <button onClick={onBack} className="btn-back">
          <ArrowLeft size={20} />
          <span>Escanear</span>
        </button>
        <span className="badge badge-success">
          {parsedData.type === 'single-color' ? 'Color' : 'Paleta'}
        </span>
      </div>

      <div className="palette-info mt-3">
        <h2 className="palette-title">{parsedData.name}</h2>
        {parsedData.type === 'palette' && (
          <p className="palette-subtitle">Toca cualquier color para copiar su HEX al portapapeles</p>
        )}
      </div>

      {/* Copy Hash Option Toggle */}
      {(parsedData.type === 'palette' || parsedData.type === 'single-color') && (
        <div className="hash-toggle-wrapper mt-3">
          <label className="hash-toggle-label">
            <input 
              type="checkbox" 
              checked={includeHash} 
              onChange={(e) => handleToggleHash(e.target.checked)}
              className="hash-toggle-checkbox"
            />
            <span className="hash-toggle-custom-box"></span>
            <span className="hash-toggle-text">
              Incluir "#" al copiar (ej: <code className="hash-toggle-code">{includeHash ? '#ffc98b' : 'ffc98b'}</code>)
            </span>
          </label>
        </div>
      )}

      <div className="palette-body mt-4">
        {parsedData.type === 'text' && (
          <div className="text-display-box">
            <pre className="raw-text-preview">{parsedData.text}</pre>
            <button 
              onClick={() => copyToClipboard(parsedData.text, '¡Texto copiado!')} 
              className="btn btn-secondary btn-block mt-3"
            >
              <Copy size={16} /> Copiar Texto
            </button>
          </div>
        )}

        {parsedData.type === 'single-color' && parsedData.colors && (
          <div className="single-color-container">
            {parsedData.colors.map((color, idx) => (
              <div 
                key={idx} 
                className="single-color-card"
                onClick={() => handleCopyColor(color.hex, color.name)}
              >
                <div 
                  className="color-visual-block-large" 
                  style={{ backgroundColor: color.hex }}
                >
                  <div className="color-visual-overlay">
                    {copiedHex === color.hex ? <Check size={36} /> : <Copy size={36} />}
                  </div>
                </div>
                <div className="single-color-details">
                  <span className="color-hex-large">{includeHash ? color.hex : color.hex.replace('#', '')}</span>
                  <span className="color-name-large">{color.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {parsedData.type === 'palette' && parsedData.categories && (
          <div className="palette-categories">
            {parsedData.categories.map((category, catIdx) => (
              <div key={catIdx} className="category-group">
                <h3 className="category-title">{category.name}</h3>
                
                <div className="colors-grid">
                  {category.colors.map((color, colorIdx) => {
                    const isCopied = copiedHex === color.hex;
                    return (
                      <div 
                        key={colorIdx} 
                        className={`color-card ${isCopied ? 'copied' : ''}`}
                        onClick={() => handleCopyColor(color.hex, color.name)}
                        style={{ '--color-value': color.hex }}
                      >
                        <div 
                          className="color-swatch"
                          style={{ backgroundColor: color.hex }}
                        >
                          <div className="color-swatch-badge">
                            {isCopied ? <Check size={14} /> : <Copy size={14} />}
                          </div>
                        </div>
                        <div className="color-info">
                          <span className="color-name">{color.name}</span>
                          <span className="color-hex">{includeHash ? color.hex : color.hex.replace('#', '')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {parsedData.rawText && (
        <div className="palette-actions mt-4">
          {parsedData.type === 'single-color' && parsedData.colors && parsedData.colors[0] ? (
            <button 
              onClick={() => handleCopyColor(parsedData.colors[0].hex, parsedData.colors[0].name)} 
              className={`btn btn-block ${copiedAll ? 'btn-success' : 'btn-primary'}`}
            >
              {copiedAll ? <Check size={18} /> : <Clipboard size={18} />}
              <span>{copiedAll ? '¡Color Copiado!' : 'Copiar Color'}</span>
            </button>
          ) : (
            <button 
              onClick={handleCopyPalette} 
              className={`btn btn-block ${copiedAll ? 'btn-success' : 'btn-primary'}`}
            >
              {copiedAll ? <Check size={18} /> : <Clipboard size={18} />}
              <span>{copiedAll ? '¡Paleta Copiada!' : 'Copiar Paleta Completa'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
