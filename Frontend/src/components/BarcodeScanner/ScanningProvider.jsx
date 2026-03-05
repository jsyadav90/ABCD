import { useState, useCallback } from "react";
import { ScanningContext } from "./ScanningContext.js";
import BarcodeScanner from "./BarcodeScanner.jsx";

const ScanningProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [onDetected, setOnDetected] = useState(null);

  const openScan = useCallback((handler) => {
    setOnDetected(() => handler);
    setOpen(true);
  }, []);

  const close = () => setOpen(false);

  return (
    <ScanningContext.Provider value={{ openScan }}>
      {children}
      <BarcodeScanner
        open={open}
        onClose={close}
        onDetected={(text) => {
          if (typeof onDetected === "function") onDetected(text);
        }}
      />
    </ScanningContext.Provider>
  );
};

export default ScanningProvider;
