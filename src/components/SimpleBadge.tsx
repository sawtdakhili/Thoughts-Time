interface SimpleBadgeProps {
  label?: string;
  variant?: 'default' | 'accent';
  onClick?: () => void;
}

export default function SimpleBadge({
  label = 'Badge',
  variant = 'default',
  onClick,
}: SimpleBadgeProps) {
  const base = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
  const variantClass =
    variant === 'accent' ? 'bg-accent text-white' : 'bg-slate-200 text-slate-900';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`${base} ${variantClass}`}
    >
      {label}
    </button>
  );
}
