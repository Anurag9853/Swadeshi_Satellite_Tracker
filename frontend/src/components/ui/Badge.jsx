import { motion } from 'framer-motion';

const Badge = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const variantClasses = {
    default: 'bg-white/10 text-slate-300 border-white/20',
    visible: 'bg-green-500/20 text-green-400 border-green-500/30',
    marginal: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'next-pass': 'bg-accent-1/20 text-accent-1 border-accent-1/30',
    'visible-city': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'in-polygon': 'bg-accent-1/20 text-accent-1 border-accent-1/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <motion.span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${variantClasses[variant]} ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, type: 'spring', damping: 20 }}
    >
      {children}
    </motion.span>
  );
};

export default Badge;
