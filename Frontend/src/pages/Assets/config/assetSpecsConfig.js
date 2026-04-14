export const ASSET_SPECS_CONFIG = {
  // ======================== CPU ========================
  CPU: {
    icon: "memory",
    sections: [
      {
        title: "Processor",
        fields: [
          { key: "processorManufacturer", label: "Manufacturer", format: "text" },
          { key: "processorModel", label: "Model", format: "text" },
          { key: "processorGeneration", label: "Generation", unit: "th Gen", format: "number" },
          { key: "cores", label: "Cores", format: "number" },
          { key: "threads", label: "Threads", format: "number" },
          { key: "virtualizationEnabled", label: "Virtualization", format: "boolean" },
        ]
      },
      {
        title: "Memory (RAM)",
        fields: [
          { key: "memory.totalCapacityGB", label: "Total Capacity", unit: "GB", format: "number" },
          { key: "memory.modules", label: "Installed Modules", format: "list", listFormat: "ramModule" },
        ]
      },
      {
        title: "Storage",
        fields: [
          { key: "storage.totalCapacityGB", label: "Total Capacity", unit: "GB", format: "number" },
          { key: "storage.devices", label: "Installed Drives", format: "list", listFormat: "storageDrive" },
        ]
      },
      {
        title: "Graphics",
        fields: [
          { key: "gpuModelNumber", label: "GPU Model", format: "text" },
          { key: "gpuCapacityGB", label: "GPU Memory", unit: "GB", format: "number" },
        ]
      },
      {
        title: "Operating System",
        fields: [
          { key: "osName", label: "OS Name", format: "text" },
          { key: "osEdition", label: "Edition", format: "text" },
          { key: "osVersion", label: "Version", format: "text" },
          { key: "buildNumber", label: "Build Number", format: "text" },
          { key: "domain", label: "Domain", format: "text" },
        ]
      },
      {
        title: "Hardware Security",
        fields: [
          { key: "biosVersion", label: "BIOS Version", format: "text" },
          { key: "tpmVersion", label: "TPM Version", format: "text" },
          { key: "secureBootEnabled", label: "Secure Boot", format: "boolean" },
        ]
      },
    ]
  },

  // ======================== MONITOR ========================
  MONITOR: {
    icon: "desktop_mac",
    sections: [
      {
        title: "Display",
        fields: [
          { key: "screenSizeInches", label: "Screen Size", unit: '"', format: "number" },
          { key: "resolution", label: "Resolution", format: "text" },
          { key: "panelType", label: "Panel Type", format: "text" },
          { key: "refreshRateHz", label: "Refresh Rate", unit: "Hz", format: "number" },
          { key: "aspectRatio", label: "Aspect Ratio", format: "text" },
          { key: "brightnessNits", label: "Brightness", unit: "nits", format: "number" },
          { key: "responseTimeMs", label: "Response Time", unit: "ms", format: "number" },
          { key: "curved", label: "Curved", format: "boolean" },
        ]
      },
      {
        title: "Connectivity",
        fields: [
          { key: "hdmiPorts", label: "HDMI Ports", format: "number" },
          { key: "displayPort", label: "DisplayPort", format: "number" },
          { key: "vgaPort", label: "VGA Port", format: "text" },
          { key: "usbPorts", label: "USB Ports", format: "number" },
          { key: "audioOut", label: "Audio Out", format: "text" },
          { key: "builtInSpeakers", label: "Built-in Speakers", format: "boolean" },
        ]
      },
      {
        title: "Power & Efficiency",
        fields: [
          { key: "powerConsumptionWatt", label: "Power Consumption", unit: "W", format: "number" },
          { key: "energyRating", label: "Energy Rating", format: "text" },
          { key: "voltageRange", label: "Voltage Range", format: "text" },
        ]
      },
    ]
  },

  // ======================== LAPTOP ========================
  LAPTOP: {
    icon: "laptop",
    sections: [
      {
        title: "Processor",
        fields: [
          { key: "processorManufacturer", label: "Manufacturer", format: "text" },
          { key: "processorModel", label: "Model", format: "text" },
          { key: "cores", label: "Cores", format: "number" },
          { key: "threads", label: "Threads", format: "number" },
        ]
      },
      {
        title: "Memory",
        fields: [
          { key: "memory.totalCapacityGB", label: "Total RAM", unit: "GB", format: "number" },
          { key: "memory.modules", label: "Installed RAM Modules", format: "list", listFormat: "ramModule" },
        ]
      },
      {
        title: "Storage",
        fields: [
          { key: "storage.totalCapacityGB", label: "Total Storage", unit: "GB", format: "number" },
          { key: "storage.devices", label: "Installed Drives", format: "list", listFormat: "storageDrive" },
        ]
      },
      {
        title: "Display",
        fields: [
          { key: "screenSizeInches", label: "Screen Size", unit: '"', format: "number" },
          { key: "resolution", label: "Resolution", format: "text" },
          { key: "panelType", label: "Panel Type", format: "text" },
        ]
      },
      {
        title: "Graphics",
        fields: [
          { key: "graphicsType", label: "Graphics Type", format: "text" },
          { key: "graphicsModel", label: "Graphics Model", format: "text" },
        ]
      },
      {
        title: "Battery & Power",
        fields: [
          { key: "originalCapacitymAh", label: "Battery Capacity", unit: "mAh", format: "number" },
          { key: "chargerCapacityWatt", label: "Charger Capacity", unit: "W", format: "number" },
          { key: "fastChargingSupported", label: "Fast Charging", format: "boolean" },
        ]
      },
      {
        title: "Security Features",
        fields: [
          { key: "fingerprintScanner", label: "Fingerprint Scanner", format: "boolean" },
          { key: "faceRecognition", label: "Face Recognition", format: "boolean" },
          { key: "tpmVersion", label: "TPM Version", format: "text" },
          { key: "secureBootEnabled", label: "Secure Boot", format: "boolean" },
        ]
      },
    ]
  },

  // ======================== CAMERA ========================
  CAMERA: {
    icon: "videocam",
    sections: [
      {
        title: "Camera Specifications",
        fields: [
          { key: "assetSubType", label: "Camera Type", format: "text" },
          { key: "resolution", label: "Resolution", format: "text" },
          { key: "frameRate", label: "Frame Rate", unit: "FPS", format: "number" },
          // { key: "sensorType", label: "Sensor Type", format: "text" },
          { key: "fieldOfView", label: "Field of View", unit: "°", format: "number" },
          { key: "autoFocus", label: "Auto Focus", format: "boolean" },
        ]
      },
      {
        title: "Audio Features",
        fields: [
          { key: "builtInMicrophone", label: "Built-in Microphone", format: "boolean" },
          // { key: "microphoneType", label: "Microphone Type", format: "text", showIf: { builtInMicrophone: "Yes" } },
          { key: "noiseReduction", label: "Noise Reduction", format: "boolean", showIf: { builtInMicrophone: "Yes" } },
        ]
      },
      {
        title: "Connectivity",
        fields: [
          { key: "connectionType", label: "Connection Type", format: "text" },
          { key: "cableLength", label: "Cable Length", unit: "m", format: "number", showIf: { connectionType: ["USB", "USB-C"] } },
          { key: "plugAndPlay", label: "Plug & Play", format: "boolean", showIf: { connectionType: ["USB", "USB-C"] } },
        ]
      },
      {
        title: "Physical Properties",
        fields: [
          { key: "mountType", label: "Mount Type", format: "text" },
          { key: "color", label: "Color", format: "text" },
          // { key: "weight", label: "Weight", unit: "g", format: "number" },
        ]
      },
    ]
  },

  // ======================== PRINTER ========================
  PRINTER: {
    icon: "print",
    sections: [
      {
        title: "Basic Information",
        fields: [
          { key: "manufacturer", label: "Manufacturer", format: "text" },
          // { key: "brand", label: "Brand", format: "text" },
          { key: "model", label: "Model", format: "text" },
          { key: "modelNumber", label: "Model Number", format: "text" },
          { key: "partNumber", label: "Part Number", format: "text" },
          { key: "serialNumber", label: "Serial Number", format: "text" },
          { key: "assetCondition", label: "Condition", format: "text" },
          { key: "ownershipType", label: "Ownership", format: "text" },
          { key: "manufacturingDate", label: "Manufacturing Date", format: "date" },
        ]
      },
      {
        title: "Print Specifications",
        fields: [
          { key: "printTechnology", label: "Print Technology", format: "text" },
          { key: "colorSupport", label: "Color Support", format: "text" },
          { key: "printSpeedPPM", label: "Print Speed", unit: "PPM", format: "number" },
          { key: "maxResolutionDPI", label: "Max Resolution", unit: "DPI", format: "number" },
          { key: "monthlyDutyCycle", label: "Monthly Duty Cycle", unit: "pages", format: "number" },
          { key: "duplexPrinting", label: "Duplex Printing", format: "text" },
          { key: "totalPrintCount", label: "Total Print Count", unit: "pages", format: "number" },
        ]
      },
      {
        title: "Connectivity & Network",
        fields: [
          { key: "networkSupport", label: "Network Support", format: "text" },
          { key: "wirelessSupport", label: "Wireless Support", format: "text" },
          { key: "ipAddress", label: "IP Address", format: "text", showIf: { or: [ { networkSupport: "Yes" }, { wirelessSupport: "Yes" } ] } },
          { key: "macAddress", label: "MAC Address", format: "text", showIf: { or: [ { networkSupport: "Yes" }, { wirelessSupport: "Yes" } ] } },
          { key: "gateway", label: "Gateway", format: "text", showIf: { ipAddress : { not: { equals: null } } } },
          { key: "subnet", label: "Subnet", format: "text", showIf: { ipAddress : { not: { equals: null } } } },
          { key: "dns", label: "DNS", format: "text", showIf: { ipAddress : { not: { equals: null } } } },
        ]
      },
      {
        title: "Scanner & Copier",
        fields: [
          { key: "scannerSupport", label: "Scanner Support", format: "text" },
          { key: "copierSupport", label: "Copier Support", format: "text" },
          { key: "scanResolutionDPI", label: "Scan Resolution", unit: "DPI", format: "number" },
          { key: "copySpeedCPM", label: "Copy Speed", unit: "CPM", format: "number" },
        ]
      },
      {
        title: "Cartridge/Toner (Black)",
        showIf: { colorSupport: "No" },
        fields: [
          { key: "blackCartridgeModel", label: "Cartridge Model", format: "text" },
          { key: "blackCartridgePartNumber", label: "Part Number", format: "text" },
          { key: "blackCartridgeManufacturer", label: "Manufacturer", format: "text" },
          { key: "blackCartridgeYieldPages", label: "Yield", unit: "pages", format: "number" },
          { key: "blackCartridgeLastChanged", label: "Last Changed", format: "date" },
          { key: "blackCartridgeEstimatedEnd", label: "Estimated End", format: "date" },
        ]
      },
      {
        title: "Cartridge/Toner (Color)",
        showIf: { colorSupport: "Yes" },
        fields: [
          { key: "cartridges", label: "Color Cartridges", format: "list", listFormat: "printerCartridge",  },
        ]
      },
      {
        title: "Physical & Power",
        fields: [
          { key: "printerColor", label: "Color", format: "text" },
          { key: "powerConsumptionWatt", label: "Power Consumption", unit: "W", format: "number" },
          { key: "voltageRange", label: "Voltage Range",unit: "V", format: "text" },
        ]
      },
    ]
  },
  
};

