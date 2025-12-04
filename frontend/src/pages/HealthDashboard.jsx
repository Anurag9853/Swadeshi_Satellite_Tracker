import { useEffect, useMemo, useState } from 'react';
import InfoCard from '../components/InfoCard';
import api from '../services/api';

const getBadgeClasses = (value, warning, danger) => {
  if (value <= danger) return 'bg-red-500/20 text-red-300 border-red-500/40';
  if (value <= warning) return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
  return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40';
};

const HealthDashboard = () => {
  const [satellites, setSatellites] = useState([]);
  const [selected, setSelected] = useState('');
  const [telemetry, setTelemetry] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSatellites = async () => {
      try {
        const { data } = await api.get('/satellites');
        setSatellites(data);
        if (data[0]) {
          setSelected(String(data[0].id ?? data[0]._id ?? data[0].norad_id));
        }
      } catch (err) {
        setError(err.message || 'Unable to load satellites');
      }
    };
    loadSatellites();
  }, []);

  useEffect(() => {
    if (!selected) return undefined;

    let isMounted = true;
    let intervalId;

    const fetchTelemetry = async () => {
      try {
        const { data } = await api.get(`/satellites/telemetry/${selected}`);
        if (!isMounted) return;
        setTelemetry(data);
        setHistory((prev) => {
          const next = [...prev, data].slice(-12);
          return next;
        });
        setError('');
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Telemetry feed unavailable');
        }
      }
    };

    fetchTelemetry();
    intervalId = setInterval(fetchTelemetry, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [selected]);

  const activeSatellite = satellites.find(
    (sat) => String(sat.id ?? sat._id ?? sat.norad_id) === selected
  );

  const alerts = useMemo(() => {
    if (!telemetry?.telemetry) return [];
    const messages = [];
    if (telemetry.telemetry.battery < 70) {
      messages.push('Battery reserve below 70%. Schedule load shedding.');
    }
    if (telemetry.telemetry.temperature > 30) {
      messages.push('Thermal control running hot — consider momentum dump.');
    }
    if (telemetry.telemetry.temperature < -10) {
      messages.push('Spacecraft in deep eclipse — switch to survival heaters.');
    }
    if (telemetry.telemetry.commStatus === 'Weak') {
      messages.push('Communications link degraded. Boost DSN power.');
    }
    if (telemetry.telemetry.commStatus === 'Lost') {
      messages.push('Contact lost! Attempt safe mode recovery.');
    }
    return messages;
  }, [telemetry]);

  const historyChart = useMemo(() => {
    if (!history.length) return null;
    return (
      <div className="flex items-end gap-1 h-24">
        {history.map((entry) => (
          <div
            key={entry.telemetry.generatedAt}
            className="flex-1 rounded-full bg-gradient-to-t from-slate-800 to-emerald-500/60"
            style={{
              height: `${entry.telemetry.battery}%`,
              minHeight: '10%',
            }}
            title={`${entry.telemetry.battery}%`}
          />
        ))}
      </div>
    );
  }, [history]);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Health dashboard
          </p>
          <h2 className="text-3xl font-bold text-white">
            Real-time telemetry for Swadeshi satellites
          </h2>
          <p className="text-slate-300 max-w-2xl">
            Synthetic battery, thermal, and comm status built atop the new `/satellites/telemetry/:id`
            endpoint to spotlight operational readiness.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="sat-select" className="text-sm text-slate-300">
            Select satellite
          </label>
          <select
            id="sat-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
          >
            {satellites.map((sat) => (
              <option key={sat.id ?? sat._id ?? sat.norad_id} value={sat.id ?? sat._id ?? sat.norad_id}>
                {sat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-400">{error}</p>}

      {telemetry && (
        <div className="grid lg:grid-cols-3 gap-5">
          <InfoCard
            title={activeSatellite?.name ?? 'Selected satellite'}
            eyebrow="Spacecraft"
            actions={
              <span className="text-xs text-slate-400">
                {new Date(telemetry.telemetry.generatedAt).toLocaleTimeString()}
              </span>
            }
          >
            <p>{activeSatellite?.mission}</p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>NORAD: {activeSatellite?.norad_id}</li>
              <li>Purpose: {activeSatellite?.purpose}</li>
            </ul>
          </InfoCard>

          <InfoCard title="Systems health" eyebrow="Live metrics">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div
                className={`rounded-xl border p-3 text-center ${getBadgeClasses(
                  telemetry.telemetry.battery,
                  75,
                  60
                )}`}
              >
                <p className="text-xs uppercase tracking-widest">Battery</p>
                <p className="text-2xl font-bold">{telemetry.telemetry.battery}%</p>
              </div>
              <div
                className={`rounded-xl border p-3 text-center ${getBadgeClasses(
                  telemetry.telemetry.solarPanelEfficiency,
                  80,
                  65
                )}`}
              >
                <p className="text-xs uppercase tracking-widest">Solar efficiency</p>
                <p className="text-2xl font-bold">
                  {telemetry.telemetry.solarPanelEfficiency}%
                </p>
              </div>
              <div
                className={`rounded-xl border p-3 text-center ${getBadgeClasses(
                  40 - telemetry.telemetry.temperature,
                  25,
                  10
                )}`}
              >
                <p className="text-xs uppercase tracking-widest">Temperature</p>
                <p className="text-2xl font-bold">{telemetry.telemetry.temperature}&deg;C</p>
                <p className="text-xs text-slate-400">
                  {telemetry.telemetry.sunlightPhase === 'sunlight' ? 'Sunlit side' : 'Eclipse'}
                </p>
              </div>
              <div
                className={`rounded-xl border p-3 text-center ${
                  telemetry.telemetry.commStatus === 'OK'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : telemetry.telemetry.commStatus === 'Weak'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                      : 'border-red-500/40 bg-red-500/10 text-red-200'
                }`}
              >
                <p className="text-xs uppercase tracking-widest">Comm status</p>
                <p className="text-2xl font-bold">{telemetry.telemetry.commStatus}</p>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Battery trend" eyebrow="Last 12 samples">
            {historyChart ?? <p className="text-slate-400 text-sm">Collecting history…</p>}
          </InfoCard>
        </div>
      )}

      <InfoCard title="Mission control alerts" eyebrow="Color-coded status">
        {alerts.length === 0 ? (
          <p className="text-emerald-300 text-sm">
            All systems nominal. Continue planned experiment timeline.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((msg) => (
              <li
                key={msg}
                className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-50"
              >
                {msg}
              </li>
            ))}
          </ul>
        )}
      </InfoCard>
    </section>
  );
};

export default HealthDashboard;


