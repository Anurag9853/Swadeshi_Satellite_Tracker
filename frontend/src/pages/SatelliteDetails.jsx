import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiCalendar, HiGlobeAlt, HiLocationMarker } from 'react-icons/hi';
import { FaRocket } from 'react-icons/fa';
import api from '../services/api';
import PassTable from '../components/PassTable';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';

const SatelliteDetails = () => {
  const { id } = useParams();
  const [satellite, setSatellite] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSatellite = async () => {
      try {
        const { data } = await api.get(`/satellites/${id}`);
        setSatellite(data);
      } catch {
        setError('Unable to load satellite details.');
      }
    };
    fetchSatellite();
  }, [id]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: Number(pos.coords.latitude.toFixed(4)),
            lon: Number(pos.coords.longitude.toFixed(4)),
          });
        },
        () => setError('Location permission needed for predictions.')
      );
    }
  }, []);

  const handlePredict = async () => {
    if (!coords) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/predict', {
        lat: coords.lat,
        lon: coords.lon,
        satelliteId: id,
      });
      setPrediction(data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  if (!satellite) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rect" height={200} className="rounded-2xl" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton variant="rect" height={300} className="rounded-xl" />
          <Skeleton variant="rect" height={300} className="rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="mx-auto max-w-7xl px-8 py-20 space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Image */}
      <motion.div
        className="relative h-64 md:h-80 rounded-2xl overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <img
          src={satellite.image_url}
          alt={satellite.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <p className="text-xs uppercase tracking-widest text-cyan-400 mb-2">
            NORAD {satellite.norad_id}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{satellite.name}</h1>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          metric={satellite.launch_year || 'N/A'}
          label="Launch Year"
          icon={HiCalendar}
          delay={0}
        />
        <StatCard
          metric={satellite.norad_id}
          label="NORAD ID"
          icon={FaRocket}
          delay={100}
        />
        <StatCard
          metric={satellite.tle_status === 'fresh' ? 'Active' : 'Stale'}
          label="Status"
          icon={HiGlobeAlt}
          delay={200}
        />
        <StatCard
          metric={satellite.tle_age_hours ? `${satellite.tle_age_hours.toFixed(1)}h` : 'N/A'}
          label="TLE Age"
          icon={HiLocationMarker}
          delay={300}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Mission Info */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Mission Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Mission</p>
              <p className="text-slate-200">{satellite.mission}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Purpose</p>
              <p className="text-slate-200">{satellite.purpose}</p>
            </div>
            {satellite.tle_age_hours !== undefined && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">TLE Status</p>
                <p className={`font-semibold ${satellite.tle_status === 'stale' ? 'text-yellow-400' : 'text-green-400'}`}>
                  {satellite.tle_age_hours.toFixed(1)} hours ({satellite.tle_status})
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Prediction Section */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Predict Pass</h2>
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                Your Coordinates
              </p>
              <p className="text-lg font-semibold text-white">
                {coords ? `${coords.lat}, ${coords.lon}` : 'Detecting...'}
              </p>
            </div>
            <Button
              onClick={handlePredict}
              disabled={loading || !coords}
              loading={loading}
              className="w-full"
            >
              Predict Pass Here
            </Button>
            {error && (
              <motion.p
                className="text-red-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}
          </div>
        </Card>
      </div>

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
      </motion.div>
    );
  };

export default SatelliteDetails;
