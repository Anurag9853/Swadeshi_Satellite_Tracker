import InfoCard from '../../components/InfoCard';
import gaganyaanData from '../../data/learning/gaganyaan.json';

const Gaganyaan = () => (
  <section className="space-y-6">
    <div>
      <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Crewed flight</p>
      <h2 className="text-3xl font-bold text-white">Gaganyaan primer</h2>
    </div>
    <div className="grid md:grid-cols-3 gap-5">
      {(gaganyaanData.modules || []).map((item) => (
        <InfoCard key={item.title} title={item.title}>
          <p>{item.description}</p>
        </InfoCard>
      ))}
    </div>
  </section>
);

export default Gaganyaan;


