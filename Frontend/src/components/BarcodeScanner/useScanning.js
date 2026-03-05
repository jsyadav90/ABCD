import { useContext } from "react";
import { ScanningContext } from "./ScanningContext.js";

export const useScanning = () => useContext(ScanningContext);
