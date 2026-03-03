import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AddItem.css";
import Button from "../../components/Button/Button.jsx";
import FormRenderer from "./components/FormRenderer.jsx";
import { ITEM_FIELD_CONFIG, CATEGORY_ITEMS } from "./config/itemFieldConfig.js";
import { apiService } from "./services/apiService.js";

const CATEGORIES = [
  { value: "fixed", label: "Fixed" },
  { value: "consumable", label: "Consumable" },
  { value: "intangible", label: "Intangible" },
];

// const MOCK = {
//   vendors: ["Dell", "HP", "Lenovo", "Acer", "ASUS"].map((v) => ({ value: v, label: v })),
//   domains: ["corp.local", "hq.local"].map((v) => ({ value: v, label: v })),
//   users: ["John Doe", "Jane Doe"].map((v) => ({ value: v, label: v })),
//   departments: ["IT", "Operations", "Finance"].map((v) => ({ value: v, label: v })),
//   status: ["In Stock", "Assigned", "Under Repair", "Retired"].map((v) => ({ value: v, label: v })),
//   nicTypes: ["Ethernet", "Wi-Fi"].map((v) => ({ value: v, label: v })),
//   networks: ["Office LAN", "Guest Wi-Fi"].map((v) => ({ value: v, label: v })),
//   types: ["Static", "DHCP"].map((v) => ({ value: v, label: v })),
// };



const REGISTRY = ITEM_FIELD_CONFIG;

const AddItemPage = () => {
  const navigate = useNavigate();
  const { type } = useParams();
  const itemType = String(type || "cpu").toLowerCase();
  const [category, setCategory] = useState("");
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const [assetCode, setAssetCode] = useState("");

  const sections = useMemo(() => {
    return REGISTRY[itemType]?.sections || [];
  }, [itemType]);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Auto fetch asset code when item type changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      const code = await apiService.generateAssetCode(itemType);
      if (mounted) setAssetCode(code);
    })();
    return () => { mounted = false; };
  }, [itemType]);

  const validate = () => {
    const req = [];
    sections.forEach((sec) => {
      sec.fields.forEach((f) => {
        if (f.required) req.push(f.name);
      });
    });
    const newErr = {};
    req.forEach((k) => {
      if (!String(form[k] || "").trim()) newErr[k] = "Required";
    });
    sections.forEach((sec) => {
      sec.fields.forEach((f) => {
        const val = form[f.name];
        if (f.maxLength && String(val || "").length > f.maxLength) {
          newErr[f.name] = `Max ${f.maxLength} chars`;
        }
        if (f.type === "number") {
          if (String(val || "").trim() && isNaN(Number(val))) {
            newErr[f.name] = "Must be a number";
          }
          const num = Number(val);
          if (f.min != null && String(val || "").trim() && num < f.min) {
            newErr[f.name] = `Min ${f.min}`;
          }
          if (f.max != null && String(val || "").trim() && num > f.max) {
            newErr[f.name] = `Max ${f.max}`;
          }
        }
      });
    });
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      alert("Item saved successfully (mock).");
      navigate("/assets");
    }, 600);
  };

  const onCancel = () => {
    const ok = window.confirm("Discard changes?");
    if (!ok) return;
    setForm({});
    setErrors({});
    navigate("/assets");
  };

  const onItemTypeChange = (e) => {
    const v = String(e.target.value);
    setForm({});
    setErrors({});
    navigate(`/assets/add/${v}`);
  };

  const onCategoryChange = (e) => {
    const v = String(e.target.value);
    setCategory(v);
  };

  const itemsForCategory = category ? CATEGORY_ITEMS[category] || [] : [];

  return (
    <div className="add-item-page">
      <div className="banner">
        <button aria-label="Back" className="back-btn" onClick={() => navigate(-1)}>←</button>
        <div className="banner-image" aria-hidden="true"></div>
      </div>
      <div className="sticky-header" role="toolbar">
        <div className="sticky-row">
          <div className="sticky-left">
            <span className="asset-code" aria-label="Asset Code">{assetCode}</span>
          </div>
          <div className="sticky-controls">
            <label className="control">
              <span>Category</span>
              <select aria-label="Category" value={category} onChange={onCategoryChange}>
                <option value="">Select Category</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label className="control">
              <span>Select Item</span>
              <select aria-label="Item Type" value={itemType} onChange={onItemTypeChange} disabled={!category}>
                {(!category) && <option value={itemType}>{itemType}</option>}
                {itemsForCategory.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>
      {/* {showAlert && (
        <div className="alert-row" onClick={() => setShowAlert(false)} role="alert" aria-live="polite">
          <span className="alert-text">New Computer</span>
          <span className="alert-icon">✖</span>
        </div>
      )} */}
      <div className="form-body">
        <FormRenderer sections={sections} formData={form} onChange={updateField} />
        <div className="form-actions">
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button variant="outline" onClick={() => setForm({})} disabled={submitting}>Reset</Button>
          <Button variant="primary" onClick={submit} disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </div>
  );
};

export default AddItemPage;
