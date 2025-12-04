import { motion } from 'framer-motion';
import Card from './Card';

const InfoCard = ({ title, eyebrow, children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: 'spring', damping: 25, stiffness: 200 }}
    >
      <Card variant="large" className={className}>
        {eyebrow && (
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#8b5cf6' }}>
            {eyebrow}
          </p>
        )}
        <h3 className="text-xl font-semibold text-white mb-4 tracking-tight">
          {title}
        </h3>
        <div className="space-y-4 text-slate-300">
          {children}
        </div>
      </Card>
    </motion.div>
  );
};

export default InfoCard;
