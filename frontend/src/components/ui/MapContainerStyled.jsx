import { motion } from 'framer-motion';
import { MapContainer } from 'react-leaflet';

const MapContainerStyled = ({ 
  children, 
  center, 
  zoom, 
  className = '',
  ...props 
}) => {
  return (
    <motion.div
      className={`rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl bg-slate-900/30 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-2">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '500px', width: '100%', borderRadius: '0.75rem' }}
          scrollWheelZoom
          {...props}
        >
          {children}
        </MapContainer>
      </div>
    </motion.div>
  );
};

export default MapContainerStyled;

