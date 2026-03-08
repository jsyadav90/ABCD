import { useState, useEffect } from "react";
import { useZxing } from "react-zxing";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.9)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: "16px",
};

const videoContainerStyle = {
  width: "100%",
  maxWidth: "520px",
  position: "relative",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 14px 36px rgba(0,0,0,0.5)",
  background: "#000",
};

const videoStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

// Visual guide for scanning area
const guideStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  height: "200px",
  border: "2px solid rgba(255, 255, 255, 0.6)",
  borderRadius: "8px",
  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
  pointerEvents: "none",
};

const controlsStyle = {
  display: "flex",
  gap: "12px",
  marginTop: "20px",
  flexWrap: "wrap",
  justifyContent: "center",
};

const btnStyle = {
  padding: "12px 20px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.1)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
  backdropFilter: "blur(4px)",
  transition: "background 0.2s",
};

const titleStyle = {
  color: "#fff",
  fontSize: "18px",
  fontWeight: "500",
  marginBottom: "20px",
  textAlign: "center",
  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
};

const errorStyle = {
  color: "#ff6b6b",
  marginTop: "10px",
  textAlign: "center",
  fontSize: "14px",
  background: "rgba(0,0,0,0.8)",
  padding: "8px 12px",
  borderRadius: "6px",
};

const BarcodeScanner = ({ open, onClose, onDetected }) => {
  const [error, setError] = useState("");
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");

  // Setup react-zxing hook
  const { ref } = useZxing({
    onDecodeResult(result) {
      const text = result.getText();
      if (text) {
        // Vibrate if supported
        if (navigator.vibrate) navigator.vibrate(50);
        onDetected(text);
        onClose();
      }
    },
    onError(err) {
      // Ignore common "NotFoundException" which just means no code in frame
      if (!String(err).includes("NotFoundException")) {
        // Only log real errors
        // console.warn("Scan error:", err);
      }
    },
    constraints: {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        facingMode: deviceId ? undefined : { ideal: "environment" },
      },
    },
    timeBetweenDecodingAttempts: 300,
  });

  // Fetch available cameras
  useEffect(() => {
    if (!open) return;
    
    let mounted = true;
    const getDevices = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devs.filter((d) => d.kind === "videoinput");
        if (mounted) {
          setDevices(videoDevs);
          // Auto-select back camera if multiple exist and not set
          if (!deviceId && videoDevs.length > 0) {
            const backCam = videoDevs.find(
              (d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("environment")
            );
            if (backCam) setDeviceId(backCam.deviceId);
          }
        }
      } catch (err) {
        console.error("Error listing devices:", err);
        setError("Camera permission denied or not available.");
      }
    };
    
    // Request permission first to get labels
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach(t => t.stop()); // Close initial stream
        getDevices();
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        setError("Camera access denied. Please allow permissions.");
      });

    return () => { mounted = false; };
  }, [open, deviceId]);

  // Image upload handler
  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const url = URL.createObjectURL(file);
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.ITF,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.DATA_MATRIX
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      
      const reader = new BrowserMultiFormatReader(hints);
      const result = await reader.decodeFromImageUrl(url);
      const text = result?.getText?.();
      
      if (text) {
        onDetected(text);
        onClose();
      } else {
        setError("No barcode found in image");
      }
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Image decode failed", err);
      setError("Could not read barcode from image");
    } finally {
      e.target.value = "";
    }
  };

  if (!open) return null;

  return (
    <div 
// @ts-ignore
    style={overlayStyle} role="dialog" aria-modal="true" aria-label="Scan Barcode">
      <div 
// @ts-ignore
      style={titleStyle}>Scan Barcode / QR Code</div>
      
      <div 
// @ts-ignore
      style={videoContainerStyle}>
        {/* The video element controlled by react-zxing */}
        <video ref={ref} 
// @ts-ignore
        style={videoStyle} />
        
        {/* Visual Guide Box */}
        <div 
// @ts-ignore
        style={guideStyle}></div>
      </div>

      {error && <div 
// @ts-ignore
      style={errorStyle}>{error}</div>}

      <div 
// @ts-ignore
      style={controlsStyle}>
        {devices.length > 1 && (
          <button 
            style={btnStyle} 
            onClick={() => {
              // Cycle through cameras
              const idx = devices.findIndex(d => d.deviceId === deviceId);
              const next = devices[(idx + 1) % devices.length];
              setDeviceId(next.deviceId);
            }}
          >
            Switch Camera 📷
          </button>
        )}
        
        <label style={btnStyle}>
          Upload Image 🖼️
          <input 
            type="file" 
            accept="image/*" 
            style={{ display: "none" }} 
            onChange={onFileChange} 
          />
        </label>

        <button 
          style={{ ...btnStyle, background: "rgba(255, 59, 48, 0.25)", borderColor: "rgba(255, 59, 48, 0.5)" }} 
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