/**
 * Custom list formatters for complex fields (arrays)
 * Maps listFormat types to rendering functions
 */
export const LIST_FORMATTERS = {
  ramModule: (modules) => {
    return modules.map((module, idx) => ({
      main: `${module.ramCapacityGB}GB ${module.ramType || 'N/A'}`,
      sub: `${module.ramSpeedMHz || 'N/A'}MHz ${module.ramManufacturer ? `- ${module.ramManufacturer}` : ''}`.trim(),
    }));
  },

  storageDrive: (drives) => {
    return drives.map((drive, idx) => ({
      main: `${drive.driveCapacityGB}GB ${drive.driveType || 'HDD'}`,
      sub: `${drive.driveInterfaceSpeed || 'N/A'} - ${drive.driveManufacturer || 'N/A'}`.trim(),
    }));
  },

  printerCartridge: (cartridges) => {
    return cartridges.map((cartridge, idx) => ({
      main: `${cartridge.cartridgeColor || 'Unknown'} - ${cartridge.cartridgeModel || 'N/A'}`,
      sub: `${cartridge.cartridgeYieldPages || 'N/A'} pages - ${cartridge.cartridgeManufacturer || 'N/A'}`.trim(),
    }));
  },
};

/**
 * Helper function to get value from nested keys (e.g., "memory.totalCapacityGB")
 */
