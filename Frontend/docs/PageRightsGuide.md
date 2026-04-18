# Page ko Rights mein Visible Karna - Step by Step Guide

## Overview
Agar aapne ek naya page banaya hai, aur use kisi module ke selection par hi show karna hai, to yeh guide follow karo. Yeh simple steps mein batata hai ki kaha kaha code likhna hai.

## Step 1: Page ko Navigation Config mein Add Karo
**File:** `Frontend/src/constants/navigationConfig.js`

Yahan `PAGES_CONFIG` array mein ek naya object add karo:

```javascript
{
  key: "your_page_key",        // Unique key for your page
  label: "Your Page Name",     // Name jo sidebar mein show hoga
  icon: "icon_name",           // Material icon name
  path: "/your-page-path",     // URL path
  permission: "your_permission", // Permission key
  modules: ["module_1"]        // Kis module se related hai
}
```

**Example:**
```javascript
{
  key: "reports",
  label: "Report",
  icon: "bar_chart",
  path: "/report",
  permission: "reports",
  modules: ["module_1"]
}
```

## Step 2: Permissions Constants Update Karo
**File:** `Frontend/src/constants/permissions.js`

`MAIN_MODULES` array mein, us module ke `subModules` array mein apni permission add karo:

```javascript
export const MAIN_MODULES = [
  {
    key: "module_1",
    label: "IT Operations",
    subModules: ["assets", "users", "reports", "your_permission"]  // Yahan add karo
  }
];
```

## Step 3: Backend Permissions Map Update Karo
**File:** `Backend/src/constants/modulePermissionsMap.js`

`MODULE_PERMISSIONS_MAP` object mein, us module ke array mein permission add karo:

```javascript
export const MODULE_PERMISSIONS_MAP = {
  module_1: [
    "assets",
    "users",
    "reports",
    "your_permission"  // Yahan add karo
  ]
};
```

## Step 4: Page Component Banayein
**File:** `Frontend/src/pages/YourPage/YourPage.jsx`

Apna page component banayein aur export karein.

## Step 5: Route Add Karo
**File:** `Frontend/src/App.jsx` ya routing file mein

Route add karo:
```javascript
<Route path="/your-page-path" element={<YourPage />} />
```

## Kaise Kaam Karta Hai?

1. **Sidebar mein Show:** User ke modules mein woh module hai to page sidebar mein dikhega
2. **Rights Setup mein:** Role ke liye module select karne par uski subModules (permissions) dikhegi
3. **Access Control:** User ke permissions mein woh permission hai to page access milega

## Agar Module Remove Kiya Jata Hai:
Jab kisi role se module remove karte ho, to us module ke saare related rights automatically remove ho jaate hain.

**Kaise kaam karta hai:**
- Backend mein `getRemovedModules()` function check karta hai ki kaunse modules remove hue
- `getPermissionsForModules()` function us module ke saare permissions laata hai
- Role update karte time, removed modules ke permissions role se auto remove ho jaate hain
- Users ke `extraPermissions` se bhi woh permissions remove ho jaate hain
- **Special case:** Agar kisi user ke paas removed module ke liye extraPermissions hain, to woh module user ke `modules` array mein add ho jayega taaki user ko access rahe

**Example:**
Agar "module_1" remove karo, to "assets", "users", "reports" sab permissions role se remove ho jaayenge.
Lekin agar kisi user ke paas "assets:page_buttons:add" extra permission tha, to "module_1" us user ke modules mein add ho jayega.

## Agar Multiple Modules mein Page Chahiye:
`modules` array mein multiple modules add karo:
```javascript
modules: ["module_1", "module_2"]
```

Aur dono modules ke `subModules` mein permission add karo.

## Note:
- Har permission unique hona chahiye
- Module IDs ko match karo (module_1, module_2, etc.)
- Changes ke baad app restart karo</content>
<parameter name="filePath">c:\Users\Jitu\Desktop\Jitu\ABCD-1.1.0\Frontend\docs\PageRightsGuide.md