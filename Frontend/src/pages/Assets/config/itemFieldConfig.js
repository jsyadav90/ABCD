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
  cpu: {
    sections: [
      {
        sectionTitle: "Basic Information",
        fields: [
          { name: "name", label: "Name", type: "text", required: true, maxLength: 80 },
          { name: "product", label: "Product", type: "select", options: common.vendors },
          { name: "deviceTag", label: "Device Tag", type: "text", maxLength: 50 },
          { name: "manufacturer", label: "Manufacturer", type: "text", required: true, maxLength: 80 },
          { name: "domain", label: "Domain", type: "select", options: common.domains },
        ],
      },
      {
        sectionTitle: "Operating System",
        fields: [
          { name: "osName", label: "Name", type: "text", maxLength: 80 },
          { name: "osVersion", label: "Version", type: "text", maxLength: 40 },
          { name: "buildNumber", label: "Build Number", type: "text", maxLength: 40 },
          { name: "servicePack", label: "Service Pack", type: "text", maxLength: 40 },
          { name: "productId", label: "Product ID", type: "text", maxLength: 80 },
        ],
      },
      {
        sectionTitle: "Memory",
        fields: [
          { name: "ram", label: "RAM", type: "text", maxLength: 40 },
          { name: "virtualMemory", label: "Virtual Memory", type: "text", maxLength: 40 },
        ],
      },
      {
        sectionTitle: "Processors",
        fields: [
          { name: "processorInfo", label: "Processor Info", type: "text", maxLength: 120 },
          { name: "cpuManufacturer", label: "Manufacturer", type: "text", required: true, maxLength: 80 },
          { name: "clockSpeedMHz", label: "Clock Speed (MHz)", type: "number", min: 0, max: 10000 },
          { name: "cores", label: "Number of cores", type: "number", min: 1, max: 256 },
        ],
      },
      {
        sectionTitle: "Storage",
        fields: [
          { name: "storageType", label: "Storage Type", type: "select", options: [{ value: "HDD", label: "HDD" }, { value: "SSD", label: "SSD" }] },
          { name: "diskModel", label: "Model", type: "text", maxLength: 80 },
          { name: "diskSerial", label: "Serial Number", type: "text", maxLength: 80 },
          { name: "diskManufacturer", label: "Manufacturer", type: "text", maxLength: 80 },
          { name: "diskCapacityGB", label: "Capacity (in GB)", type: "number", min: 0, max: 100000 },
          { name: "nvmeVersion", label: "NVMe Version", type: "text", showIf: { field: "storageType", equals: "SSD" }, maxLength: 40 },
        ],
      },
      {
        sectionTitle: "BIOS",
        fields: [
          { name: "biosDate", label: "Bios Date", type: "date" },
          { name: "biosVersion", label: "Bios Version", type: "text", maxLength: 80 },
          { name: "biosManufacturer", label: "Bios Manufacturer", type: "text", maxLength: 80 },
        ],
      },
      {
        sectionTitle: "Asset Details",
        fields: [
          { name: "assetSerial", label: "Serial Number", type: "text", maxLength: 80 },
          { name: "assetTag", label: "Asset Tag", type: "text", required: true, maxLength: 60 },
          { name: "vendor", label: "Vendor", type: "select", options: common.vendors },
          { name: "barcode", label: "Barcode/QR Code", type: "text", maxLength: 80 },
          { name: "purchaseCost", label: "Purchase Cost", type: "number", min: 0, max: 10000000 },
          { name: "acquisitionDate", label: "Acquisition Date", type: "date" },
          { name: "expiryDate", label: "Expiry Date", type: "date" },
          { name: "warrantyExpiryDate", label: "Warranty Expiry Date", type: "date" },
          { name: "location", label: "Location", type: "text", maxLength: 120 },
        ],
      },
      {
        sectionTitle: "Asset Status",
        fields: [
          { name: "status", label: "Asset is currently", type: "select", options: common.status },
          { name: "state", label: "State", type: "select", options: common.status },
          { name: "stateComments", label: "State Comments", type: "textarea", maxLength: 400 },
        ],
      },
      {
        sectionTitle: "Network Details",
        fields: [
          { name: "ipAddress", label: "IP Address", type: "text", maxLength: 40 },
          { name: "macAddress", label: "MAC Address", type: "text", maxLength: 40 },
          { name: "nic", label: "NIC", type: "select", options: common.nicTypes },
          { name: "network", label: "Network", type: "select", options: common.networks },
          { name: "defaultGateway", label: "Default Gateway", type: "text", maxLength: 80 },
          { name: "dhcpEnabled", label: "DHCP Enabled", type: "select", options: [{ value: "True", label: "True" }, { value: "False", label: "False" }] },
          { name: "dhcpServer", label: "DHCP Server", type: "text", maxLength: 80 },
          { name: "dnsHostname", label: "DNS Hostname", type: "text", maxLength: 120 },
          { name: "type", label: "Type", type: "select", options: common.types },
        ],
      },
    ],
  },
  monitor: {
    sections: [
      {
        sectionTitle: "Monitor Details",
        fields: [
          { name: "modelNumber", label: "Model Number", type: "text", required: true },
          { name: "serialNumber", label: "Serial Number", type: "text" },
          { name: "vendor", label: "Vendor", type: "select", options: common.vendors },
          { name: "sizeInInches", label: "Size (in Inches)", type: "number", min: 10, max: 60 },
          { name: "maxResolution", label: "Max Resolution", type: "text" },
        ],
      },
    ],
  },
  printer: {
    sections: [
      {
        sectionTitle: "Printer Details",
        fields: [
          { name: "modelNumber", label: "Model Number", type: "text", required: true },
          { name: "serialNumber", label: "Serial Number", type: "text" },
          { name: "vendor", label: "Vendor", type: "select", options: common.vendors },
          { name: "printerType", label: "Type", type: "select", options: [{ value: "Laser", label: "Laser" }, { value: "Inkjet", label: "Inkjet" }] },
          { name: "cartridgeModel", label: "Cartridge Model", type: "text" },
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
