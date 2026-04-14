import { common } from "../common.js";
// @ts-ignore
import { fromGeneric } from "../sectionManager.js";

export const lookupOptions = {
  category: (categoryName) => ({ __lookupCategory: String(categoryName || "").trim().toLowerCase() }),
};

const toBoolEnabledDisabled = () => [
  { value: "Enabled", label: "Enabled" },
  { value: "Disabled", label: "Disabled" },
];

export const fixedConfigs = {
  //TODO  CPU Configuration
  cpu: {
    sections: [
      //! Basic Information
      fromGeneric("Basic Information", {
        // Example: hide description field coming from generic
        omitFields: ["assetDescription", "barcode","assetName","assetSubType","modelNumber", "assetCategory","assetType","brand","assetCondition",],
        // overrideFields: [{},{},{}  ],
        // addFields: [{},{},{}],
      }),
      //! Location Information
      fromGeneric("Location & Other Information",{
         omitFields: ["organization","rackNumber","rackUnit", "location", "floor", "room", "locationType", "building"],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
        }),
      //! Operating System
      {
        sectionTitle: "Operating System",
        fields: [
          { name: "osName", label: "OS Name", placeholder: "e.g. Windows 10", type: "text", maxLength: 100 },
          { name: "osEdition", label: "OS Edition", placeholder: "e.g. Professional", type: "text", maxLength: 80 },
          { name: "osVersion", label: "OS Version", placeholder: "e.g. 10.0.19041", type: "text", maxLength: 40 },
          { name: "buildNumber", label: "Build Number", placeholder: "e.g. 19041", type: "text", maxLength: 40 },
          { name: "osLicenseKey", label: "OS License Key", placeholder: "e.g. XXXXX-XXXXX-XXXXX-XXXXX-XXXXX", type: "text", maxLength: 120 },
          { name: "activationStatus", label: "Activation Status", placeholder: "e.g. Licensed", type: "select", options: common.activationStatus },
          { name: "domain", label: "Domain / Workgroup", type: "select", options: common.domains },
        ],
      },
      //! Memory
      {
        sectionTitle: "Memory",
        fields: [
          { name: "ramManufacturer", placeholder: "e.g. Corsair", label: "Memory Manufacturer", type: "text", maxLength: 80 },
          { name: "ramModelNumber", placeholder: "e.g. Vengeance LPX", label: "Memory Part/Model Number", type: "text", maxLength: 100 },
          { name: "ramSerialNumber", placeholder: "e.g. 1234567890", label: "Memory Serial Number", type: "text", maxLength: 100 },
          { name: "ramCapacityGB", placeholder: "e.g. 16", label: "Memory Capacity (GB)", type: "number", min: 1, max: 512,},
          { name: "ramType", label: "RAM Type", type: "select", options: lookupOptions.category("ram_type") },
          { name: "ramSpeedMHz", placeholder: "e.g. 3200", label: "Speed (MHz)", type: "number", min: 400, max: 1000000 },
          { name: "ramFormFactor", placeholder: "e.g. DIMM", label: "Form Factor", type: "text", maxLength: 40 },
          { name: "ramSlot", placeholder: "e.g. DIMM Slot 1", label: "Memory Slot", type: "text", maxLength: 40 },
          { name: "ramChannel", placeholder: "e.g. Channel 1", label: "Channel", type: "text", maxLength: 40 },
          
        ],
      },
      //! Processor
      {
        sectionTitle: "Processor",
        fields: [
          
          { 
            name: "processorManufacturer", 
            label: "Processor Manufacturer",
            type: "select", 
            // required: true, 
            options: [
              { value: "intel", label: "Intel" },
              { value: "amd", label: "AMD" },
              { value: "apple", label: "Apple" },

            ] },

            { 
            name: "processorModel", 
            label: "Processor Series", 
            type: "select", 
            // required: true, 
            options:[
              { value: "i9", label: "Intel Core i9", showIf: { processorManufacturer: "intel" } },
              { value: "i7", label: "Intel Core i7", showIf: { processorManufacturer: "intel" } },
              { value: "i5", label: "Intel Core i5", showIf: { processorManufacturer: "intel" } },
              { value: "i3", label: "Intel Core i3", showIf: { processorManufacturer: "intel" } },

              { value: "ryzen9", label: "AMD Ryzen 9", showIf: { processorManufacturer: "amd" } },
              { value: "ryzen7", label: "AMD Ryzen 7", showIf: { processorManufacturer: "amd" } },
              { value: "ryzen5", label: "AMD Ryzen 5", showIf: { processorManufacturer: "amd" } },
              { value: "ryzen3", label: "AMD Ryzen 3", showIf: { processorManufacturer: "amd" } },

              { value: "m3", label: "Apple M3", showIf: { processorManufacturer: "apple" } },
              { value: "m2", label: "Apple M2", showIf: { processorManufacturer: "apple" } },
              { value: "m1", label: "Apple M1", showIf: { processorManufacturer: "apple" } },
              
            ] 
          
          },
          { name: "processorGeneration", placeholder: "e.g. 11", label: "Processor Generation", type: "number", min: 0, max: 100 },
          { name: "processorModelNumber", placeholder: "e.g. i7-11800H", label: "Processor Model Number", type: "text", maxLength: 40 },
          { name: "cores", placeholder: "e.g. 8", label: "Number of Cores", type: "number", min: 1, max: 256 },
          { name: "threads", placeholder: "e.g. 16", label: "Number of Threads",  type: "number", min: 1, max: 512 },
          { name: "virtualizationEnabled", label: "Virtualization Enabled", type: "select", options: common.booleanOptions },
        ],
      },
      //! Storage
      {
        sectionTitle: "Storage",
        fields: [
          { name: "driveManufacturer", label: "Drive Manufacturer", placeholder: "e.g. Samsung", type: "text", maxLength: 80 },
          { name: "driveModelNumber", label: "Drive Model Number", placeholder: "e.g. M.2 SSD", type: "text", maxLength: 120 },
          { name: "driveSerial", label: "Serial Number", placeholder: "e.g. 1234567890", type: "text", maxLength: 120 },
          { name: "driveCapacityGB", label: "Capacity (GB)", placeholder: "e.g. 1000", type: "number", min: 1, max: 200000 },
          { name: "driveType", label: "Drive Type", type: "select", options: lookupOptions.category("storage_type") },
          { name: "driveInterfaceSpeed", label: "Interface Speed", placeholder: "e.g. PCIe 4.0", type: "text", maxLength: 40 },
          // { name: "driveSlot", label: "Slot Label", type: "text", maxLength: 40 },
          { name: "raidConfigured", label: "RAID Configured", type: "select", options: common.booleanOptions },
          { name: "encryptionEnabled", label: "Disk Encryption Enabled", type: "select", options: common.booleanOptions },
        ],
      },
      //! BIOS & Hardware
      {
        sectionTitle: "BIOS & Hardware",
        fields: [
          { name: "biosVersion", label: "BIOS Version", placeholder: "e.g. 1.00", type: "text", maxLength: 80 },
          { name: "biosDate", label: "BIOS Release Date", placeholder: "e.g. 2023-01-01", type: "date" },
          { name: "motherboardSerial", label: "Motherboard Serial Number", placeholder: "e.g. MB1234567890", type: "text", maxLength: 120 },
          { name: "hardwareUUID", label: "Hardware UUID", placeholder: "e.g. 12345678-1234-1234-1234-1234567890AB", type: "text", maxLength: 120 },
          { name: "tpmVersion", label: "TPM Version", placeholder: "e.g. 2.0", type: "text", maxLength: 40 },
          { name: "secureBootEnabled", label: "Secure Boot Enabled", type: "select", options: common.booleanOptions },
        ],
      },

      //! Graphics Card
      {
        sectionTitle: "Graphics Card",
        fields: [
          {name: "graphicCard", label: "Graphic Card", type: "select", options: common.booleanOptions, defaultValue: "No" },
          { name: "gpuManufacturer", placeholder: "e.g. NVIDIA", label: "Graphics Card Manufacturer", type: "text", maxLength: 80, showIf: { graphicCard: "Yes" } },
          { name: "gpuModelNumber", placeholder: "e.g. RTX 3060", label: "Graphics Card Model Number", type: "text", maxLength: 120, showIf: { graphicCard: "Yes" } },
          { name: "gpuSerialNumber", placeholder: "e.g. 1234567890", label: "Serial Number", type: "text", maxLength: 120, showIf: { graphicCard: "Yes" } },
          { name: "gpuCapacityGB", placeholder: "e.g. 6", label: "Capacity (GB)", type: "number", min: 1, max: 200000, showIf: { graphicCard: "Yes" } },
          {
            name: "gpuType",
            label: "Graphics Card Type",
            type: "select",
            options: lookupOptions.category("gpu_type"),
            showIf: { graphicCard: "Yes" },
          },
          { name: "gpuInterfaceSpeed", placeholder: "e.g. PCIe 4.0", label: "Interface Speed", type: "text", maxLength: 40, showIf: { graphicCard: "Yes" } },
        ],
      },

      //! Purchase Information
      fromGeneric("Purchase Information",{
         omitFields: ["taxAmount","currency"],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),
      //! Warranty Information
      fromGeneric("Warranty Information",{
        //  omitFields: ["","",""],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),

      //! Asset State
      fromGeneric("Asset State",{
        //  omitFields: ["","",""],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),
      //! Network Details
      fromGeneric("Network Details",{
         omitFields: ["linkSpeedMbps",],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),
    ],
  },
  //TODO  Monitor Configuration
  monitor: {
    sections: [
       //! Basic Information
      fromGeneric("Basic Information", {
        // Example: hide description field coming from generic
        omitFields: ["assetDescription", "barcode","assetName","assetSubType","modelNumber",  "assetCategory","assetType","brand","assetCondition",],
        // overrideFields: [{},{},{}  ],
        // addFields: [{},{},{}],
      }),
      //! Location Information
      fromGeneric("Location & Other Information",{
         omitFields: ["graphicCard","organization","rackNumber","rackUnit", "location", "floor", "room", "locationType", "building"],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
        }),
      //! Display Specifications
      {
        sectionTitle: "Display Specifications",
        fields: [
          { name: "screenSizeInches", placeholder: "e.g. 15.6", label: "Screen Size (Inches)", type: "number", min: 10, max: 150 },
          { name: "resolution", placeholder: "e.g. 1920x1080", label: "Resolution", type: "text", maxLength: 40 },
          { name: "panelType", placeholder: "e.g. IPS", label: "Panel Type (IPS/TN/VA/OLED)", type: "text", maxLength: 40 },
          { name: "refreshRateHz", placeholder: "e.g. 60", label: "Refresh Rate (Hz)", type: "number", min: 30, max: 500 },
          { name: "aspectRatio", placeholder: "e.g. 16:9", label: "Aspect Ratio", type: "text", maxLength: 20 },
          { name: "brightnessNits", placeholder: "e.g. 300", label: "Brightness (Nits)", type: "number", min: 100, max: 5000 },
          { name: "responseTimeMs", placeholder: "e.g. 1", label: "Response Time (ms)", type: "number", min: 1, max: 50 },
          { name: "curved", label: "Curved Display", type: "select", options: common.booleanOptions },
        ],
      },
      //! Ports & Connectivity
      {
        sectionTitle: "Ports & Connectivity",
        fields: [
          { name: "hdmiPorts", placeholder: "e.g. 2", label: "HDMI Ports", type: "number", min: 0, max: 10 },
          { name: "displayPort", placeholder: "e.g. 1", label: "DisplayPort Ports", type: "number", min: 0, max: 10 },
          { name: "vgaPort", label: "VGA Port Available", type: "select", options: common.booleanOptions },
          { name: "usbPorts", placeholder: "e.g. 4", label: "USB Ports", type: "number", min: 0, max: 20 },
          { name: "audioOut", label: "Audio Out Port", type: "select", options: common.booleanOptions },
          { name: "builtInSpeakers", label: "Built-in Speakers", type: "select", options: common.booleanOptions },
        ],
      },
      //! Power & Energy
      {
        sectionTitle: "Power & Energy",
        fields: [
          { name: "powerConsumptionWatt", placeholder: "e.g. 150", label: "Power Consumption (Watts)", type: "number", min: 1, max: 2000 },
          { name: "energyRating", placeholder: "e.g. A+", label: "Energy Rating", type: "text", maxLength: 20 },
          { name: "voltageRange", placeholder: "e.g. 12V", label: "Voltage Range", type: "text", maxLength: 40 },
        ],
      },
      
       //! Purchase Information
      fromGeneric("Purchase Information",{
         omitFields: ["taxAmount","currency"],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),
      //! Warranty Information
      fromGeneric ("Warranty Information",{
        //  omitFields: ["","",""],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),

      //! Asset State
      fromGeneric("Asset State",{
        //  omitFields: ["","",""],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),
      
      
    ],
  },

  //TODO  Printer Configuration
  printer: {
    sections: [
      //! Basic Information
      fromGeneric("Basic Information", {
        // Example: hide description field coming from generic
        omitFields: ["assetDescription", "barcode","assetSubType","assetName","modelNumber",  "assetCategory","assetType","brand","assetCondition",],
        // overrideFields: [{},{},{}  ],
        // addFields: [{},{},{}],
      }),
      //! Location Information
     fromGeneric("Location & Other Information",{
         omitFields: ["organization","rackNumber","rackUnit", "location", "floor", "room", "locationType", "building"],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
        }),

        //! Print Specifications
      {
        sectionTitle: "Print Specifications",
        fields: [
          { name: "printTechnology", label: "Print Technology", type: "select", options: common.printTechnologies },

          { name: "colorSupport", required: true,  label: "Color Printing Supported", type: "select", options: common.booleanOptions, defaultValue: "No" },

          { name: "printSpeedPPM", placeholder: "e.g. 30", label: "Print Speed (PPM)", type: "number", min: 1, max: 200 },

          { name: "maxResolutionDPI", placeholder: "e.g. 600", label: "Max Resolution (DPI)", type: "number", min: 300, max: 4800 },

          { name: "duplexPrinting", label: "Duplex Printing Supported", type: "select", options: common.booleanOptions },

          { name: "networkSupport", label: "Network Support", type: "select", options: common.booleanOptions, defaultValue: "No" },

          {name: "wirelessSupport", label: "Wireless Support", type: "select", options: common.booleanOptions, defaultValue: "No" },

          { name: "scannerSupport", label: "Scanner Support (MFP)", type: "select", options: common.booleanOptions, defaultValue: "No" },

          { name: "copierSupport", label: "Copier Support (MFP)", type: "select", options: common.booleanOptions, defaultValue: "No" },


        ],
      },

      // //! Asset Lifecycle Status
      // {
      //   sectionTitle: "Asset Lifecycle Status",
      //   fields: [

      //     { name: "totalPrintCount", placeholder: "e.g. 100000", label: "Total Print Count", type: "number", min: 0, max: 100000000 },

      //     { name: "lastServiceDate", label: "Last Service Date", type: "date" },

      //   ],
      // },

      // //! Scanner & Copier (If MFP)
      // {
      //   sectionTitle: "Scanner & Copier (If MFP)",
      //   fields: [
      //     { name: "scannerAvailable", label: "Scanner Available", type: "select", options: common.booleanOptions },

      //     { name: "scanResolutionDPI", placeholder: "e.g. 1200", label: "Scan Resolution (DPI)", type: "number", min: 300, max: 4800 },

      //     { name: "copySpeedCPM", placeholder: "e.g. 25", label: "Copy Speed (CPM)", type: "number", min: 1, max: 200 },
      //   ],
      // },

      //! Cartridge / Toner Details - Black Only (No Color Support)
      {
        sectionTitle: "Black Toner/Cartridge Details",
        showIf: { colorSupport: "No" },
        fields: [
          { name: "blackCartridgeModel", label: "Cartridge Model", type: "text", placeholder: "e.g. HP CF279A", maxLength: 100 },
          
          { name: "blackCartridgeYieldPages", label: "Yield (Pages)", type: "number", placeholder: "e.g. 1000", min: 0, max: 1000000 },
          
          { name: "blackCartridgePartNumber", label: "Part/Cartridge Number", type: "text", placeholder: "e.g. CF279A", maxLength: 100 },
          
          { name: "blackCartridgeManufacturer", label: "Manufacturer", type: "text", placeholder: "e.g. HP, Canon, Brother", maxLength: 80 },
          
          // { name: "blackCartridgeLastChanged", label: "Last Changed Date", type: "date" },
          
          // { name: "blackCartridgeEstimatedEnd", label: "Estimated End Date", type: "date" },
          
          // { name: "blackCartridgeNotes", label: "Notes", type: "textarea", rows: 2, placeholder: "e.g. Compatible with XY model" }
        ]
      },

      //! Cartridge / Toner Details - Multi-Color (With Color Support)
      {
        sectionTitle: "Cartridge / Toner Details",
        showIf: { colorSupport: "Yes" },
        fields: [
          { 
            name: "cartridgeColor", 
            label: "Cartridge Color", 
            type: "select", 
            options: [
              { value: "Black", label: "Black" },
              { value: "Cyan", label: "Cyan" },
              { value: "Magenta", label: "Magenta" },
              { value: "Yellow", label: "Yellow" },
              { value: "Light Cyan", label: "Light Cyan" },
              { value: "Light Magenta", label: "Light Magenta" },
              { value: "Photo Black", label: "Photo Black" },
              { value: "Gray", label: "Gray" },
              { value: "Red", label: "Red" },
              { value: "Blue", label: "Blue" },
              { value: "Green", label: "Green" }
            ] 
          },

          { 
            name: "cartridgeModel", 
            label: "Model Number", 
            type: "text",
            placeholder: "e.g. HP CF401X",
            maxLength: 100
          },

          { 
            name: "cartridgePartNumber", 
            label: "Part/Cartridge Number", 
            type: "text",
            placeholder: "e.g. CF401X",
            maxLength: 100
          },

          { 
            name: "cartridgeManufacturer", 
            label: "Manufacturer", 
            type: "text",
            placeholder: "e.g. HP, Canon, Brother",
            maxLength: 80
          },

          { 
            name: "cartridgeYieldPages", 
            label: "Yield (Pages)", 
            type: "number",
            placeholder: "e.g. 2300",
            min: 0,
            max: 1000000
          },

          { 
            name: "cartridgeLastChanged", 
            label: "Last Changed Date", 
            type: "date"
          },

          { 
            name: "cartridgeEstimatedEnd", 
            label: "Estimated End Date", 
            type: "date"
          }
        ]
      },

      //!Network Details
      fromGeneric("Network Details",{
        showIf: { networkSupport: "Yes" },
        //  omitFields: ["","",""],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),
      
      //! Physical & Power
      {
        sectionTitle: "Physical & Power",
        fields: [
          { name: "printerColor", placeholder: "e.g. Black", label: "Printer Color", type: "text", maxLength: 40 },
          { name: "powerConsumptionWatt", placeholder: "e.g. 200", label: "Power Consumption (Watts)", type: "number", min: 10, max: 5000 },
          { name: "voltageRange", placeholder: "e.g. 220V", label: "Voltage Range", type: "text", maxLength: 40 },
        ],
      },
       //! Purchase Information
      fromGeneric("Purchase Information",{
         omitFields: ["taxAmount","currency"],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),

       //! Warranty Information
      fromGeneric ("Warranty Information",{
        //  omitFields: ["","",""],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),
      //! Asset State
      fromGeneric("Asset State",{
        //  omitFields: ["","",""],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),
     
    ],
  },
  
  //TODO  Laptop Configuration
  laptop: {
    sections: [
      //! Basic Information
      fromGeneric("Basic Information", {
        // Example: hide description field coming from generic
        omitFields: ["assetDescription", "barcode","assetName","assetSubType","modelNumber",  "assetCategory","assetType","brand","assetCondition",],
        // overrideFields: [{},{},{}  ],
        // addFields: [{},{},{}],
      }),
      //! Location Information
      fromGeneric("Location & Other Information",{
         omitFields: ["organization","rackNumber","rackUnit", "location", "floor", "room", "locationType", "building"],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
        }),
        
        //! Processor
      {
        sectionTitle: "Processor",
        fields: [
          
          { 
            name: "processorManufacturer", 
            label: "Processor Manufacturer",
            type: "select", 
            required: true, 
            options: [
              { value: "intel", label: "Intel" },
              { value: "amd", label: "AMD" },
              { value: "apple", label: "Apple" },

            ] },

            { 
            name: "processorModel", 
            label: "Processor Series", 
            type: "select", 
            required: true, 
            options:[
              { value: "i9", label: "Intel Core i9", showIf: { processorManufacturer: "intel" } },
              { value: "i7", label: "Intel Core i7", showIf: { processorManufacturer: "intel" } },
              { value: "i5", label: "Intel Core i5", showIf: { processorManufacturer: "intel" } },
              { value: "i3", label: "Intel Core i3", showIf: { processorManufacturer: "intel" } },

              { value: "ryzen9", label: "AMD Ryzen 9", showIf: { processorManufacturer: "amd" } },
              { value: "ryzen7", label: "AMD Ryzen 7", showIf: { processorManufacturer: "amd" } },
              { value: "ryzen5", label: "AMD Ryzen 5", showIf: { processorManufacturer: "amd" } },
              { value: "ryzen3", label: "AMD Ryzen 3", showIf: { processorManufacturer: "amd" } },

              { value: "m3", label: "Apple M3", showIf: { processorManufacturer: "apple" } },
              { value: "m2", label: "Apple M2", showIf: { processorManufacturer: "apple" } },
              { value: "m1", label: "Apple M1", showIf: { processorManufacturer: "apple" } },
              
            ] 
          
          },
          { name: "processorGeneration", placeholder: "e.g. 11", label: "Processor Generation", type: "number", min: 0, max: 100 },
          { name: "processorModelNumber", placeholder: "e.g. i7-11800H", label: "Processor Model Number", type: "text", maxLength: 40 },
          { name: "cores", placeholder: "e.g. 8", label: "Number of Cores", type: "number", min: 1, max: 256 },
          { name: "threads", placeholder: "e.g. 16", label: "Number of Threads",  type: "number", min: 1, max: 512 },
          { name: "virtualizationEnabled", label: "Virtualization Enabled", type: "select", options: common.booleanOptions },
        ],
      },
      //! Memory
      {
        sectionTitle: "Memory",
        fields: [
          { name: "ramManufacturer", placeholder: "e.g. Corsair", label: "Memory Manufacturer", type: "text", maxLength: 80 },
          { name: "ramModelNumber", placeholder: "e.g. Vengeance LPX", label: "Memory Part/Model Number", type: "text", maxLength: 100 },
          { name: "ramSerialNumber", placeholder: "e.g. 1234567890", label: "Memory Serial Number", type: "text", maxLength: 100 },
          { name: "ramCapacityGB", placeholder: "e.g. 16", label: "Memory Capacity (GB)", type: "number", min: 1, max: 512,},
          {
            name: "ramType",
            label: "RAM Type",
            type: "select",
            options: lookupOptions.category("ram_type"),
          },
          { name: "ramSpeedMHz", placeholder: "e.g. 3200", label: "Speed (MHz)", type: "number", min: 400, max: 1000000 },
          { name: "ramFormFactor", placeholder: "e.g. DIMM", label: "Form Factor", type: "text", maxLength: 40 },
          { name: "ramSlot", placeholder: "e.g. DIMM Slot 1", label: "Memory Slot", type: "text", maxLength: 40 },
          { name: "ramChannel", placeholder: "e.g. Channel 1", label: "Channel", type: "text", maxLength: 40 },
          
        ],
      },
      
      //! Storage
      {
        sectionTitle: "Storage",
        fields: [
          { name: "driveManufacturer", label: "Drive Manufacturer", placeholder: "e.g. Samsung", type: "text", maxLength: 80 },
          { name: "driveModelNumber", label: "Drive Model Number", placeholder: "e.g. M.2 SSD", type: "text", maxLength: 120 },
          { name: "driveSerial", label: "Serial Number", placeholder: "e.g. 1234567890", type: "text", maxLength: 120 },
          { name: "driveCapacityGB", label: "Capacity (GB)", placeholder: "e.g. 1000", type: "number", min: 1, max: 200000 },
          {
            name: "driveType",
            label: "Drive Type",
            type: "select",
            options: lookupOptions.category("storage_type"),
          },
          { name: "driveInterfaceSpeed", label: "Interface Speed", placeholder: "e.g. PCIe 4.0", type: "text", maxLength: 40 },
          // { name: "driveSlot", label: "Slot Label", type: "text", maxLength: 40 },
          { name: "raidConfigured", label: "RAID Configured", type: "select", options: common.booleanOptions },
          { name: "encryptionEnabled", label: "Disk Encryption Enabled", type: "select", options: common.booleanOptions },
        ],
      },

      //! Operating System
      {
        sectionTitle: "Operating System",
        fields: [
          { name: "osName", placeholder: "e.g. Windows 10", label: "OS Name", type: "text", maxLength: 100 },
          { name: "osEdition", placeholder: "e.g. Professional", label: "OS Edition", type: "text", maxLength: 80 },
          { name: "osVersion", placeholder: "e.g. 10.0.19045", label: "OS Version", type: "text", maxLength: 40 },
          { name: "buildNumber", placeholder: "e.g. 19045", label: "Build Number", type: "text", maxLength: 40 },
          { name: "osLicenseKey", placeholder: "e.g. XXXXX-XXXXX-XXXXX-XXXXX-XXXXX", label: "OS License Key", type: "text", maxLength: 120 },
          { name: "activationStatus", label: "Activation Status", type: "select", options: common.activationStatus },
        ],
      },

      //! Display & Graphics
      {
        sectionTitle: "Display & Graphics",
        fields: [
          { name: "screenSizeInches", label: "Screen Size (Inches)", type: "number", min: 10, max: 20 },
          { name: "resolution", placeholder: "e.g. 1920x1080", label: "Resolution", type: "text", maxLength: 40 },
          { name: "panelType", placeholder: "e.g. IPS", label: "Panel Type (IPS/OLED)", type: "text", maxLength: 40 },
          { name: "graphicsType", placeholder: "e.g. Integrated", label: "Graphics Type (Integrated/Dedicated)", type: "text", maxLength: 80 },
          { name: "graphicsModel", placeholder: "e.g. Intel UHD Graphics", label: "Graphics Model", type: "text", maxLength: 100 },
        ],
      },
      {
        sectionTitle: "Battery & Power",
        fields: [
          { name: "originalCapacitymAh", label: "Original Battery Capacity (mAh)", type: "number", min: 1000, max: 100000, placeholder: "e.g. 5000" },
          // { name: "batteryHealthPercent", label: "Battery Health (%)", type: "number", min: 0, max: 100 },
          // { name: "batteryCycleCount", label: "Battery Cycle Count", type: "number", min: 0, max: 5000 },
          {name: "chargerCapacityWatt", label: "Charger Capacity (Watts)", type: "number", min: 10, max: 200, placeholder: "e.g. 65" },
          { name: "chargerSerial", label: "Charger Serial Number", type: "text", maxLength: 120, placeholder: "e.g. 1234567890" },
          { name: "chargerPinType", label: "Charger Pin Type", type: "select", options: common.chargerPinTypes,},
          { name: "fastChargingSupported", label: "Fast Charging Supported", type: "select", options: common.booleanOptions },
        ],
      },

      // ! Audio & Camera
      {
        sectionTitle: "Audio & Camera",
        fields: [
          // Webcam Details
          { name: "webcamAvailable", label: "Webcam Available", type: "select", options: common.booleanOptions, defaultValue: "Yes" },
          { name: "webcamResolution", placeholder: "e.g. 720p", label: "Webcam Resolution", type: "text", maxLength: 40, showIf: { webcamAvailable: "Yes" }, },
          { name: "webcamFrameRate", placeholder: "e.g. 30", label: "Webcam Frame Rate (FPS)", type: "number", min: 1, max: 120, showIf: { webcamAvailable: "Yes" } },
          { name: "webcamType", label: "Webcam Type", type: "select", options: ["HD", "Full HD", "IR", "HD + IR"], showIf: { webcamAvailable: "Yes" } },
          { name: "hasPrivacyShutter", label: "Privacy Shutter", type: "select", options: common.booleanOptions, showIf: { webcamAvailable: "Yes" } },
          { name: "supportsFaceUnlock", label: "Face Unlock (IR)", type: "select", options: common.booleanOptions, showIf: { webcamType: "IR" } },
          { name: "webcamStatus", label: "Webcam Status", type: "select", options: ["Working", "Not Working", "Damaged", "Disabled"], showIf: { webcamAvailable: "Yes" }, defaultValue: "Working"  },

          // Microphone Details
          { name: "microphoneAvailable", label: "Microphone Available", type: "select", options: common.booleanOptions, defaultValue: "Yes" },
          { name: "microphoneCount", label: "Number of Microphones", type: "number", min: 0, max: 10, showIf: { microphoneAvailable: "Yes" } },
          { name: "microphoneType", label: "Microphone Type", type: "select", options: ["Single", "Dual", "Array"], showIf: { microphoneAvailable: "Yes" } },
          { name: "microphoneStatus", label: "Microphone Status", type: "select", options: ["Working", "Not Working", "Distorted"], showIf: { microphoneAvailable: "Yes" }, defaultValue: "Working" },

          // Speaker Details
          {name: "audioAvailable", label: "Audio Available", type: "select", options: common.booleanOptions, defaultValue: "Yes" },
          {name:"numberOfSpeakers", label: "Number of Speakers", type: "number", min: 0, max: 10, showIf: { audioAvailable: "Yes" } },
          {name: "speakerPowerWatt", label: "Speaker Power (Watts)", type: "number", min: 1, max: 100 },
          {name: "speakerStatus", label: "Speaker Status", type: "select", options: ["Working", "Not Working", "Distorted"], showIf: { audioAvailable: "Yes" }, defaultValue: "Working" },

        ],
      },

        //!Availability of Ports & Connectivity
        {
          sectionTitle: "Ports & Connectivity",
          fields: [
            { name: "hdmiPort", label: "HDMI Port Available", type: "select", options: common.booleanOptions },
            { name: "vgaPort", label: "VGA Port Available", type: "select", options: common.booleanOptions },
            { name: "usbPort", label: "USB Port Available", type: "select", options: common.booleanOptions, defaultValue: "Yes" },
            { name: "noOfUSBPorts", placeholder: "e.g. 4", label: "Number of USB Ports", type: "number", min: 0, max: 20, showIf: { usbPort: "Yes" } },
            { name: "usbTypeC", label: "USB Type-C Port Available", type: "select", options: common.booleanOptions, defaultValue: "Yes" },
            { name: "noOfCPorts", placeholder: "e.g. 4", label: "Number of C Type Ports", type: "number", min: 0, max: 20, showIf: { usbTypeC: "Yes" } },
            { name: "audioOut", label: "Audio Out Port Available", type: "select", options: common.booleanOptions },
            { name: "networkPort", label: "Ethernet Port Available", type: "select", options: common.booleanOptions, required : true, defaultValue: "No" },
          ],
        },


      // ! Security & Hardware
      {
        sectionTitle: "Security & Hardware",
        fields: [
          { name: "secureBootEnabled", label: "Secure Boot Enabled", type: "select", options: common.booleanOptions },
          { name: "fingerprintScanner", label: "Fingerprint Scanner", type: "select", options: common.booleanOptions },
          { name: "faceRecognition", label: "Face Recognition", type: "select", options: common.booleanOptions },
          { name: "hardwareUUID", label: "Hardware UUID", type: "text", maxLength: 120, placeholder: "e.g. 12345678-1234-1234-1234-1234567890AB" },
        ],
      },

       //! Network Details
       fromGeneric("Network Details",{
        //  omitFields: ["","",""],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }), 
       //! Purchase Information
      fromGeneric("Purchase Information",{
         omitFields: ["taxAmount","currency"],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),
     
      //! Warranty Information
      fromGeneric("Warranty Information",{
        //  omitFields: ["","",""],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),

       //! Asset State
      fromGeneric("Asset State",{
        //  omitFields: ["","",""],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),
      
    ],
  },

};


