import { useState, useRef, useEffect } from 'react';
import './Select.css';

const MultiSelect = ({
  name,
  label = '',
  value = [],
  onChange,
  onBlur = () => {},
  options = [],
  error = '',
  required = false,
  disabled = false,
  placeholder = 'Select options...',
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside, true);
      return () => document.removeEventListener('click', handleClickOutside, true);
    }
  }, [isOpen]);

  const handleToggle = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];

    // Create synthetic event to match form handler
    onChange({
      target: {
        name,
        value: newValue,
        selectedOptions: newValue,
      },
    });

    // Keep dropdown open after selection
    setIsOpen(true);
  };

  const getSelectedLabels = () => {
    return options
      .filter((opt) => value.includes(opt.value))
      .map((opt) => opt.label);
  };

  const selectedLabels = getSelectedLabels();

  return (
    <div className="select-wrapper">
      {label && (
        <label className="select-label">
          {label}
          {required && <span className="select-required">*</span>}
        </label>
      )}

      <div className="multi-select-container" style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`select-field ${error ? 'select-error' : ''} ${className}`}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: error ? '1px solid #dc3545' : '1px solid #ddd',
            borderRadius: isOpen ? '4px 4px 0 0' : '4px',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            minHeight: '44px',
            textAlign: 'left',
            backgroundImage: 'none',
            paddingRight: '2.5rem'
          }}
        >
          <div style={{
            flex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.35rem',
            alignItems: 'center',
            minHeight: '1.5rem'
          }}>
            {selectedLabels.length === 0 ? (
              <span style={{ color: '#999' }}>{placeholder}</span>
            ) : (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.35rem',
                width: '100%'
              }}>
                {selectedLabels.map((label, idx) => (
                  <span key={idx} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#e8f0ff',
                    color: '#0066cc',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap'
                  }}>
                    {label}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        const optionValue = options.find(
                          (opt) => opt.label === label,
                        )?.value;
                        handleToggle(optionValue);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0066cc',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '1.2rem',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px'
                      }}
                      title="Remove"
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <span style={{
            fontSize: '1.2rem',
            color: '#666',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderTop: 'none',
              borderRadius: '0 0 4px 4px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {options.length > 0 ? (
              options.map((option) => {
                const optionValue = String(option.value);
                const isSelected = value.includes(optionValue);
                return (
                  <label
                    key={optionValue}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: isSelected ? '#f8f9ff' : 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = isSelected ? '#f8f9ff' : 'transparent';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(optionValue)}
                      style={{
                        marginRight: '0.75rem',
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{
                      fontSize: '0.9rem',
                      color: '#333',
                      fontWeight: isSelected ? 600 : 400
                    }}>
                      {option.label}
                    </span>
                  </label>
                );
              })
            ) : (
              <div style={{
                padding: '1rem',
                color: '#999',
                textAlign: 'center',
                fontSize: '0.9rem'
              }}>
                No options available
              </div>
            )}
          </div>
        )}
      </div>
      {error && <span className="select-error-text">{error}</span>}
    </div>
  );
};

export default MultiSelect;
