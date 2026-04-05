/**
 * Asset Tooltip Utilities
 * Provides tooltip details for different asset types in the asset table
 */

import React from 'react';

/**
 * @param {{ [key: string]: any }} row
 */
export const getTooltipDetails = (row) => {
  /** @param {any} value */
  const isValuePresent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    const normalized = String(value).trim().toUpperCase();
    return normalized !== '' && normalized !== 'N/A';
  };

  /**
   * @param {string} label
   * @param {any} value
   * @param {string} [suffix='']
   */
  const formatPair = (label, value, suffix = '') => {
    if (!isValuePresent(value)) return null;
    return `${label}: ${String(value).trim()}${suffix}`;
  };

  const assetType = row.assetType?.toUpperCase();

  const totalRam = Number(row.memory?.totalCapacityGB) ||
    (row.memory?.modules?.reduce((/** @type {number} */ sum, /** @type {{ramCapacityGB:any}} */ module) => sum + (Number(module.ramCapacityGB) || 0), 0) || 0);
  const totalStorage = Number(row.storage?.totalCapacityGB) ||
    (row.storage?.devices?.reduce((/** @type {number} */ sum, /** @type {{driveCapacityGB:any}} */ device) => sum + (Number(device.driveCapacityGB) || 0), 0) || 0);

  const cpuFields = [
    formatPair('OS', row.osName),
    formatPair('Model', row.model),
    formatPair('CPU', row.processorModel),
    formatPair('RAM', totalRam ? `${totalRam}GB` : null),
    formatPair('Storage', totalStorage ? `${totalStorage}GB` : null),
  ].filter(Boolean);

  const monitorFields = [
    formatPair('Size', row.screenSizeInches, '"'),
    formatPair('Resolution', row.resolution),
    formatPair('Panel', row.panelType ?? row.panel_type),
    formatPair('Refresh Rate', row.refreshRateHz ?? row.refresh_rate_hz, 'Hz'),
  ].filter(Boolean);

  const printerFields = [
    formatPair('Model', row.model),
    formatPair('Type', row.printerType),
    formatPair('Technology', row.printTechnology),
    formatPair('Max Resolution', row.maxResolution),
  ].filter(Boolean);

  const cameraFields = [
    formatPair('Model', row.model),
    formatPair('Type', row.cameraType),
    formatPair('Resolution', row.resolution),
    formatPair('Interface', row.interfaceType),
  ].filter(Boolean);

  const keyboardFields = [
    formatPair('Model', row.model),
    formatPair('Type', row.keyboardType),
    formatPair('Interface', row.interfaceType),
    formatPair('Layout', row.layout),
  ].filter(Boolean);

  const mouseFields = [
    formatPair('Model', row.model),
    formatPair('Type', row.mouseType),
    formatPair('Interface', row.interfaceType),
    formatPair('DPI', row.dpi),
  ].filter(Boolean);

  const headphoneFields = [
    formatPair('Model', row.model),
    formatPair('Type', row.headphoneType),
    formatPair('Interface', row.interfaceType),
    formatPair('Driver Size', row.driverSize),
  ].filter(Boolean);

  const defaultFields = [
    formatPair('Model', row.model),
    formatPair('Serial', row.serialNumber),
    formatPair('Manufacturer', row.manufacturer),
  ].filter(Boolean);

  if (assetType === 'CPU') return cpuFields.join(', ');
  if (assetType === 'LAPTOP') return cpuFields.join(', ');
  if (assetType === 'MONITOR') return monitorFields.join(', ');
  if (assetType === 'PRINTER') return printerFields.join(', ');
  if (assetType === 'CAMERA') return cameraFields.join(', ');
  if (assetType === 'KEYBOARD') return keyboardFields.join(', ');
  if (assetType === 'MOUSE') return mouseFields.join(', ');
  if (assetType === 'HEADPHONE') return headphoneFields.join(', ');

  return defaultFields.join(', ');
};

/**
 * Highlight text based on search value
 * @param {string} text - Text to highlight
 * @param {string} searchValue - Search term
 * @returns {string|React.ReactNode} - Highlighted text or original text
 */
