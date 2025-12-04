import { motion } from 'framer-motion';

const Button = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseClasses = `px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`.trim();

  const variantClasses = {
    primary: `bg-gradient-to-r from-accent-1 to-accent-3 text-white shadow-lg hover:shadow-xl`,
    secondary: `bg-white/10 text-white border border-white/10 hover:bg-white/15 hover:border-white/20`,
    outline: `bg-transparent text-accent-1 border-2 border-accent-1 hover:bg-accent-1/10 hover:border-accent-2`,
  };

  const MotionButton = motion.button;

  return (
    <MotionButton
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]}`}
      whileHover={!disabled && !loading ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      transition={{ duration: 0.2, type: 'spring', damping: 20 }}
      style={variant === 'primary' ? {
        boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
      } : {}}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </MotionButton>
  );
};

export default Button;
