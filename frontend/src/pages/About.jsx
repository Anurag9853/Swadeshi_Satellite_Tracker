import { motion } from 'framer-motion';
import { HiGlobeAlt } from 'react-icons/hi';
import { FaRocket, FaBolt } from 'react-icons/fa';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';

const missionHighlights = [
  {
    title: 'Cartosat Constellation',
    icon: HiGlobeAlt,
    details:
      'High-resolution imaging satellites powering Atmanirbhar mapping, smart city planning, and rapid disaster response.',
  },
  {
    title: 'RISAT Radar Eyes',
    icon: FaRocket,
    details:
      'All-weather radar satellites that secure our oceans, monitor agriculture, and support strategic reconnaissance.',
  },
  {
    title: 'GSAT Communication Backbone',
    icon: FaBolt,
    details:
      'Geostationary fleet that keeps Bharat connected via broadband, TV, maritime and in-flight communications.',
  },
  {
    title: 'NavIC / IRNSS',
    icon: HiGlobeAlt,
    details:
      'Regional navigation system delivering sub-10m accuracy across land, sea, and air - built entirely in India.',
  },
  {
    title: 'EMISAT Intelligence',
    icon: FaRocket,
    details:
      'Dedicated electromagnetic intelligence platform expanding indigenous space-based surveillance capabilities.',
  },
  {
    title: 'Aditya-L1 Solar Mission',
    icon: FaBolt,
    details:
      'Indias first space-based solar observatory studying coronal heating, solar winds, and space weather alerts.',
  },
];

const timeline = [
  { year: '1969', event: 'ISRO Established' },
  { year: '1975', event: 'Aryabhata - First Indian Satellite' },
  { year: '1980', event: 'SLV-3 - First Indigenous Launch' },
  { year: '2008', event: 'Chandrayaan-1 - Moon Mission' },
  { year: '2013', event: 'Mars Orbiter Mission (Mangalyaan)' },
  { year: '2023', event: 'Chandrayaan-3 - Lunar Landing' },
];

const About = () => (
  <motion.div 
    className="mx-auto max-w-7xl px-8 pt-24 pb-20 space-y-12"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <PageHeader
      title="ISRO - Building Swadeshi Space Power"
      subtitle="From PSLV to Gaganyaan, Indias space story is one of resilience and frugal innovation. This platform celebrates the satellites and scientists who keep our weather reliable, our farmers empowered, and our defense vigilant."
    />

    {/* Mission Highlights Grid */}
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {missionHighlights.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card>
              <div className="mb-4 text-cyan-400">
                <Icon size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-slate-300 leading-relaxed">{item.details}</p>
            </Card>
          </motion.div>
        );
      })}
    </div>

    {/* Timeline Section */}
    <Card variant="large">
      <h2 className="text-2xl font-bold text-white mb-6">ISRO Timeline</h2>
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-blue-500 to-purple-500" />
        <div className="space-y-8">
          {timeline.map((item, index) => (
            <motion.div
              key={item.year}
              className="relative pl-20"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="absolute left-6 top-1 w-4 h-4 rounded-full bg-cyan-500 border-4 border-slate-900" />
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <p className="text-cyan-400 font-bold text-lg mb-1">{item.year}</p>
                <p className="text-slate-200">{item.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>

    {/* Atmanirbhar Section */}
    <motion.div
      className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl p-8 md:p-12 border border-white/10 ambient-glow"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="relative z-10">
        <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
          <span className="text-gradient">Atmanirbhar</span> Bharat in Orbit
        </h3>
        <p className="text-lg text-slate-300 leading-relaxed max-w-3xl">
          Indigenous launch vehicles, indigenous avionics, indigenous payloads. The
          Real-Time ISRO Satellite Pass Predictor inspires students and innovators
          to build on this legacy with open data and modern geospatial tooling.
        </p>
      </div>
    </motion.div>
  </motion.div>
);

export default About;