export const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
};

const resolveSourceValue = (source, key) => {
  if (typeof source === "function") {
    return source(key);
  }
  return getNestedValue(source, key);
};

export const evaluateShowIf = (cond, source) => {
  if (!cond || typeof cond !== "object") return true;
  if (Array.isArray(cond)) {
    return cond.every((item) => evaluateShowIf(item, source));
  }
  if ("field" in cond) {
    return String(resolveSourceValue(source, cond.field) ?? "") === String(cond.equals ?? "");
  }
  if ("not" in cond) {
    return !evaluateShowIf(cond.not, source);
  }
  if ("or" in cond) {
    return Array.isArray(cond.or) && cond.or.some((item) => evaluateShowIf(item, source));
  }
  if ("and" in cond) {
    return Array.isArray(cond.and) && cond.and.every((item) => evaluateShowIf(item, source));
  }
  return Object.entries(cond).every(([key, expected]) => {
    const actualValue = String(resolveSourceValue(source, key) ?? "").trim();
    if (Array.isArray(expected)) {
      return expected.map(String).includes(actualValue);
    }
    return actualValue === String(expected ?? "");
  });
};

/**
 * Helper function to check if a field has data
 */
export const hasFieldData = (asset, fieldKey) => {
  const value = getNestedValue(asset, fieldKey);
  return value !== null && value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true);
};
