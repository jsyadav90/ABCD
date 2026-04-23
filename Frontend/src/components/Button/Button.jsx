/**
 * @typedef {Object} ButtonProps
 * @property {import('react').ReactNode} [children]
 * @property {'button'|'submit'|'reset'} [type]
 * @property {string} [variant]
 * @property {string} [size]
 * @property {boolean} [fullWidth]
 * @property {boolean} [disabled]
 * @property {boolean} [loading]
 * @property {(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void} [onClick]
 * @property {string} [redirect]
 * @property {string} [className]
 */

import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Button.css';

/**
 * @type {import('react').ForwardRefExoticComponent<ButtonProps & import('react').RefAttributes<HTMLButtonElement>>}
 */
const Button = forwardRef((props, ref) => {
  const {
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    loading = false,
    onClick,
    redirect,
    className = '',
    ...otherProps
  } = props;

  const navigate = useNavigate();

  const handleClick = (e) => {
    if (loading || disabled) return;
    if (redirect) {
      navigate(redirect);
    }
    if (onClick) {
      onClick(e);
    }
  };

  const buttonClass = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${loading ? 'btn-loading' : ''} ${className}`;

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={handleClick}
      {...otherProps}
    >
      {loading ? (
        <span className="btn-content-loading">
          <svg className="btn-spinner" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
});

export default Button;
