import { motion } from 'framer-motion';
import { HiSparkles } from 'react-icons/hi';

const SectionHeader = ({ 
  title, 
  subtitle, 
  icon: Icon = HiSparkles,
  className = '' 
}) => {
  return (
    <motion.div
      className={`mb-8 ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="flex items-center gap-3 mb-3">
        {Icon && (
          <div style={{ color: '#8b5cf6' }}>
            <Icon size={24} />
          </div>
        )}
        <h2 className="text-4xl font-bold tracking-tight text-white">
          {title}
        </h2>
      </div>
      {subtitle && (
        <motion.p
          className="text-lg text-slate-300 max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {subtitle}
        </motion.p>
      )}
      <motion.div
        className="h-[3px] w-20 bg-gradient-to-r from-accent-1 to-accent-3 mt-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: 80 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      />
    </motion.div>
  );
};

export default SectionHeader;
