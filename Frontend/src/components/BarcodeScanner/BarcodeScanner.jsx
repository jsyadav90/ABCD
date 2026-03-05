import { useRef, useEffect } from "react";
import { useZxing } from "react-zxing";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: "16px",
};

const videoStyle = {
  width: "100%",
  maxWidth: "520px",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 14px 36px rgba(0,0,0,0.35)",
};

const controlsStyle = {
  display: "flex",
  gap: "8px",
  marginTop: "12px",
};

const btnStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.35)",
  background: "transparent",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};

const titleStyle = {
  color: "#fff",
  fontSize: "16px",
  marginBottom: "10px",
  textAlign: "center",
};

const BarcodeScanner = ({ open, onClose, onDetected }) => {
  const videoRef = useRef(null);
  const { ref } = useZxing({
    onDecodeResult(result) {
      const text = result.getText();
      if (text) {
        onDetected(text);
        onClose();
      }
    },
    constraints: {
      video: {
        facingMode: { ideal: "environment" },
      },
    },
    timeBetweenDecodingAttempts: 200,
  });

  useEffect(() => {
    if (open && videoRef.current) {
      ref.current = videoRef.current;
    }
  }, [open, ref]);

  if (!open) return null;

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Scan Barcode">
      <div style={titleStyle}>Camera चालू है • Barcode/QR को क्षेत्र में लाएं</div>
      <video ref={videoRef} style={videoStyle} />
      <div style={controlsStyle}>
        <button style={btnStyle} onClick={onClose} aria-label="Close Scanner">Close</button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
