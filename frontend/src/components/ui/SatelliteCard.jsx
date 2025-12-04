import { motion } from 'framer-motion';
import { HiGlobeAlt, HiLocationMarker } from 'react-icons/hi';
import Card from '../Card';
import Badge from './Badge';



const SatelliteCard = ({ 
  
  satellite, 
  position, 
  visibilityDetails,
  nextPass 
}) => {
  

  const getVisibilityBadge = () => {
    if (!visibilityDetails) return null;
    
    if (visibilityDetails.elevationVisible) {
      return <Badge variant="visible">Visible</Badge>;
    }
    if (visibilityDetails.cityVisible) {
      return <Badge variant="visible-city">Visible from {visibilityDetails.city?.name}</Badge>;
    }
    if (visibilityDetails.inIndiaPolygon) {
      return <Badge variant="in-polygon">Over India</Badge>;
    }
    return null;
  };

  

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", damping: 25, stiffness: 200 }}
      className="h-full"
    >
      <Card variant="medium" className="h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <HiGlobeAlt style={{ color: "#8b5cf6" }} size={20} />
            <h3 className="text-xl font-semibold text-white tracking-tight">
              {satellite.label}
            </h3>
          </div>

          {getVisibilityBadge()}
        </div>

        {/* Position */}
        {position && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <HiLocationMarker className="text-slate-400" size={16} />
              <span className="text-slate-300">
                {position.latitude.toFixed(2)}°, {position.longitude.toFixed(2)}°
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">
                Alt: {position.altitudeKm?.toFixed(1)} km
              </span>

              {visibilityDetails?.centerElevation > 0 && (
                <span className="font-mono">
                  Elev: {visibilityDetails.centerElevation.toFixed(1)}°
                </span>
              )}
            </div>
          </div>
        )}

        {/* Next Pass */}
        {nextPass && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Badge variant="next-pass">Next Pass</Badge>
              <span className="text-xs" style={{ color: "#8b5cf6" }}>
                In {Math.round((new Date(nextPass.startTime) - new Date()) / 60000)} min
              </span>
            </div>
          </div>
        )}
  
      </Card>
    </motion.div>
  );
};


export default SatelliteCard;
