import { motion } from 'framer-motion';
import { HiExclamationCircle } from 'react-icons/hi';

const ErrorState = ({ 
  message = 'Something went wrong',
  className = '' 
}) => {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center py-12 px-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <HiExclamationCircle className="text-red-400 mb-4" size={48} />
      <p className="text-slate-300 text-lg">{message}</p>
    </motion.div>
  );
};

export default ErrorState;

