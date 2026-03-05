import { useRef, useEffect } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";

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
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open || !videoRef.current) return;

    const start = async () => {
      try {
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
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints);
        readerRef.current = reader;
        reader.timeBetweenDecodingAttempts = 200;

        const constraints = {
          video: {
            facingMode: { ideal: "environment" },
          },
        };

        const controls = await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result) => {
            if (result) {
              const text = result.getText();
              if (text) {
                onDetected(text);
                onClose();
              }
            }
          }
        );
        controlsRef.current = controls;
      } catch (e) {
        console.error("Scanner start failed", e);
      }
    };

    start();

    return () => {
      const v = videoRef.current;
      try {
        if (readerRef.current) {
          readerRef.current.reset();
          readerRef.current = null;
        }
        if (controlsRef.current) {
          controlsRef.current.stop();
          controlsRef.current = null;
        }
        if (v) {
          v.srcObject = null;
          v.pause?.();
        }
      } catch {
        // ignore cleanup errors
      }
    };
  }, [open, onClose, onDetected]);

  if (!open) return null;

  const onPickImage = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
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
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints);
      const result = await reader.decodeFromImageUrl(url);
      const text = result?.getText?.();
      if (text) {
        onDetected(text);
        onClose();
      }
    } catch (err) {
      console.error("Image decode failed", err);
    } finally {
      URL.revokeObjectURL(url);
      e.target.value = "";
    }
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Scan Barcode">
      <div style={titleStyle}>Camera चालू है • Barcode/QR को क्षेत्र में लाएं</div>
      <video id="scanner-video" ref={videoRef} style={videoStyle} />
      <div style={controlsStyle}>
        <button style={btnStyle} onClick={onClose} aria-label="Close Scanner">Close</button>
        <button style={btnStyle} onClick={onPickImage} aria-label="Decode From Image">From Image</button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChange} aria-hidden="true" />
      </div>
    </div>
  );
};

export default BarcodeScanner;
