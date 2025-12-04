import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const StatCard = ({ 
  metric, 
  label, 
  icon: Icon, 
  className = '',
  delay = 0 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <motion.div
      className={`rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 transition-all duration-300 hover:border-white/20 ${className}`.trim()}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: delay / 1000, type: 'spring', damping: 25 }}
      whileHover={{
        y: -4,
        boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.2)'
      }}
    >
      {Icon && (
        <div className="mb-3" style={{ color: '#8b5cf6' }}>
          <Icon size={24} />
        </div>
      )}
      <p className="text-3xl font-bold text-white mb-1">{metric}</p>
      <p className="text-sm text-slate-400 uppercase tracking-wide">{label}</p>
    </motion.div>
  );
};

export default StatCard;
