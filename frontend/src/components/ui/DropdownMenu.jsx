import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const DropdownMenu = ({
  trigger,
  children,
  align = 'left',
  className = '',
  onOpenChange,
  mobileContainerRef = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const updatePosition = () => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const containerRect = mobileContainerRef?.current?.getBoundingClientRect();
      
      if (isMobile && mobileContainerRef?.current) {
        // Position relative to mobile container
        setDropdownPosition({
          top: rect.bottom - (containerRect?.top || 0) + window.scrollY + 8,
          left: rect.left - (containerRect?.left || 0) + window.scrollX,
          width: rect.width,
        });
      } else {
        // Position relative to viewport
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: align === 'right' ? rect.right + window.scrollX - rect.width : rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, align, mobileContainerRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const dropdownContent = (
    <motion.div
      key={`dropdown-${instanceId.current}`}
      ref={dropdownRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`bg-white/10 border border-white/10 backdrop-blur-2xl shadow-2xl rounded-xl overflow-hidden ${className}`}
      style={
        isMobile && mobileContainerRef?.current
          ? {
              position: 'absolute',
              zIndex: 50,
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }
          : {
              position: 'fixed',
              zIndex: 50,
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }
      }
    >
      {children}
    </motion.div>
  );

  return (
    <div className="relative" ref={triggerRef}>
      <div
        onClick={handleToggle}
        onMouseEnter={() => !isMobile && setIsOpen(true)}
        onMouseLeave={() => !isMobile && setIsOpen(false)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen &&
          (isMobile && mobileContainerRef?.current
            ? dropdownContent
            : createPortal(dropdownContent, document.body))}
      </AnimatePresence>
    </div>
  );
};

export const DropdownMenuItem = ({
  children,
  icon: Icon,
  onClick,
  className = '',
  active = false,
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 ${
        active
          ? 'bg-purple-500/20 text-purple-300 font-medium'
          : 'text-slate-300 hover:bg-white/10 hover:text-white'
      } ${className}`}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.15 }}
    >
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      {children}
    </motion.button>
  );
};

export const DropdownMenuSection = ({ title, children, className = '' }) => {
  return (
    <div className={className}>
      {title && (
        <div className="px-4 py-2 text-xs uppercase tracking-wider text-slate-400 font-semibold">
          {title}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default DropdownMenu;

