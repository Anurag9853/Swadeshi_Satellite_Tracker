import InfoCard from '../../components/InfoCard';
import vehiclesData from '../../data/learning/launchVehicles.json';

const LaunchVehicles = () => (
  <section className="space-y-6">
    <div>
      <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Launch vehicles</p>
      <h2 className="text-3xl font-bold text-white">ISRO lift capability</h2>
    </div>
    <div className="grid gap-5 md:grid-cols-3">
      {(vehiclesData.vehicles || []).map((vehicle) => (
        <InfoCard key={vehicle.name} title={vehicle.name}>
          <p className="text-sm text-slate-400">{vehicle.payload}</p>
          <p>{vehicle.description}</p>
        </InfoCard>
      ))}
    </div>
  </section>
);

export default LaunchVehicles;


