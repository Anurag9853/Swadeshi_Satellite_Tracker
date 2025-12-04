import { Link } from 'react-router-dom';
import InfoCard from '../../components/InfoCard';
import modulesData from '../../data/learning/modules.json';

const LearningHub = () => (
  <section className="space-y-8">
    <div>
      <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Learning hub</p>
      <h2 className="text-3xl font-bold text-white">ISRO Knowledge Capsule</h2>
      <p className="text-slate-300 max-w-3xl">
        Dive into curated lessons on indigenous launchers, crew missions, and data standards. Each module
        is sourced from static JSON, keeping the knowledge base offline friendly.
      </p>
    </div>
    <div className="grid md:grid-cols-2 gap-5">
      {(modulesData.modules || []).map((module) => (
        <InfoCard key={module.path} title={module.title}>
          <p>{module.summary}</p>
          <Link
            to={module.path}
            className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 text-sm"
          >
            Explore module →
          </Link>
        </InfoCard>
      ))}
    </div>
  </section>
);

export default LearningHub;


