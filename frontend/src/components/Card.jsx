import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  variant = 'medium', 
  className = '', 
  hover = true,
  ...props 
}) => {
  const sizeClasses = {
    large: 'p-8',
    medium: 'p-6',
    small: 'p-6',
  };

  const baseClasses = `rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl ${sizeClasses[variant]} ${className}`.trim();

  const MotionCard = motion.div;

  if (hover) {
    return (
      <MotionCard
        className={baseClasses}
        whileHover={{ 
          scale: 1.01, 
          y: -4,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          boxShadow: '0 0 30px rgba(125, 60, 255, 0.3), 0 10px 15px -3px rgba(0, 0, 0, 0.2)'
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
        {...props}
      >
        {children}
      </MotionCard>
    );
  }

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  );
};

export default Card;