export const highlightText = (text, searchValue) => {
  if (!searchValue || !text) return text;
  const normalizedSearch = searchValue.trim();
  if (!normalizedSearch) return text;

  const regex = new RegExp(`(${normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = String(text).split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === normalizedSearch.toLowerCase() ? (
      <span key={index} className="highlight">
        {part}
      </span>
    ) : (
      part
    )
  );
};








// /**
//  * Asset Tooltip Utilities
//  * Provides tooltip details for different asset types in the asset table
//  */

// import React from 'react';

// export const getTooltipDetails = (row) => {
//   const safe = (value) => (value || value === 0 ? value : "N/A");
//   const assetType = row.assetType?.toUpperCase();

//   const totalRam = Number(row.memory?.totalCapacityGB) || (row.memory?.modules?.reduce((sum, module) => sum + (Number(module.ramCapacityGB) || 0), 0) || 0);
//   const totalStorage = Number(row.storage?.totalCapacityGB) || (row.storage?.devices?.reduce((sum, device) => sum + (Number(device.driveCapacityGB) || 0), 0) || 0);

//   if (assetType === 'CPU') {
//     return `OS: ${safe(row.osName)}, Model: ${safe(row.model)}, CPU: ${safe(row.processorModel)}, RAM: ${totalRam ? `${totalRam}GB` : 'N/A'}, Storage: ${totalStorage ? `${totalStorage}GB` : 'N/A'}`;
//   }

//   if (assetType === 'LAPTOP') {
//     return `OS: ${safe(row.osName)}, Model: ${safe(row.model)}, CPU: ${safe(row.processorModel)}, RAM: ${totalRam ? `${totalRam}GB` : 'N/A'}, Storage: ${totalStorage ? `${totalStorage}GB` : 'N/A'}`;
//   }

//   if (assetType === 'MONITOR') {
//     const size = safe(row.screenSizeInches);
//     const resolution = safe(row.resolution);
//     const panel = safe(row.panelType ?? row.panel_type);
//     const refresh = safe(row.refreshRateHz ?? row.refresh_rate_hz);
//     return `Size: ${size}", Resolution: ${resolution}, Panel: ${panel}, Refresh Rate: ${refresh}Hz`;
//   }

//   if (assetType === 'PRINTER') {
//     return `Model: ${safe(row.model)}, Type: ${safe(row.printerType)}, Technology: ${safe(row.printTechnology)}, Max Resolution: ${safe(row.maxResolution)}`;
//   }

//   if (assetType === 'CAMERA') {
//     return `Model: ${safe(row.model)}, Type: ${safe(row.cameraType)}, Resolution: ${safe(row.resolution)}, Interface: ${safe(row.interfaceType)}`;
//   }

//   if (assetType === 'KEYBOARD') {
//     return `Model: ${safe(row.model)}, Type: ${safe(row.keyboardType)}, Interface: ${safe(row.interfaceType)}, Layout: ${safe(row.layout)}`;
//   }

//   if (assetType === 'MOUSE') {
//     return `Model: ${safe(row.model)}, Type: ${safe(row.mouseType)}, Interface: ${safe(row.interfaceType)}, DPI: ${safe(row.dpi)}`;
//   }

//   if (assetType === 'HEADPHONE') {
//     return `Model: ${safe(row.model)}, Type: ${safe(row.headphoneType)}, Interface: ${safe(row.interfaceType)}, Driver Size: ${safe(row.driverSize)}`;
//   }

//   // Default fallback
//   return `Model: ${safe(row.model)}, Serial: ${safe(row.serialNumber)}, Manufacturer: ${safe(row.manufacturer)}`;
// };

// // /**
// //  * Highlight text based on search value
// //  * @param {string} text - Text to highlight
// //  * @param {string} searchValue - Search term
// //  * @returns {string|JSX.Element} - Highlighted text or original text
// //  */
// export const highlightText = (text, searchValue) => {
//   if (!searchValue || !text) return text;
//   const normalizedSearch = searchValue.trim();
//   if (!normalizedSearch) return text;

//   const regex = new RegExp(`(${normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
//   const parts = String(text).split(regex);

//   return parts.map((part, index) =>
//     part.toLowerCase() === normalizedSearch.toLowerCase() ? (
//       <span key={index} className="highlight">
//         {part}
//       </span>
//     ) : (
//       part
//     )
//   );
// };
