
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiLocationMarker, HiGlobeAlt, HiSparkles } from 'react-icons/hi';
import api from '../services/api';
import PassTable from '../components/PassTable';
import Card from '../components/Card';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Select from '../components/ui/Select';

const Home = () => {
  const [coords, setCoords] = useState(null);
  const [satellites, setSatellites] = useState([]);
  const [selected, setSelected] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSatellites = async () => {
      try {
        const response = await api.get('/satellites');
        console.log('[Home] Raw API response:', response);
        console.log('[Home] Response data:', response.data);
        console.log('[Home] Response data type:', Array.isArray(response.data) ? 'array' : typeof response.data);
        
        // Handle both array response and { satellites: [...] } response
        const satellitesData = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.satellites || []);
        
        console.log('[Home] Processed satellites data:', satellitesData);
        console.log('[Home] Number of satellites:', satellitesData.length);
        
        if (satellitesData.length > 0) {
          console.log('[Home] First satellite keys:', Object.keys(satellitesData[0]));
          console.log('[Home] First satellite:', satellitesData[0]);
        }
        
        setSatellites(satellitesData);
        if (satellitesData.length) {
          // Backend maps _id to id in response, so use id as primary identifier
          const firstSatId = satellitesData[0].id || satellitesData[0]._id || satellitesData[0].norad_id;
          console.log('[Home] Setting selected satellite ID:', firstSatId);
          setSelected(firstSatId);
        } else {
          console.warn('[Home] No satellites found in response!');
        }
      } catch (err) {
        console.error('[Home] Failed to fetch satellites:', err);
        console.error('[Home] Error details:', err.response?.data || err.message);
        setError('Unable to load satellite catalog.');
      }
    };
    fetchSatellites();
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(4)),
          lon: Number(pos.coords.longitude.toFixed(4)),
        });
      },
      () => {
        setError('Please allow location access to predict passes.');
      }
    );
  }, []);

  const handlePredict = async () => {
    if (!coords || !selected) return;

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/predict', {
        lat: coords.lat,
        lon: coords.lon,
        satelliteId: selected,
      });
      setPrediction(data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Prediction failed.');
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const selectedSatellite = satellites.find(
    (sat) => String(sat.id || sat._id || sat.norad_id) === String(selected)
  );

  return (
    <motion.div 
      className="mx-auto max-w-7xl px-8 pt-24 pb-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="space-y-20">
        {/* Hero Section */}
        <motion.section
          className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-16 py-20 ambient-glow"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Ambient Background Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl"
              style={{ backgroundColor: 'rgba(125, 60, 255, 0.15)' }}
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <motion.div
              className="absolute bottom-20 right-10 w-[500px] h-[500px] rounded-full blur-3xl"
              style={{ backgroundColor: 'rgba(0, 198, 255, 0.15)' }}
              animate={{
                x: [0, -100, 0],
                y: [0, -50, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>

          {/* Orbital Illustration */}
          <div className="absolute top-10 right-10 w-64 h-64 opacity-10 pointer-events-none">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" fill="none" className="text-white" />
              <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="1" fill="none" className="text-white" />
              <circle cx="100" cy="20" r="5" fill="currentColor" className="text-white">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 100 100"
                  to="360 100 100"
                  dur="20s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-xs uppercase tracking-wider mb-4 text-slate-400">
                Bharat-made Space Intelligence
              </p>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                Real-Time{' '}
                <span className="text-gradient">ISRO Satellite</span>
                <br />
                Pass Predictor
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mb-8">
                Detect your location, pick an ISRO satellite, and get the next visible
                pass with weather-based visibility insights.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Prediction Form */}
        <Card variant="large">
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
                <HiLocationMarker className="inline mr-2" />
                Your Location
              </label>
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <p className="text-lg font-semibold text-white">
                  {coords ? `${coords.lat}, ${coords.lon}` : (
                    <span className="text-slate-400">Detecting...</span>
                  )}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <label
                htmlFor="satellite"
                className="block text-xs uppercase tracking-wider text-slate-400 mb-2"
              >
                <HiGlobeAlt className="inline mr-2" />
                Satellite
              </label>
              <Select
                value={selected}
                onChange={setSelected}
                options={(() => {
                  const mappedOptions = satellites
                    .filter(sat => sat && (sat.id || sat._id || sat.norad_id) && (sat.name || sat.title))
                    .map((sat) => ({
                      value: sat.id || sat._id || sat.norad_id,
                      label: sat.name || sat.title || 'Unknown Satellite',
                    }));
                  console.log('[Home] Mapped dropdown options:', mappedOptions);
                  console.log('[Home] Options count:', mappedOptions.length);
                  return mappedOptions;
                })()}
                placeholder="Select satellite..."
                className="w-full"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-end"
            >
              <Button
                onClick={handlePredict}
                disabled={loading || !coords || !selected}
                loading={loading}
                className="w-full"
              >
                <HiSparkles className="inline mr-2" />
                Predict Pass
              </Button>
            </motion.div>
          </div>

          {error && (
            <motion.p
              className="mt-4 text-red-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}
        </Card>

      {/* Prediction Results */}
      {prediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PassTable data={prediction} />
        </motion.div>
      )}
      </div>
    </motion.div>
  );
};

export default Home;
