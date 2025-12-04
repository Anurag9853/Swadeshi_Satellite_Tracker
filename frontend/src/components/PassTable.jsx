import { motion } from 'framer-motion';
import { HiClock, HiArrowUp, HiSun, HiCloud } from 'react-icons/hi';
import Card from './Card';
import StatCard from './StatCard';

const PassTable = ({ data }) => {
  if (!data?.prediction) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              Awaiting prediction. Choose a satellite and tap Predict to view the next pass.
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  const {
    prediction: {
      startTime,
      endTime,
      durationMinutes,
      maxElevation,
      dayNight,
      visibilityScore,
    },
    weather,
  } = data;

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card variant="large">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">
            {data.satellite?.name ?? 'Satellite'}
          </h3>
          <p className="text-sm uppercase tracking-wide text-cyan-400">
            Next Visible Pass
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <HiClock size={16} />
              <p className="text-xs uppercase tracking-wide">Duration</p>
            </div>
            <p className="text-xl font-bold text-white">{durationMinutes} min</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <HiArrowUp size={16} />
              <p className="text-xs uppercase tracking-wide">Max Elevation</p>
            </div>
            <p className="text-xl font-bold text-white">{maxElevation}°</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <HiSun size={16} />
              <p className="text-xs uppercase tracking-wide">Time</p>
            </div>
            <p className="text-lg font-semibold text-white">
              {dayNight}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <HiCloud size={16} />
              <p className="text-xs uppercase tracking-wide">Visibility</p>
            </div>
            <p className={`text-lg font-semibold ${
              visibilityScore === 'Good' ? 'text-green-400' :
              visibilityScore === 'Average' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {visibilityScore}
            </p>
          </div>
        </div>

        {/* Time Details */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Start Time</p>
            <p className="text-white font-medium">
              {startDate.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short',
              })} IST
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">End Time</p>
            <p className="text-white font-medium">
              {endDate.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short',
              })} IST
            </p>
          </div>
        </div>

        {/* Weather Info */}
        {weather && (
          <div className="pt-6 border-t border-slate-800/50">
            <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <HiCloud className="text-cyan-400" />
              Weather Snapshot
            </p>
            {weather.raw ? (
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                <div className="space-y-2 text-sm text-slate-300">
                  {weather.temperature !== null && (
                    <p>
                      <span className="font-semibold text-white">Temperature:</span>{' '}
                      {weather.temperature}°C
                    </p>
                  )}
                  <p>
                    <span className="font-semibold text-white">Conditions:</span>{' '}
                    {weather.raw.weather?.[0]?.description ?? 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Clouds:</span>{' '}
                    {weather.raw.clouds?.all ?? 'N/A'}%
                  </p>
                  <p>
                    <span className="font-semibold text-white">Visibility:</span>{' '}
                    {weather.raw.visibility ? `${(weather.raw.visibility / 1000).toFixed(1)} km` : 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">{weather.source}</p>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default PassTable;
