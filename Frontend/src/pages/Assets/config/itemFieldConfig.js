export const CATEGORY_ITEMS = {
  fixed: [
    { value: "cpu", label: "CPU" },
    { value: "printer", label: "Printer" },
    { value: "laptop", label: "Laptop" },
    { value: "monitor", label: "Monitor" },
    { value: "keyboard", label: "Keyboard" },
  ],
  consumable: [
    { value: "toner", label: "Toner" },
    { value: "cable", label: "Cable" },
  ],
  intangible: [
    { value: "software_license", label: "Software License" },
    { value: "domain", label: "Domain" },
  ],
};

const common = {
  vendors: ["Dell", "HP", "Lenovo", "Acer", "ASUS"].map((v) => ({ value: v, label: v })),
  domains: ["corp.local", "hq.local"].map((v) => ({ value: v, label: v })),
  nicTypes: ["Ethernet", "Wi-Fi"].map((v) => ({ value: v, label: v })),
  networks: ["Office LAN", "Guest Wi-Fi"].map((v) => ({ value: v, label: v })),
  types: ["Static", "DHCP"].map((v) => ({ value: v, label: v })),
  status: ["In Stock", "Assigned", "Under Repair", "Retired"].map((v) => ({ value: v, label: v })),
};

export const ITEM_FIELD_CONFIG = {
  // cpu: {
  //   sections: [
  //     {
  //       sectionTitle: "Basic Information",
  //       fields: [
  //         { name: "name", label: "Name", type: "text", required: true, maxLength: 80 },
  //         { name: "product", label: "Product", type: "select", options: common.vendors },
  //         { name: "deviceTag", label: "Device Tag", type: "text", maxLength: 50 },
  //         { name: "manufacturer", label: "Manufacturer", type: "text", required: true, maxLength: 80 },
  //         { name: "domain", label: "Domain", type: "select", options: common.domains },
  //       ],
  //     },
  //     {
  //       sectionTitle: "Operating System",
  //       fields: [
  //         { name: "osName", label: "Name", type: "text", maxLength: 80 },
  //         { name: "osVersion", label: "Version", type: "text", maxLength: 40 },
  //         { name: "buildNumber", label: "Build Number", type: "text", maxLength: 40 },
  //         { name: "servicePack", label: "Service Pack", type: "text", maxLength: 40 },
  //         { name: "productId", label: "Product ID", type: "text", maxLength: 80 },
  //       ],
  //     },
  //     {
  //       sectionTitle: "Memory",
  //       fields: [
  //         { name: "ram", label: "RAM", type: "text", maxLength: 40 },
  //         { name: "virtualMemory", label: "Virtual Memory", type: "text", maxLength: 40 },
  //       ],
  //     },
  //     {
  //       sectionTitle: "Processors",
  //       fields: [
  //         { name: "processorInfo", label: "Processor Info", type: "text", maxLength: 120 },
  //         { name: "cpuManufacturer", label: "Manufacturer", type: "text", required: true, maxLength: 80 },
  //         { name: "clockSpeedMHz", label: "Clock Speed (MHz)", type: "number", min: 0, max: 10000 },
  //         { name: "cores", label: "Number of cores", type: "number", min: 1, max: 256 },
  //       ],
  //     },
  //     {
  //       sectionTitle: "Storage",
  //       fields: [
  //         { name: "storageType", label: "Storage Type", type: "select", options: [{ value: "HDD", label: "HDD" }, { value: "SSD", label: "SSD" }] },
  //         { name: "diskModel", label: "Model", type: "text", maxLength: 80 },
  //         { name: "diskSerial", label: "Serial Number", type: "text", maxLength: 80 },
  //         { name: "diskManufacturer", label: "Manufacturer", type: "text", maxLength: 80 },
  //         { name: "diskCapacityGB", label: "Capacity (in GB)", type: "number", min: 0, max: 100000 },
  //         { name: "nvmeVersion", label: "NVMe Version", type: "text", showIf: { field: "storageType", equals: "SSD" }, maxLength: 40 },
  //       ],
  //     },
  //     {
  //       sectionTitle: "BIOS",
  //       fields: [
  //         { name: "biosDate", label: "Bios Date", type: "date" },
  //         { name: "biosVersion", label: "Bios Version", type: "text", maxLength: 80 },
  //         { name: "biosManufacturer", label: "Bios Manufacturer", type: "text", maxLength: 80 },
  //       ],
  //     },
  //     {
  //       sectionTitle: "Asset Details",
  //       fields: [
  //         { name: "assetSerial", label: "Serial Number", type: "text", maxLength: 80 },
  //         { name: "assetTag", label: "Asset Tag", type: "text", required: true, maxLength: 60 },
  //         { name: "vendor", label: "Vendor", type: "select", options: common.vendors },
  //         { name: "barcode", label: "Barcode/QR Code", type: "text", maxLength: 80 },
  //         { name: "purchaseCost", label: "Purchase Cost", type: "number", min: 0, max: 10000000 },
  //         { name: "acquisitionDate", label: "Acquisition Date", type: "date" },
  //         { name: "expiryDate", label: "Expiry Date", type: "date" },
  //         { name: "warrantyExpiryDate", label: "Warranty Expiry Date", type: "date" },
  //         { name: "location", label: "Location", type: "text", maxLength: 120 },
  //       ],
  //     },
  //     {
  //       sectionTitle: "Asset Status",
  //       fields: [
  //         { name: "status", label: "Asset is currently", type: "select", options: common.status },
  //         { name: "state", label: "State", type: "select", options: common.status },
  //         { name: "stateComments", label: "State Comments", type: "textarea", maxLength: 400 },
  //       ],
  //     },
  //     {
  //       sectionTitle: "Network Details",
  //       fields: [
  //         { name: "ipAddress", label: "IP Address", type: "text", maxLength: 40 },
  //         { name: "macAddress", label: "MAC Address", type: "text", maxLength: 40 },
  //         { name: "nic", label: "NIC", type: "select", options: common.nicTypes },
  //         { name: "network", label: "Network", type: "select", options: common.networks },
  //         { name: "defaultGateway", label: "Default Gateway", type: "text", maxLength: 80 },
  //         { name: "dhcpEnabled", label: "DHCP Enabled", type: "select", options: [{ value: "True", label: "True" }, { value: "False", label: "False" }] },
  //         { name: "dhcpServer", label: "DHCP Server", type: "text", maxLength: 80 },
  //         { name: "dnsHostname", label: "DNS Hostname", type: "text", maxLength: 120 },
  //         { name: "type", label: "Type", type: "select", options: common.types },
  //       ],
  //     },
  //   ],
  // },

cpu: {
  sections: [

    {
      sectionTitle: "Basic Information",
      fields: [
        { name: "assetName", label: "Asset Name", type: "text", required: true, maxLength: 120 },
        { name: "assetCategory", label: "Asset Category", type: "select", options: common.assetCategories, required: true },
        { name: "manufacturer", label: "Manufacturer", type: "text", required: true, maxLength: 100 },
        { name: "model", label: "Model", type: "text", required: true, maxLength: 100 },
        { name: "deviceType", label: "Device Type", type: "select", options: common.deviceTypes }, 
        { name: "domain", label: "Domain / Workgroup", type: "select", options: common.domains },
      ],
    },

    {
      sectionTitle: "Operating System",
      fields: [
        { name: "osName", label: "OS Name", type: "text", maxLength: 100 },
        { name: "osEdition", label: "OS Edition", type: "text", maxLength: 80 },
        { name: "osVersion", label: "OS Version", type: "text", maxLength: 40 },
        { name: "buildNumber", label: "Build Number", type: "text", maxLength: 40 },
        { name: "osLicenseKey", label: "OS License Key", type: "text", maxLength: 120 },
        { name: "activationStatus", label: "Activation Status", type: "select", options: common.activationStatus },
      ],
    },

    {
      sectionTitle: "Memory",
      fields: [
        { name: "totalRamGB", label: "Total RAM (GB)", type: "number", min: 1, max: 2048 },
        { name: "ramType", label: "RAM Type (DDR4/DDR5)", type: "select", options: [{ value: "DDR3", label: "DDR3" },{ value: "DDR4", label: "DDR4" }, { value: "DDR5", label: "DDR5" }], maxLength: 40, },
        { name: "ramSlotsUsed", label: "RAM Slots Used", type: "number", min: 1, max: 16 },
      ],
    },

    {
      sectionTitle: "Processor",
      fields: [
        { name: "cpuModel", label: "Processor Model", type: "text", required: true, maxLength: 120 },
        { name: "cpuManufacturer", label: "Processor Manufacturer", type: "text", required: true, maxLength: 80 },
        { name: "clockSpeedGHz", label: "Clock Speed (GHz)", type: "number", min: 0, max: 10 },
        { name: "cores", label: "Number of Cores", type: "number", min: 1, max: 256 },
        { name: "threads", label: "Number of Threads", type: "number", min: 1, max: 512 },
        { name: "virtualizationEnabled", label: "Virtualization Enabled", type: "select", options: common.booleanOptions },
      ],
    },

    {
      sectionTitle: "Storage",
      fields: [
        { name: "storageType", label: "Storage Type", type: "select", options: common.storageTypes },
        { name: "diskModel", label: "Disk Model", type: "text", maxLength: 100 },
        { name: "diskSerial", label: "Disk Serial Number", type: "text", maxLength: 100 },
        { name: "diskCapacityGB", label: "Total Capacity (GB)", type: "number", min: 0, max: 200000 },
        { name: "raidConfigured", label: "RAID Configured", type: "select", options: common.booleanOptions },
        { name: "encryptionEnabled", label: "Disk Encryption Enabled", type: "select", options: common.booleanOptions },
      ],
    },

    {
      sectionTitle: "BIOS & Hardware",
      fields: [
        { name: "biosVersion", label: "BIOS Version", type: "text", maxLength: 80 },
        { name: "biosDate", label: "BIOS Release Date", type: "date" },
        { name: "motherboardSerial", label: "Motherboard Serial Number", type: "text", maxLength: 120 },
        { name: "hardwareUUID", label: "Hardware UUID", type: "text", maxLength: 120 },
        { name: "tpmVersion", label: "TPM Version", type: "text", maxLength: 40 },
        { name: "secureBootEnabled", label: "Secure Boot Enabled", type: "select", options: common.booleanOptions },
      ],
    },

    {
      sectionTitle: "Asset Financial Details",
      fields: [
        { name: "assetTag", label: "Asset Tag", type: "text", required: true, maxLength: 80 },
        { name: "serialNumber", label: "Serial Number", type: "text", required: true, maxLength: 120 },
        { name: "vendor", label: "Vendor", type: "select", options: common.vendors },
        { name: "purchaseCost", label: "Purchase Cost", type: "number", min: 0, max: 50000000 },
        { name: "acquisitionDate", label: "Acquisition Date", type: "date" },
        { name: "warrantyExpiryDate", label: "Warranty Expiry Date", type: "date" },
        { name: "depreciationMethod", label: "Depreciation Method", type: "select", options: common.depreciationMethods },
        { name: "usefulLifeYears", label: "Useful Life (Years)", type: "number", min: 1, max: 20 },
        { name: "residualValue", label: "Residual Value", type: "number", min: 0, max: 10000000 },
      ],
    },

    {
      sectionTitle: "Location & Assignment",
      fields: [
        { name: "branch", label: "Branch", type: "select", options: common.branches },
        { name: "building", label: "Building", type: "text", maxLength: 100 },
        { name: "floor", label: "Floor", type: "text", maxLength: 40 },
        { name: "room", label: "Room", type: "text", maxLength: 80 },
        { name: "assignedTo", label: "Assigned To (User ID)", type: "text", maxLength: 80 },
        { name: "assignmentDate", label: "Assignment Date", type: "date" },
      ],
    },

    {
      sectionTitle: "Asset Lifecycle Status",
      fields: [
        { name: "lifecycleStatus", label: "Lifecycle Status", type: "select", options: common.lifecycleStatus },
        { name: "operationalStatus", label: "Operational Status", type: "select", options: common.operationalStatus },
        { name: "lastAuditDate", label: "Last Physical Audit Date", type: "date" },
        { name: "remarks", label: "Remarks", type: "textarea", maxLength: 500 },
      ],
    },

    {
      sectionTitle: "Network Details",
      fields: [
        { name: "hostname", label: "Hostname", type: "text", maxLength: 120 },
        { name: "ipAddress", label: "IP Address", type: "text", maxLength: 40 },
        { name: "macAddress", label: "MAC Address", type: "text", maxLength: 40 },
        { name: "nicType", label: "NIC Type", type: "select", options: common.nicTypes },
        { name: "vlan", label: "VLAN", type: "text", maxLength: 40 },
        { name: "dhcpEnabled", label: "DHCP Enabled", type: "select", options: common.booleanOptions },
        { name: "dnsHostname", label: "DNS Hostname", type: "text", maxLength: 120 },
      ],
    },

  ],
},

  // monitor: {
  //   sections: [
  //     {
  //       sectionTitle: "Monitor Details",
  //       fields: [
  //         { name: "modelNumber", label: "Model Number", type: "text", required: true },
  //         { name: "serialNumber", label: "Serial Number", type: "text" },
  //         { name: "vendor", label: "Vendor", type: "select", options: common.vendors },
  //         { name: "sizeInInches", label: "Size (in Inches)", type: "number", min: 10, max: 60 },
  //         { name: "maxResolution", label: "Max Resolution", type: "text" },
  //       ],
  //     },
  //   ],
  // },

monitor: {
  sections: [

    {
      sectionTitle: "Basic Information",
      fields: [
        { name: "assetName", label: "Asset Name", type: "text", required: true, maxLength: 120 },
        { name: "assetCategory", label: "Asset Category", type: "select", options: common.assetCategories, required: true },
        { name: "manufacturer", label: "Manufacturer", type: "text", required: true, maxLength: 100 },
        { name: "model", label: "Model", type: "text", required: true, maxLength: 100 },
        { name: "monitorType", label: "Monitor Type", type: "select", options: common.monitorTypes }, 
        { name: "usageType", label: "Usage Type", type: "select", options: common.usageTypes }, 
      ],
    },

    {
      sectionTitle: "Display Specifications",
      fields: [
        { name: "screenSizeInches", label: "Screen Size (Inches)", type: "number", min: 10, max: 150 },
        { name: "resolution", label: "Resolution", type: "text", maxLength: 40 }, 
        { name: "panelType", label: "Panel Type (IPS/TN/VA/OLED)", type: "text", maxLength: 40 },
        { name: "refreshRateHz", label: "Refresh Rate (Hz)", type: "number", min: 30, max: 500 },
        { name: "aspectRatio", label: "Aspect Ratio", type: "text", maxLength: 20 },
        { name: "brightnessNits", label: "Brightness (Nits)", type: "number", min: 100, max: 5000 },
        { name: "responseTimeMs", label: "Response Time (ms)", type: "number", min: 1, max: 50 },
        { name: "curved", label: "Curved Display", type: "select", options: common.booleanOptions },
      ],
    },

    {
      sectionTitle: "Ports & Connectivity",
      fields: [
        { name: "hdmiPorts", label: "HDMI Ports", type: "number", min: 0, max: 10 },
        { name: "displayPort", label: "DisplayPort Ports", type: "number", min: 0, max: 10 },
        { name: "vgaPort", label: "VGA Port Available", type: "select", options: common.booleanOptions },
        { name: "usbPorts", label: "USB Ports", type: "number", min: 0, max: 20 },
        { name: "audioOut", label: "Audio Out Port", type: "select", options: common.booleanOptions },
        { name: "builtInSpeakers", label: "Built-in Speakers", type: "select", options: common.booleanOptions },
      ],
    },

    {
      sectionTitle: "Physical & Mounting",
      fields: [
        { name: "color", label: "Color", type: "text", maxLength: 40 },
        { name: "weightKg", label: "Weight (Kg)", type: "number", min: 0, max: 100 },
        { name: "vesaMountSupported", label: "VESA Mount Supported", type: "select", options: common.booleanOptions },
        { name: "standAdjustable", label: "Height Adjustable Stand", type: "select", options: common.booleanOptions },
        { name: "wallMounted", label: "Wall Mounted", type: "select", options: common.booleanOptions },
      ],
    },

    {
      sectionTitle: "Power & Energy",
      fields: [
        { name: "powerConsumptionWatt", label: "Power Consumption (Watts)", type: "number", min: 1, max: 2000 },
        { name: "energyRating", label: "Energy Rating", type: "text", maxLength: 20 },
        { name: "voltageRange", label: "Voltage Range", type: "text", maxLength: 40 },
      ],
    },

    {
      sectionTitle: "Asset Financial Details",
      fields: [
        { name: "assetTag", label: "Asset Tag", type: "text", required: true, maxLength: 80 },
        { name: "serialNumber", label: "Serial Number", type: "text", required: true, maxLength: 120 },
        { name: "vendor", label: "Vendor", type: "select", options: common.vendors },
        { name: "barcode", label: "Barcode / QR Code", type: "text", maxLength: 120 },
        { name: "purchaseCost", label: "Purchase Cost", type: "number", min: 0, max: 5000000 },
        { name: "acquisitionDate", label: "Acquisition Date", type: "date" },
        { name: "warrantyExpiryDate", label: "Warranty Expiry Date", type: "date" },
        { name: "depreciationMethod", label: "Depreciation Method", type: "select", options: common.depreciationMethods },
        { name: "usefulLifeYears", label: "Useful Life (Years)", type: "number", min: 1, max: 15 },
        { name: "residualValue", label: "Residual Value", type: "number", min: 0, max: 1000000 },
      ],
    },

    {
      sectionTitle: "Location & Assignment",
      fields: [
        { name: "branch", label: "Branch", type: "select", options: common.branches },
        { name: "building", label: "Building", type: "text", maxLength: 100 },
        { name: "floor", label: "Floor", type: "text", maxLength: 40 },
        { name: "room", label: "Room", type: "text", maxLength: 80 },
        { name: "assignedTo", label: "Assigned To (User ID)", type: "text", maxLength: 80 },
        { name: "assignmentDate", label: "Assignment Date", type: "date" },
      ],
    },

    {
      sectionTitle: "Asset Lifecycle Status",
      fields: [
        { name: "lifecycleStatus", label: "Lifecycle Status", type: "select", options: common.lifecycleStatus },
        { name: "operationalStatus", label: "Operational Status", type: "select", options: common.operationalStatus },
        { name: "lastAuditDate", label: "Last Physical Audit Date", type: "date" },
        { name: "condition", label: "Physical Condition", type: "select", options: common.conditionStatus },
        { name: "remarks", label: "Remarks", type: "textarea", maxLength: 500 },
      ],
    },

  ],
},



  printer: {
  sections: [

    {
      sectionTitle: "Basic Information",
      fields: [
        { name: "assetName", label: "Asset Name", type: "text", required: true, maxLength: 120 },
        { name: "assetCategory", label: "Asset Category", type: "select", options: common.assetCategories, required: true },
        { name: "manufacturer", label: "Manufacturer", type: "text", required: true, maxLength: 100 },
        { name: "model", label: "Model", type: "text", required: true, maxLength: 100 },
        { name: "printerType", label: "Printer Type", type: "select", options: common.printerTypes }, 
        { name: "functionType", label: "Function Type", type: "select", options: common.printerFunctions }, 
      ],
    },

    {
      sectionTitle: "Print Specifications",
      fields: [
        { name: "printTechnology", label: "Print Technology", type: "select", options: common.printTechnologies }, 
        { name: "colorSupport", label: "Color Printing Supported", type: "select", options: common.booleanOptions },
        { name: "printSpeedPPM", label: "Print Speed (PPM)", type: "number", min: 1, max: 500 },
        { name: "maxResolutionDPI", label: "Max Resolution (DPI)", type: "number", min: 300, max: 9600 },
        { name: "monthlyDutyCycle", label: "Monthly Duty Cycle (Pages)", type: "number", min: 1000, max: 1000000 },
        { name: "recommendedMonthlyVolume", label: "Recommended Monthly Volume", type: "number", min: 1000, max: 500000 },
        { name: "duplexPrinting", label: "Duplex Printing Supported", type: "select", options: common.booleanOptions },
      ],
    },

    {
      sectionTitle: "Scanner & Copier (If MFP)",
      fields: [
        { name: "scannerAvailable", label: "Scanner Available", type: "select", options: common.booleanOptions },
        { name: "scanResolutionDPI", label: "Scan Resolution (DPI)", type: "number", min: 300, max: 4800 },
        { name: "adfAvailable", label: "ADF Available", type: "select", options: common.booleanOptions },
        { name: "copySpeedCPM", label: "Copy Speed (CPM)", type: "number", min: 1, max: 500 },
      ],
    },

    {
      sectionTitle: "Cartridge / Toner Details",
      fields: [
        { name: "cartridgeModel", label: "Cartridge / Toner Model", type: "text", maxLength: 120 },
        { name: "cartridgeType", label: "Cartridge Type (Black/Color)", type: "text", maxLength: 80 },
        { name: "yieldPages", label: "Cartridge Yield (Pages)", type: "number", min: 100, max: 100000 },
        { name: "lastCartridgeChangeDate", label: "Last Cartridge Change Date", type: "date" },
      ],
    },

    {
      sectionTitle: "Connectivity & Network",
      fields: [
        { name: "connectionType", label: "Connection Type", type: "select", options: common.connectionTypes }, 
        { name: "hostname", label: "Hostname", type: "text", maxLength: 120 },
        { name: "ipAddress", label: "IP Address", type: "text", maxLength: 40 },
        { name: "macAddress", label: "MAC Address", type: "text", maxLength: 40 },
        { name: "wifiSupported", label: "WiFi Supported", type: "select", options: common.booleanOptions },
        { name: "ethernetPort", label: "Ethernet Port Available", type: "select", options: common.booleanOptions },
      ],
    },

    {
      sectionTitle: "Physical & Power",
      fields: [
        { name: "color", label: "Color", type: "text", maxLength: 40 },
        { name: "weightKg", label: "Weight (Kg)", type: "number", min: 0, max: 200 },
        { name: "powerConsumptionWatt", label: "Power Consumption (Watts)", type: "number", min: 10, max: 5000 },
        { name: "voltageRange", label: "Voltage Range", type: "text", maxLength: 40 },
      ],
    },

    {
      sectionTitle: "Asset Financial Details",
      fields: [
        { name: "assetTag", label: "Asset Tag", type: "text", required: true, maxLength: 80 },
        { name: "serialNumber", label: "Serial Number", type: "text", required: true, maxLength: 120 },
        { name: "vendor", label: "Vendor", type: "select", options: common.vendors },
        { name: "barcode", label: "Barcode / QR Code", type: "text", maxLength: 120 },
        { name: "purchaseCost", label: "Purchase Cost", type: "number", min: 0, max: 10000000 },
        { name: "acquisitionDate", label: "Acquisition Date", type: "date" },
        { name: "warrantyExpiryDate", label: "Warranty Expiry Date", type: "date" },
        { name: "amcAvailable", label: "AMC Available", type: "select", options: common.booleanOptions },
        { name: "amcExpiryDate", label: "AMC Expiry Date", type: "date" },
        { name: "depreciationMethod", label: "Depreciation Method", type: "select", options: common.depreciationMethods },
        { name: "usefulLifeYears", label: "Useful Life (Years)", type: "number", min: 1, max: 15 },
        { name: "residualValue", label: "Residual Value", type: "number", min: 0, max: 2000000 },
      ],
    },

    {
      sectionTitle: "Location & Assignment",
      fields: [
        { name: "branch", label: "Branch", type: "select", options: common.branches },
        { name: "building", label: "Building", type: "text", maxLength: 100 },
        { name: "floor", label: "Floor", type: "text", maxLength: 40 },
        { name: "room", label: "Room", type: "text", maxLength: 80 },
        { name: "assignedDepartment", label: "Assigned Department", type: "text", maxLength: 80 },
        { name: "assignmentDate", label: "Assignment Date", type: "date" },
      ],
    },

    {
      sectionTitle: "Asset Lifecycle Status",
      fields: [
        { name: "lifecycleStatus", label: "Lifecycle Status", type: "select", options: common.lifecycleStatus },
        { name: "operationalStatus", label: "Operational Status", type: "select", options: common.operationalStatus },
        { name: "totalPrintCount", label: "Total Print Count", type: "number", min: 0, max: 100000000 },
        { name: "lastServiceDate", label: "Last Service Date", type: "date" },
        { name: "condition", label: "Physical Condition", type: "select", options: common.conditionStatus },
        { name: "remarks", label: "Remarks", type: "textarea", maxLength: 500 },
      ],
    },

  ],
},

laptop: {
  sections: [

    {
      sectionTitle: "Basic Information",
      fields: [
        { name: "assetName", label: "Asset Name", type: "text", required: true, maxLength: 120 },
        { name: "assetCategory", label: "Asset Category", type: "select", options: common.assetCategories, required: true },
        { name: "manufacturer", label: "Manufacturer", type: "text", required: true, maxLength: 100 },
        { name: "model", label: "Model", type: "text", required: true, maxLength: 100 },
        { name: "formFactor", label: "Form Factor (Ultrabook/Notebook)", type: "text", maxLength: 80 },
        { name: "domain", label: "Domain / Workgroup", type: "select", options: common.domains },
      ],
    },

    {
      sectionTitle: "Operating System",
      fields: [
        { name: "osName", label: "OS Name", type: "text", maxLength: 100 },
        { name: "osEdition", label: "OS Edition", type: "text", maxLength: 80 },
        { name: "osVersion", label: "OS Version", type: "text", maxLength: 40 },
        { name: "buildNumber", label: "Build Number", type: "text", maxLength: 40 },
        { name: "osLicenseKey", label: "OS License Key", type: "text", maxLength: 120 },
        { name: "activationStatus", label: "Activation Status", type: "select", options: common.activationStatus },
      ],
    },

    {
      sectionTitle: "Processor & Memory",
      fields: [
        { name: "cpuModel", label: "Processor Model", type: "text", required: true, maxLength: 120 },
        { name: "cpuManufacturer", label: "Processor Manufacturer", type: "text", required: true, maxLength: 80 },
        { name: "clockSpeedGHz", label: "Clock Speed (GHz)", type: "number", min: 0, max: 10 },
        { name: "cores", label: "Number of Cores", type: "number", min: 1, max: 32 },
        { name: "threads", label: "Number of Threads", type: "number", min: 1, max: 64 },
        { name: "totalRamGB", label: "Total RAM (GB)", type: "number", min: 4, max: 128 },
        { name: "ramType", label: "RAM Type (DDR4/DDR5)", type: "text", maxLength: 40 },
      ],
    },

    {
      sectionTitle: "Storage",
      fields: [
        { name: "storageType", label: "Storage Type", type: "select", options: common.storageTypes },
        { name: "diskCapacityGB", label: "Total Capacity (GB)", type: "number", min: 128, max: 8000 },
        { name: "diskModel", label: "Disk Model", type: "text", maxLength: 100 },
        { name: "diskSerial", label: "Disk Serial Number", type: "text", maxLength: 100 },
        { name: "encryptionEnabled", label: "Disk Encryption Enabled", type: "select", options: common.booleanOptions },
      ],
    },

    {
      sectionTitle: "Display & Graphics",
      fields: [
        { name: "screenSizeInches", label: "Screen Size (Inches)", type: "number", min: 10, max: 20 },
        { name: "resolution", label: "Resolution", type: "text", maxLength: 40 },
        { name: "panelType", label: "Panel Type (IPS/OLED)", type: "text", maxLength: 40 },
        { name: "graphicsType", label: "Graphics Type (Integrated/Dedicated)", type: "text", maxLength: 80 },
        { name: "graphicsModel", label: "Graphics Model", type: "text", maxLength: 100 },
      ],
    },

    {
      sectionTitle: "Battery & Power",
      fields: [
        { name: "batteryCapacityWh", label: "Battery Capacity (Wh)", type: "number", min: 10, max: 200 },
        { name: "batteryHealthPercent", label: "Battery Health (%)", type: "number", min: 0, max: 100 },
        { name: "batteryCycleCount", label: "Battery Cycle Count", type: "number", min: 0, max: 5000 },
        { name: "chargerSerial", label: "Charger Serial Number", type: "text", maxLength: 120 },
        { name: "fastChargingSupported", label: "Fast Charging Supported", type: "select", options: common.booleanOptions },
      ],
    },

    {
      sectionTitle: "Security & Hardware",
      fields: [
        { name: "tpmVersion", label: "TPM Version", type: "text", maxLength: 40 },
        { name: "secureBootEnabled", label: "Secure Boot Enabled", type: "select", options: common.booleanOptions },
        { name: "fingerprintScanner", label: "Fingerprint Scanner", type: "select", options: common.booleanOptions },
        { name: "faceRecognition", label: "Face Recognition", type: "select", options: common.booleanOptions },
        { name: "hardwareUUID", label: "Hardware UUID", type: "text", maxLength: 120 },
      ],
    },

    {
      sectionTitle: "Asset Financial Details",
      fields: [
        { name: "assetTag", label: "Asset Tag", type: "text", required: true, maxLength: 80 },
        { name: "serialNumber", label: "Serial Number", type: "text", required: true, maxLength: 120 },
        { name: "vendor", label: "Vendor", type: "select", options: common.vendors },
        { name: "barcode", label: "Barcode / QR Code", type: "text", maxLength: 120 },
        { name: "purchaseCost", label: "Purchase Cost", type: "number", min: 0, max: 5000000 },
        { name: "acquisitionDate", label: "Acquisition Date", type: "date" },
        { name: "warrantyExpiryDate", label: "Warranty Expiry Date", type: "date" },
        { name: "amcAvailable", label: "AMC Available", type: "select", options: common.booleanOptions },
        { name: "amcExpiryDate", label: "AMC Expiry Date", type: "date" },
        { name: "depreciationMethod", label: "Depreciation Method", type: "select", options: common.depreciationMethods },
        { name: "usefulLifeYears", label: "Useful Life (Years)", type: "number", min: 1, max: 10 },
        { name: "residualValue", label: "Residual Value", type: "number", min: 0, max: 2000000 },
      ],
    },

    {
      sectionTitle: "Location & Assignment",
      fields: [
        { name: "branch", label: "Branch", type: "select", options: common.branches },
        { name: "building", label: "Building", type: "text", maxLength: 100 },
        { name: "floor", label: "Floor", type: "text", maxLength: 40 },
        { name: "room", label: "Room", type: "text", maxLength: 80 },
        { name: "assignedTo", label: "Assigned To (User ID)", type: "text", maxLength: 80 },
        { name: "assignmentDate", label: "Assignment Date", type: "date" },
      ],
    },

    {
      sectionTitle: "Asset Lifecycle Status",
      fields: [
        { name: "lifecycleStatus", label: "Lifecycle Status", type: "select", options: common.lifecycleStatus },
        { name: "operationalStatus", label: "Operational Status", type: "select", options: common.operationalStatus },
        { name: "lastAuditDate", label: "Last Physical Audit Date", type: "date" },
        { name: "condition", label: "Physical Condition", type: "select", options: common.conditionStatus },
        { name: "remarks", label: "Remarks", type: "textarea", maxLength: 500 },
      ],
    },

  ],
},




  keyboard: {
    sections: [
      {
        sectionTitle: "Keyboard Details",
        fields: [
          { name: "modelNumber", label: "Model Number", type: "text", required: true },
          { name: "serialNumber", label: "Serial Number", type: "text" },
          { name: "vendor", label: "Vendor", type: "select", options: common.vendors },
          { name: "keyboardType", label: "Type", type: "select", options: [{ value: "Mechanical", label: "Mechanical" }, { value: "Membrane", label: "Membrane" }] },
        ],
      },
    ],
  },
};
