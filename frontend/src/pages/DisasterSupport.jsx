import { motion } from 'framer-motion';
import { HiGlobeAlt } from 'react-icons/hi';
import SectionHeader from '../components/ui/SectionHeader';
import InfoCard from '../components/InfoCard';
import disasterPayload from '../data/disasterSatellites.json';

const { disasters = [] } = disasterPayload;

const DisasterSupport = () => {

  return (
    <motion.div 
      className="mx-auto max-w-7xl px-8 py-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-16">
      {/* Header Section */}
      <SectionHeader
        title="ISRO Assets Protecting India"
        subtitle="Swadeshi spacecraft supply constant data for IMD, NDMA, Forest Survey, and farmers. Explore how each hazard taps a unique mix of weather, radar, and communication satellites."
        icon={HiGlobeAlt}
      />

      {/* Disaster Scenarios Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {disasters.map((scenario, index) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <InfoCard title={scenario.title} eyebrow="Impact Focus">
              <p className="text-slate-300 mb-4">{scenario.summary}</p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                    ISRO Satellites
                  </p>
                  <ul className="space-y-2">
                    {scenario.satellites.map((sat) => (
                      <li
                        key={`${scenario.id}-${sat.name}`}
                        className="rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 p-3"
                      >
                        <p className="font-semibold text-white">{sat.name}</p>
                        <p className="text-slate-400 text-sm">{sat.role}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                    How They Help
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300 text-sm">
                    {scenario.response.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </InfoCard>
          </motion.div>
        ))}
      </div>
      </div>
    </motion.div>
  );
};

export default DisasterSupport;
