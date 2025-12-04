import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import SatelliteCard from '../components/SatelliteCard';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import Loader from '../components/ui/Loader';
import { HiGlobeAlt } from 'react-icons/hi';

const SatelliteList = () => {
  const [satellites, setSatellites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSatellites = async () => {
      try {
        const { data } = await api.get('/satellites');
        setSatellites(data);
      } catch (err) {
        setError(err.response?.data?.message ?? 'Failed to fetch satellites.');
      } finally {
        setLoading(false);
      }
    };

    loadSatellites();
  }, []);

  if (loading) {
    return (
      <motion.div 
        className="mx-auto max-w-7xl px-8 pt-24 pb-20 space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PageHeader
          title="ISRO Fleet"
          subtitle="Explore indigenous satellites powering mapping, communication, and science missions."
          icon={HiGlobeAlt}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} variant="rect" height={300} className="rounded-xl" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="mx-auto max-w-7xl px-8 py-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PageHeader
          title="ISRO Fleet"
          subtitle="Explore indigenous satellites powering mapping, communication, and science missions."
          icon={HiGlobeAlt}
        />
        <ErrorState message={error} />
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="mx-auto max-w-7xl px-8 pt-24 pb-20 space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <PageHeader
        title="ISRO Fleet"
        subtitle="Explore indigenous satellites powering mapping, communication, and science missions."
        icon={HiGlobeAlt}
      />
      <motion.div
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {satellites.map((sat, index) => (
          <motion.div
            key={sat.id ?? sat._id ?? sat.norad_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <SatelliteCard satellite={sat} />
          </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  };

export default SatelliteList;
