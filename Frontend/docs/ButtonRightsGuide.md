# Page ke Buttons ko Rights mein Kaise Convert Karein

## Overview
Agar kisi page pe buttons hain (jaise Add, Edit, Delete, Export), to unko rights mein convert karne se aap control kar sakte ho ki kaun user kaunsa button dekh sakta ya use kar sakta hai.

Yeh guide simple Hinglish mein batati hai ki kaunse files mein kya add karna hai.

## Step 1: Decide karo kaunsa button kis permission se linked hoga

Example:
- `assets:page_buttons:add` → Add Asset button
- `users:rows_buttons:edit` → Edit User button
- `endpoints:page_buttons:view` → View Endpoints button

Format: `moduleKey:pageKey:actionKey`

## Step 2: `Frontend/src/constants/permissions.js` mein action add karo

Yeh file page-level button actions define karti hai.

1. `PERMISSION_MODULES` mein apne module dhoondo.
2. Us module ke `pages` mein existing page section mein `actions` add karo.
3. Agar page section nahi hai, to new page object banao.

Example:
```javascript
{
  key: "assets",
  label: "Asset Management",
  accessKey: "assets:access",
  pages: [
    {
      key: "page_buttons",
      label: "Page Buttons",
      actions: [
        { key: "add", label: "Add Asset" },
        { key: "view", label: "View Assets" }
      ],
    },
  ],
}
```

Agar aap koi naya button add kar rahe ho, to usko `actions` mein add karo:
```javascript
{ key: "download", label: "Download Asset" }
```

**Note:** Jab role ke modules change karte ho, to frontend automatically un permissions ko filter kar deta hai jo selected modules ke liye allowed nahi hain.

## Step 3: `MAIN_MODULES` mein module permission confirm karo

Aapke module ka key `MAIN_MODULES` mein hona chahiye, taaki setup page module wise group bana paye.

Example:
```javascript
export const MAIN_MODULES = [
  {
    key: "module_1",
    label: "IT Operations",
    subModules: ["assets", "users", "reports", "setup"],
  },
];
```

Agar aap naya module add kar rahe ho, to usko yahan bhi add karo.

## Step 4: Page component mein button render karne se pehle permission check karo

File jahan button render hota hai, wahan `permissionHelper` se `hasPermission` use karo.

Example:
```javascript
import { hasPermission } from "../../utils/permissionHelper";

return (
  <div>
    {hasPermission("assets:page_buttons:add") && (
      <Button onClick={handleAdd}>Add Asset</Button>
    )}

    {hasPermission("assets:rows_buttons:edit") && (
      <Button onClick={handleEdit}>Edit</Button>
    )}
  </div>
);
```

Iska matlab:
- Agar user ke paas `assets:page_buttons:add` permission hai, tabhi Add button dikhega.
- Agar permission nahi hai, button hide ho jayega.

## Step 5: Role/Rights setup mein naya action show karwana

Agar aapki setup page rights UI `PERMISSION_MODULES` se permission list generate karti hai, to aapko sirf `permissions.js` mein action add karna hai.

`RoleRightsTab` ya jo bhi rights modal use karta hai, woh automatically naya button action dikhayega jab:
- module selected ho
- action `PERMISSION_MODULES` mein defined ho

## Module Remove karne par Button Rights kaise handle hote hain

Jab role se koi module remove karte ho, to us module ke saare button permissions automatically remove ho jaate hain:

- Role ke `permissionKeys` se woh permissions remove ho jaate hain
- Users ke `extraPermissions` se bhi remove ho jaate hain
- Agar user ke paas us module ke liye special button permissions hain, to woh module user ke `modules` mein add ho jayega taaki access rahe

**Example:** Agar "assets" module remove karo, to "assets:page_buttons:add", "assets:rows_buttons:edit" sab permissions auto remove ho jaayenge.

## Step 6: Backend ya role save logic check karo

Agar backend roles/permissions save karta hai, to ensure karo ki:
- role payload mein new button permission bhi aajaye
- user roles update hone par uski permissions mein yeh permission aa jaye

Aapko is file mein bhi change karna pad sakta hai agar backend role structure strict ho.

## Example flow

1. `permissions.js` mein `assets` module ke `page_buttons` mein `download` action add karo.
2. `hasPermission("assets:page_buttons:download")` se button render control karo.
3. Role setup UI mein ab users ko `Download Asset` right assign kar sakte ho.
4. Sirf jin users ke paas yeh permission hogi, unko button dikhai dega.

## Note
- Button action key unique hona chahiye.
- Permission string format bilkul same rakho: `moduleKey:pageKey:actionKey`.
- Agar button kisi nayi page category ka hai, to `pages` mein naya section banao.
- App agar hot reload nahi karta to changes ke baad page refresh ya app restart karo.
