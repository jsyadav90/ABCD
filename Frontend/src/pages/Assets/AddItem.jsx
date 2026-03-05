import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AddItem.css";
import Button from "../../components/Button/Button.jsx";
import FormRenderer from "./components/FormRenderer.jsx";
import { apiService } from "./services/apiService.js";
import { ITEM_FIELD_CONFIG, CATEGORY_ITEMS } from "./config/itemFieldConfig.js";

const CATEGORIES = [
  { value: "fixed", label: "Fixed" },
  { value: "peripheral", label: "Peripheral" },
  { value: "consumable", label: "Consumable" },
  { value: "intangible", label: "Intangible" },
];



const REGISTRY = ITEM_FIELD_CONFIG;

const AddItemPage = () => {
  const navigate = useNavigate();
  const { type } = useParams();
  const allItems = useMemo(() => Object.values(CATEGORY_ITEMS || {}).flat(), []);
  const resolveType = (raw) => {
    const t = String(raw || "");
    const lc = t.toLowerCase();
    const byValue = allItems.find((i) => String(i.value || "").toLowerCase() === lc);
    if (byValue) return byValue.value;
    const byLabelExact = allItems.find((i) => String(i.label || "").toLowerCase() === lc);
    if (byLabelExact) return byLabelExact.value;
    const byLabelNoSpaces = allItems.find(
      (i) =>
        String(i.label || "").replace(/\s+/g, "").toLowerCase() ===
        lc.replace(/\s+/g, "")
    );
    if (byLabelNoSpaces) return byLabelNoSpaces.value;
    return lc;
  };
  const itemType = resolveType(type);
  const [category, setCategory] = useState("");
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const sections = useMemo(() => {
    if (!category || !itemType) return [];
    return REGISTRY[itemType]?.sections || [];
  }, [category, itemType]);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };


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

  const submit = async () => {
    if (!validate()) {
      alert("Please fill required fields");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { itemType, ...form };
      await apiService.createAsset(payload);
      alert("Item saved successfully.");
      navigate("/assets");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save item");
    } finally {
      setSubmitting(false);
    }
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
    if (!v) return;
    setForm({});
    setErrors({});
    navigate(`/assets/add/${v}`);
  };

  const onCategoryChange = (e) => {
    const v = String(e.target.value);
    setCategory(v);
    setForm({});
    setErrors({});
    navigate("/assets/add");
  };

  const itemsForCategory = category ? CATEGORY_ITEMS[category] || [] : [];
  const itemTitle = (() => {
    if (!itemType) return "Add Item";
    const categories = Object.values(CATEGORY_ITEMS || {});
    for (const arr of categories) {
      const f = arr.find((i) => i.value === itemType);
      if (f) return `New ${f.label}`;
    }
    return `New ${itemType}`;
  })();

  return (
    <div className="add-item-page">
      <div className="page-header">
        <button aria-label="Back" className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="page-title">{itemTitle}</span>
      </div>
      <div className="sticky-header" role="toolbar">
        <div className="sticky-row">
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
                <option value="">Select item</option>
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
        <FormRenderer
          sections={sections}
          formData={form}
          errors={errors}
          onChange={updateField}
          onSubmit={submit}
          onReset={() => setForm({})}
          onCancel={onCancel}
          submitting={submitting}
        />
      </div>
    </div>
  );
};

export default AddItemPage;
