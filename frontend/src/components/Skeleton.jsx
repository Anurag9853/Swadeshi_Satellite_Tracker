const Skeleton = ({ 
  variant = 'rect', 
  width, 
  height, 
  className = '' 
}) => {
  const baseClasses = `
    animate-pulse
    bg-slate-800/50
    rounded
    ${className}
  `;

  const variantClasses = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    line: 'rounded',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]}`}
      style={style}
    />
  );
};

export default Skeleton;

