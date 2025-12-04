import { motion } from 'framer-motion';

const PageHeader = ({ 
  title, 
  subtitle, 
  icon: Icon,
  className = '' 
}) => {
  return (
    <motion.div
      className={`mb-8 ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', damping: 25, stiffness: 200 }}
    >
      {Icon && (
        <motion.div 
          className="mb-4"
          style={{ color: '#8b5cf6' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 15 }}
        >
          <Icon size={32} />
        </motion.div>
      )}
      <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
        {subtitle ? subtitle.split('.')[0] : ''}
      </p>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
        {title.includes(' ') ? (
          <>
            {title.split(' ').map((word, i) => 
              i === 0 ? <span key={i} className="text-gradient">{word}</span> : ` ${word}`
            )}
          </>
        ) : (
          <span className="text-gradient">{title}</span>
        )}
      </h1>
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
        className="h-[3px] w-20 bg-gradient-to-r from-purple-500 to-cyan-400 mt-4 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: 80 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      />
    </motion.div>
  );
};

export default PageHeader;
