const ToggleGroup = ({ options, active = [], onToggle = () => {} }) => {
  const activeValues = Array.isArray(active) ? active : [active];
  return (
  <div className="inline-flex rounded-full bg-slate-900 border border-slate-700 p-1">
    {options.map((option) => {
      const isActive = activeValues.includes(option.value);
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onToggle(option.value)}
          className={[
            'px-4 py-1.5 text-sm font-medium rounded-full transition',
            isActive ? 'bg-accent text-slate-900 shadow' : 'text-slate-300 hover:text-white',
          ].join(' ')}
        >
          {option.label}
        </button>
      );
    })}
  </div>
  );
};

export default ToggleGroup;


