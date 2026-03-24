/**
 * @typedef {Object} ButtonProps
 * @property {import('react').ReactNode} [children]
 * @property {'button'|'submit'|'reset'} [type]
 * @property {string} [variant]
 * @property {string} [size]
 * @property {boolean} [fullWidth]
 * @property {boolean} [disabled]
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
    onClick,
    redirect,
    className = '',
    ...otherProps
  } = props;

  const navigate = useNavigate();

  const handleClick = (e) => {
    if (redirect) {
      navigate(redirect);
    }
    if (onClick) {
      onClick(e);
    }
  };

  const buttonClass = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`;

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass}
      disabled={disabled}
      onClick={handleClick}
      {...otherProps}
    >
      {children}
    </button>
  );
});

export default Button;
