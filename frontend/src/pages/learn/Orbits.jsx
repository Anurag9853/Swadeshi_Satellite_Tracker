import InfoCard from '../../components/InfoCard';
import orbitsData from '../../data/learning/orbits.json';

const Orbits = () => (
  <section className="space-y-6">
    <div>
      <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Orbit classroom</p>
      <h2 className="text-3xl font-bold text-white">How ISRO positions its spacecraft</h2>
    </div>

    <div className="grid md:grid-cols-2 gap-5">
      {(orbitsData.orbitTopics || []).map((topic) => (
        <InfoCard key={topic.title} title={topic.title}>
          <p>{topic.description}</p>
        </InfoCard>
      ))}
    </div>

    <InfoCard title="TLE + SGP4" eyebrow="Why it matters here">
      <div className="grid md:grid-cols-3 gap-5">
        {(orbitsData.tleInsights || []).map((item) => (
          <div key={item.title}>
            <p className="font-semibold text-white">{item.title}</p>
            <p className="text-sm text-slate-300">{item.text}</p>
          </div>
        ))}
      </div>
    </InfoCard>
  </section>
);

export default Orbits;


