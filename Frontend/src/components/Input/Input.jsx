import { useEffect, useRef, useState } from 'react';
import './Input.css';

const Input = ({
  type = 'text',
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder = '',
  error = '',
  required = false,
  disabled = false,
  className = '',
  scanable = false,
  onScan,
  dateFormat = 'DD-MM-YYYY',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);
  const inputRef = useRef(null);
  const popRef = useRef(null);

  const isPasswordField = type === 'password';
  const isDateField = type === 'date';
  const inputType = isPasswordField && showPassword ? 'text' : type;
  const hasAction = isPasswordField || !!scanable || isDateField;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // ---- Date helpers ----
  const parseDate = (val) => {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val)) return val;
    const s = String(val).trim();

    const isoMatch = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (isoMatch) {
      const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
      return isNaN(d) ? null : d;
    }

    const dmyMatch = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (dmyMatch) {
      const d = new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
      return isNaN(d) ? null : d;
    }

    const d = new Date(s);
    return isNaN(d) ? null : d;
  };
  const formatDate = (d) => {
    if (!d || isNaN(d)) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  
  // Format date based on configured dateFormat
  const formatDisplay = (d, fmt = dateFormat) => {
    if (!d || isNaN(d)) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    // Support formats: DD-MM-YYYY, MM-DD-YYYY, YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD
    const formats = {
      'DD-MM-YYYY': `${day}-${month}-${year}`,
      'MM-DD-YYYY': `${month}-${day}-${year}`,
      'YYYY-MM-DD': `${year}-${month}-${day}`,
      'DD/MM/YYYY': `${day}/${month}/${year}`,
      'MM/DD/YYYY': `${month}/${day}/${year}`,
      'YYYY/MM/DD': `${year}/${month}/${day}`,
    };
    
    return formats[fmt] || `${day}-${month}-${year}`;
  };

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const selectedDate = parseDate(value);
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? new Date().getMonth());
  const today = new Date();
  const [dateText, setDateText] = useState(selectedDate ? formatDisplay(selectedDate) : '');

  useEffect(() => {
    // Close calendar on outside click
    const handler = (e) => {
      if (!openCalendar) return;
      if (popRef.current && popRef.current.contains(e.target)) return;
      if (inputRef.current && inputRef.current.contains(e.target)) return;
      setOpenCalendar(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openCalendar]);

  useEffect(() => {
    // Keep view synced when external value changes
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
      setDateText(formatDisplay(selectedDate));
    } else {
      setDateText('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const buildMonthDays = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay(); // 0-6 (Sun-Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const cells = [];
    // leading blanks
    for (let i = 0; i < startDay; i++) {
      const day = prevMonthDays - startDay + 1 + i;
      const d = new Date(year, month - 1, day);
      cells.push({ date: d, outside: true });
    }
    // current month
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ date: new Date(year, month, i), outside: false });
    }
    // trailing to fill 6 rows
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last);
      next.setDate(last.getDate() + 1);
      cells.push({ date: next, outside: true });
    }
    // ensure 6 rows (42 cells)
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last);
      next.setDate(last.getDate() + 1);
      cells.push({ date: next, outside: true });
    }
    return cells;
  };

  const changeMonth = (delta) => {
    const nm = viewMonth + delta;
    const y = viewYear + Math.floor(nm / 12);
    const m = ((nm % 12) + 12) % 12;
    setViewYear(y);
    setViewMonth(m);
  };
  const changeYear = (delta) => {
    setViewYear((y) => y + delta);
  };

  const handleSelectDate = (d) => {
    const v = formatDate(d);
    const evt = { target: { name, value: v } };
    onChange?.(evt);
    setDateText(formatDisplay(d));
    setOpenCalendar(false);
  };

  const normalizeDigitsToDisplay = (digits) => {
    // Normalize input based on configured format
    // For DD-MM-YYYY or DD/MM/YYYY: expecting DDMMYYYY (8 digits)
    // For MM-DD-YYYY or MM/DD/YYYY: expecting MMDDYYYY (8 digits)
    // For YYYY-MM-DD or YYYY/MM/DD: expecting YYYYMMDD (8 digits)
    
    const separator = dateFormat.includes('/') ? '/' : '-';
    const only = digits.replace(/\D/g, '');
    
    if (dateFormat.startsWith('YYYY')) {
      // YYYY-MM-DD format: user enters YYYYMMDD
      const y = only.slice(0, 4);
      const m = only.slice(4, 6);
      const d = only.slice(6, 8);
      let parts = [];
      if (y) parts.push(y);
      if (m) parts.push(m);
      if (d) parts.push(d);
      return parts.join(separator);
    } else {
      // DD-MM-YYYY or MM-DD-YYYY format: user enters DDMMYYYY or MMDDYYYY
      const first = only.slice(0, 2);
      const second = only.slice(2, 4);
      const year = only.slice(4, 8);
      let parts = [];
      if (first) parts.push(first);
      if (second) parts.push(second);
      if (year) parts.push(year);
      return parts.join(separator);
    }
  };

  const tryEmitISOIfComplete = (text) => {
    // Accept various formats based on configuration and separators (- / or nothing)
    const s = text.trim();
    const digits = s.replace(/\D/g, '');
    let dd, mm, yyyy;
    
    if (digits.length === 8) {
      // User input 8 digits: parse based on configured format
      if (dateFormat.startsWith('YYYY')) {
        // YYYY-MM-DD format: user should enter YYYYMMDD
        yyyy = digits.slice(0, 4);
        mm = digits.slice(4, 6);
        dd = digits.slice(6, 8);
      } else if (dateFormat.startsWith('MM')) {
        // MM-DD-YYYY or MM/DD/YYYY format: user enters MMDDYYYY
        mm = digits.slice(0, 2);
        dd = digits.slice(2, 4);
        yyyy = digits.slice(4, 8);
      } else {
        // DD-MM-YYYY or DD/MM/YYYY format: user enters DDMMYYYY
        dd = digits.slice(0, 2);
        mm = digits.slice(2, 4);
        yyyy = digits.slice(4, 8);
      }
    } else {
      // Try to parse with separators
      const m = s.match(/^(\d{2})[/.-](\d{2})[/.-](\d{4})$|^(\d{4})[/.-](\d{2})[/.-](\d{2})$/);
      if (m) {
        if (m[4]) {
          // YYYY-MM-DD format
          yyyy = m[4];
          mm = m[5];
          dd = m[6];
        } else {
          // DD-MM-YYYY or MM-DD-YYYY format
          dd = m[1]; 
          mm = m[2]; 
          yyyy = m[3];
        }
      }
    }
    
    if (dd && mm && yyyy) {
      const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      if (!isNaN(d) && d.getDate() === Number(dd)) {
        const iso = formatDate(d);
        const display = formatDisplay(d);
        setDateText(display);
        const evt = { target: { name, value: iso } };
        onChange?.(evt);
        return true;
      }
    }
    return false;
  };

  const handleDateInputChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '');
    // Live-format as DD-MM-YYYY while typing
    const formatted = normalizeDigitsToDisplay(digits);
    setDateText(formatted);
    // If we have full 8 digits, emit ISO to form state
    if (digits.length === 8) {
      tryEmitISOIfComplete(formatted);
    }
  };

  const handleDateInputBlur = () => {
    const active = document.activeElement;
    // Ignore blur if the user is moving focus inside the same date widget or calendar popover.
    if (
      openCalendar &&
      active &&
      ((popRef.current && popRef.current.contains(active)) ||
        (inputRef.current && inputRef.current.contains(active)))
    ) {
      return;
    }

    if (!tryEmitISOIfComplete(dateText)) {
      // If invalid/incomplete, keep text but do not emit change
      // Optionally, could clear on invalid; leaving as-is for UX
    }
  };

  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={name} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div
        ref={inputRef}
        className={`input-container ${isPasswordField ? 'password-input' : ''} ${isDateField ? 'date-input' : ''} ${hasAction ? 'has-action' : ''}`}
      >
        {isDateField ? (
          <input
            type="text"
            id={name}
            name={name}
            value={dateText}
            onChange={handleDateInputChange}
            onBlur={handleDateInputBlur}
            onClick={() => setOpenCalendar(true)}
            placeholder={placeholder || dateFormat}
            disabled={disabled}
            className={`input-field ${error ? 'input-error' : ''} ${className}`}
            {...props}
          />
        ) : (
          <input
            type={inputType}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && props.onEnter) {
                props.onEnter(e);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`input-field ${error ? 'input-error' : ''} ${className}`}
            {...props}
          />
        )}
        {isPasswordField && (
          <button
            type="button"
            className="password-toggle-btn"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            tabIndex="-1"
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              /* Password is SHOWN - Normal Icon (No cross line) */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M3 12c0-4.418 4.03-8 9-8s9 3.582 9 8" />
              </svg>
            ) : (
              /* Password is HIDDEN - Icon with Cross Line */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M3 12c0-4.418 4.03-8 9-8s9 3.582 9 8" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            )}
          </button>
        )}
        {!isPasswordField && scanable && (
          <button
            type="button"
            className="input-action-btn"
            onClick={onScan}
            disabled={disabled}
            title="Scan"
            aria-label="Scan"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <path d="M14 14h7v7h-7z M16 16h3v3h-3z"></path>
            </svg>
          </button>
        )}
        {isDateField && (
          <button
            type="button"
            className="date-toggle-btn"
            onClick={() => setOpenCalendar((v) => !v)}
            disabled={disabled}
            title="Open calendar"
            aria-label="Open calendar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>
        )}
        {isDateField && openCalendar && (
          <div ref={popRef} className="date-popover">
            <div className="date-popover-header">
              <div className="date-nav-group date-nav-group-left">
                <button type="button" className="date-nav-btn" onClick={() => changeYear(-1)} aria-label="Previous year">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="11 17 6 12 11 7"></polyline>
                    <polyline points="18 17 13 12 18 7"></polyline>
                  </svg>
                </button>
                <button type="button" className="date-nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
              </div>
              <div className="date-month-title">{months[viewMonth]} {viewYear}</div>
              <div className="date-nav-group date-nav-group-right">
                <button type="button" className="date-nav-btn" onClick={() => changeMonth(1)} aria-label="Next month">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
                <button type="button" className="date-nav-btn" onClick={() => changeYear(1)} aria-label="Next year">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="13 17 18 12 13 7"></polyline>
                    <polyline points="6 17 11 12 6 7"></polyline>
                  </svg>
                </button>
              </div>
            </div>
            <div className="date-weekdays">
              {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d) => (
                <div key={d} className="date-weekday">{d}</div>
              ))}
            </div>
            <div className="date-grid">
              {buildMonthDays(viewYear, viewMonth).map(({ date: d, outside }, idx) => {
                const isToday = d.toDateString() === today.toDateString();
                const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
                const cls = [
                  'date-day',
                  outside ? 'outside' : '',
                  isToday ? 'today' : '',
                  isSelected ? 'selected' : ''
                ].join(' ');
                return (
                  <button
                    key={idx}
                    type="button"
                    className={cls}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectDate(d)}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="date-footer">
              <button
                type="button"
                className="date-today-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectDate(new Date())}
              >
                Today
              </button>
            </div>
          </div>
        )}
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

export default Input;
