import { useNavigate } from 'react-router-dom';
import './Button.css';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  redirect,
  className = '',
  ...props
}) => {
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
      type={type}
      className={buttonClass}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
