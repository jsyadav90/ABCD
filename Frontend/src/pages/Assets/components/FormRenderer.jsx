import Input from "../../../components/Input/Input.jsx";
import Select from "../../../components/Select/Select.jsx";
import Textarea from "../../../components/Textarea/Textarea.jsx";

const shouldShow = (field, formData) => {
  if (!field.showIf) return true;
  const { field: dep, equals } = field.showIf;
  return String(formData[dep] ?? "") === String(equals ?? "");
};

const Field = ({ def, value, onChange }) => {
  const common = {
    name: def.name,
    label: def.label,
    value: value ?? "",
    onChange: (e) => onChange(def.name, e.target.value),
    required: !!def.required,
    readOnly: !!def.readOnly,
    error: def.error,
    "aria-label": def.label,
    maxLength: def.maxLength,
  };
  if (def.type === "select") return <Select {...common} options={def.options || []} />;
  if (def.type === "textarea") return <Textarea {...common} rows={def.rows || 3} />;
  return <Input {...common} type={def.type || "text"} min={def.min} max={def.max} />;
};

const FormRenderer = ({ sections = [], formData = {}, onChange }) => {
  const list = Array.isArray(sections) ? sections : [];
  return (
    <div className="fr-container">
      {list.map((sec) => (
        <section key={sec.sectionTitle} className="fr-card" aria-labelledby={`sec-${sec.sectionTitle}`}>
          <div id={`sec-${sec.sectionTitle}`} className="fr-title">{sec.sectionTitle}</div>
          <div className="fr-grid">
            {sec.fields
              .filter((f) => shouldShow(f, formData))
              .map((f) => (
                <Field
                  key={f.name}
                  def={f}
                  value={formData[f.name]}
                  onChange={onChange}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default FormRenderer;
