# Inline Barcode/QR Scan – Enable Anywhere (Inputs, Search, Forms)

## Overview
- Mobile camera se directly kisi bhi input field (including search) me barcode/QR scan karke value auto-fill karne ki capability.
- Reusable, app-wide architecture:
  - Shared Scanner Overlay
  - Global Scanning Provider
  - Input component me inline scan icon support
  - Optional config flag for form fields

## Prerequisites
- Dependencies: `react-zxing`, `@zxing/library`
- Secure context: HTTPS ya `http://localhost` (camera access ke liye)
- iOS Safari: User gesture required (tap), environment camera preferred

## Architecture Components
- `components/BarcodeScanner/BarcodeScanner.jsx` – Camera + decoder overlay
- `components/BarcodeScanner/ScanningProvider.jsx` – Global provider; exposes `openScan(handler)`
- `components/BarcodeScanner/useScanning.js` – Hook to open scanner from anywhere
- `components/Input/Input.jsx` – Inline scan icon via `scanable` prop and `onScan` callback

## App Setup (One-time)
1. App root me provider wrap:
   - File: `src/App.jsx`
   - Wrap entire routes with `<ScanningProvider>` (already added)
2. No further bootstrapping needed.

## Enable on Any Field (Three Ways)
### A) Input Component (recommended)
Use shared Input everywhere. Inline icon enable karne ke liye:
```jsx
import Input from '../../components/Input/Input.jsx';
import { useScanning } from '../../components/BarcodeScanner/useScanning.js';

const Example = () => {
  const { openScan } = useScanning();
  const [value, setValue] = useState('');
  return (
    <Input
      label="Search"
      name="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      scanable
      onScan={() => openScan((text) => setValue(text))}
    />
  );
};
```
- `scanable`: inline scan icon show karta hai
- `onScan`: icon tap par scanner open karta hai, decode result callback me milta hai

### B) Form Config Flag (forms rendering via config)
Jis field me scan chahiye, us field object me `scan: true` add karo:
```js
{ name: "assetTag", label: "Asset Tag", type: "text", scan: true }
```
- Renderer automatically Input ko `scanable` pass karega aur inline icon show karega

### C) Raw HTML input (agar shared Input use nahi ho raha)
- Direct hook use karo aur icon/button manually render karo:
```jsx
import { useScanning } from '../../components/BarcodeScanner/useScanning.js';

const Raw = () => {
  const { openScan } = useScanning();
  const [v, setV] = useState('');
  return (
    <div style={{ position: 'relative' }}>
      <input value={v} onChange={(e) => setV(e.target.value)} />
      <button
        type="button"
        onClick={() => openScan((text) => setV(text))}
        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
        aria-label="Scan"
      >📷</button>
    </div>
  );
};
```

## Add to Search Bars
- Sidebar/Header search ya kisi bhi page search field par:
  - Agar shared `Input` use ho raha hai → `scanable` + `onScan` set karo
  - Agar raw `<input>` hai → hook approach (C) follow karo

## UX Guidelines
- Field focus ke paas icon rakho (right side)
- Tap par full-screen overlay open; close button dikhana zaroori
- Decode ke baad overlay auto-close aur value set
- Duplicate scans avoid; apni field logic me overwrite allowed ya append karna decide karein

## Validation & Post-processing
- Result sanitize: trim, allowed chars (A–Z, 0–9, hyphen), max length
- Specific formats: EAN-13/Code128 ke liye optional checksum validation
- Auto-submit: Optionally scan ke baad submit/trigger search

## Troubleshooting
- Camera open nahi ho raha:
  - HTTPS/localhost ensure karein
  - User permission dena hoga
- iOS issues:
  - Icon tap (user gesture) se open karein
  - Front camera se decode poor ho sakta—environment camera prefer
- Performance:
  - Good lighting, steady barcode, reduce motion

## Maintainability Rules
- Har nayi input par scan chahiye to:
  1. Prefer shared `Input` use
  2. `scanable` + `onScan` set karo
  3. Complex forms me config `scan: true` flag use karo
- Scanner overlay ek hi global instance hai; multiple opens ko provider manage karta hai

## References
- Input inline icon styles: `src/components/Input/Input.css` (`.input-action-btn`, `.has-action`)
- Provider: `src/components/BarcodeScanner/ScanningProvider.jsx`
- Hook: `src/components/BarcodeScanner/useScanning.js`
- Scanner: `src/components/BarcodeScanner/BarcodeScanner.jsx`
