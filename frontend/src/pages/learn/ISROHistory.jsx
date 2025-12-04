import InfoCard from '../../components/InfoCard';
import historyData from '../../data/learning/history.json';

const ISROHistory = () => (
  <section className="space-y-6">
    <div>
      <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Mission heritage</p>
      <h2 className="text-3xl font-bold text-white">Moments that shaped ISRO</h2>
    </div>
    <div className="grid gap-5">
      {(historyData.milestones || []).map((item) => (
        <InfoCard key={item.title} title={item.title}>
          <p>{item.description}</p>
        </InfoCard>
      ))}
    </div>
  </section>
);

export default ISROHistory;


