import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, FlipHorizontal, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function Scanner({ onScanSuccess }) {
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [manualText, setManualText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const qrReaderRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  
  // Async status refs to prevent race conditions during transitions
  const isMounted = useRef(true);
  const scannerStatus = useRef('stopped'); // 'stopped', 'starting', 'scanning', 'stopping'

  // Initialize and check cameras
  useEffect(() => {
    isMounted.current = true;

    // Request list of cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted.current) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera
          const backCamIndex = devices.findIndex(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') || 
            device.label.toLowerCase().includes('entorno')
          );
          setCurrentCameraIndex(backCamIndex !== -1 ? backCamIndex : 0);
        } else {
          setScannerError('No se detectaron cámaras en este dispositivo.');
        }
      })
      .catch((err) => {
        if (!isMounted.current) return;
        console.error('Error obteniendo cámaras:', err);
        setScannerError('Error al acceder a las cámaras. Asegúrate de otorgar permisos de cámara y estar en un sitio seguro (HTTPS).');
      });

    return () => {
      isMounted.current = false;
      stopScanner();
    };
  }, []);

  // Auto start/stop scanner when camera selection is ready or changed
  useEffect(() => {
    if (cameras.length > 0 && !showManualInput) {
      startScanner(cameras[currentCameraIndex].id);
    }
    return () => {
      stopScanner();
    };
  }, [cameras, currentCameraIndex, showManualInput]);

  const startScanner = (cameraId) => {
    // If already starting or scanning on this camera, do nothing
    if (scannerStatus.current === 'starting' || scannerStatus.current === 'scanning') {
      return;
    }
    
    // If currently stopping, wait for it to stop and retry
    if (scannerStatus.current === 'stopping') {
      setTimeout(() => {
        if (isMounted.current) startScanner(cameraId);
      }, 100);
      return;
    }

    scannerStatus.current = 'starting';
    if (isMounted.current) {
      setScannerError(null);
      setIsScanning(true);
    }

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      html5QrCodeRef.current = html5QrCode;

      const width = qrReaderRef.current?.clientWidth || 300;
      const qrBoxSize = Math.min(width * 0.7, 250);

      html5QrCode
        .start(
          cameraId,
          {
            fps: 12,
            qrbox: { width: qrBoxSize, height: qrBoxSize },
            aspectRatio: 1.0
          },
          (decodedText) => {
            // On success, stop the feed first and then pass the result
            stopScanner().then(() => {
              if (isMounted.current) {
                onScanSuccess(decodedText);
              }
            });
          },
          (errorMessage) => {
            // Ignore normal scan failure errors
          }
        )
        .then(() => {
          if (!isMounted.current) {
            stopScanner();
            return;
          }
          scannerStatus.current = 'scanning';
        })
        .catch((err) => {
          console.error('Error en start() de html5QrCode:', err);
          if (isMounted.current) {
            setScannerError('No se pudo inicializar la cámara. Puede que esté ocupada por otra app o requiera HTTPS.');
            setIsScanning(false);
          }
          scannerStatus.current = 'stopped';
          html5QrCodeRef.current = null;
        });
    } catch (e) {
      console.error('Excepción al inicializar lector QR:', e);
      scannerStatus.current = 'stopped';
    }
  };

  const stopScanner = () => {
    if (scannerStatus.current === 'stopped') {
      return Promise.resolve();
    }

    // If it's starting, wait for it to finish and then stop it
    if (scannerStatus.current === 'starting') {
      scannerStatus.current = 'stopping';
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (scannerStatus.current === 'scanning' || scannerStatus.current === 'stopped') {
            clearInterval(checkInterval);
            stopScanner().then(resolve);
          }
        }, 80);
      });
    }

    // If already stopping, wait for it to finish
    if (scannerStatus.current === 'stopping') {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (scannerStatus.current === 'stopped') {
            clearInterval(checkInterval);
            resolve();
          }
        }, 80);
      });
    }

    // Scanning is active, stop it safely
    scannerStatus.current = 'stopping';
    if (isMounted.current) {
      setIsScanning(false);
    }

    const html5QrCode = html5QrCodeRef.current;
    if (html5QrCode && html5QrCode.isScanning) {
      return html5QrCode
        .stop()
        .then(() => {
          html5QrCodeRef.current = null;
          scannerStatus.current = 'stopped';
        })
        .catch((err) => {
          console.error('Error al detener cámara:', err);
          html5QrCodeRef.current = null;
          scannerStatus.current = 'stopped';
        });
    } else {
      html5QrCodeRef.current = null;
      scannerStatus.current = 'stopped';
      return Promise.resolve();
    }
  };

  const toggleCamera = () => {
    if (cameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualText.trim()) {
      onScanSuccess(manualText);
      setManualText('');
    }
  };

  return (
    <div className="scanner-card">
      <div className="scanner-header">
        <h2 className="section-title">Escanear QR</h2>
        <p className="section-subtitle">Apunta tu cámara al código QR de la pantalla</p>
      </div>

      <div className="scanner-viewport-wrapper">
        {showManualInput ? (
          <div className="manual-input-container">
            <form onSubmit={handleManualSubmit}>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={`Pega el texto aquí. Ejemplo:\n# Paleta: gta 5\n- piel: #ffc98b\n- lengua: #f48c7f`}
                className="manual-textarea"
                rows={8}
              />
              <button type="submit" className="btn btn-primary btn-block">
                <Sparkles size={18} />
                Procesar Texto / Paleta
              </button>
            </form>
          </div>
        ) : (
          <div className="scanner-viewport" ref={qrReaderRef}>
            <div id="qr-reader-container" className="qr-video-feed"></div>
            
            {isScanning && (
              <div className="scanner-overlay">
                <div className="scanner-frame">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                  <div className="scanner-laser"></div>
                </div>
              </div>
            )}

            {scannerError && (
              <div className="scanner-error-overlay">
                <AlertCircle size={36} className="error-icon" />
                <p className="error-message">{scannerError}</p>
                <button 
                  onClick={() => cameras.length > 0 ? startScanner(cameras[currentCameraIndex].id) : window.location.reload()} 
                  className="btn btn-secondary btn-sm mt-3"
                >
                  <RefreshCw size={14} className="mr-1" /> Reintentar
                </button>
              </div>
            )}

            {!isScanning && !scannerError && (
              <div className="scanner-loading-overlay">
                <div className="spinner"></div>
                <p>Iniciando cámara...</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="scanner-controls">
        {cameras.length > 1 && !showManualInput && (
          <button onClick={toggleCamera} className="btn-control" title="Cambiar Cámara">
            <FlipHorizontal size={20} />
            <span>Cámara {currentCameraIndex + 1}</span>
          </button>
        )}
        
        <button 
          onClick={() => {
            setShowManualInput(prev => !prev);
          }} 
          className={`btn-control ${showManualInput ? 'active' : ''}`}
        >
          {showManualInput ? <Camera size={20} /> : <CameraOff size={20} />}
          <span>{showManualInput ? 'Usar Cámara' : 'Texto Manual'}</span>
        </button>
      </div>
    </div>
  );
}
