import InfoCard from '../components/InfoCard';
import selfRelianceData from '../data/selfReliance.json';

const SelfReliance = () => (
  <section className="space-y-8">
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Atmanirbhar index</p>
      <h2 className="text-3xl font-bold text-white">Swadeshi self-reliance score</h2>
      <p className="text-slate-300 max-w-3xl">
        Static snapshot showing how much of key services are delivered by Indian space assets.
        The bars highlight current share handled domestically versus support from foreign constellations.
      </p>
    </div>
    <div className="grid md:grid-cols-2 gap-5">
      {(selfRelianceData.domains || []).map((entry) => (
        <InfoCard key={entry.name} title={entry.name} eyebrow="Capability mix">
          <div className="space-y-3">
            <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                style={{ width: `${entry.indian}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-slate-300">
              <span>Indian: {entry.indian}%</span>
              <span>Foreign support: {entry.foreign}%</span>
            </div>
            <p className="text-xs text-slate-400">{entry.context}</p>
          </div>
        </InfoCard>
      ))}
    </div>
    <InfoCard title="Atmanirbhar insights" eyebrow="Narrative">
      <ul className="list-disc pl-5 space-y-2 text-slate-300">
        {(selfRelianceData.insights || []).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </InfoCard>
  </section>
);

export default SelfReliance;


