import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { MOBILE } from '../constants';

interface FABProps {
  onClick: () => void;
  icon?: string;
  label?: string;
  position?: 'bottom-right' | 'bottom-center';
  hidden?: boolean;
}

/**
 * Floating Action Button for quick actions on mobile
 */
export default function FAB({
  onClick,
  icon = '+',
  label = 'Add',
  position = 'bottom-right',
  hidden = false,
}: FABProps) {
  const { triggerHaptic } = useHapticFeedback();

  const handleClick = () => {
    triggerHaptic('light');
    onClick();
  };

  const positionClasses = {
    'bottom-right': 'right-16',
    'bottom-center': 'left-1/2 transform -translate-x-1/2',
  };

  return (
    <button
      onClick={handleClick}
      className={`
        fixed z-40 animate-fab-in
        ${positionClasses[position]}
        ${hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        transition-opacity duration-300
      `}
      style={{
        bottom: `${MOBILE.FOOTER_HEIGHT + 16}px`,
        width: `${MOBILE.FAB_SIZE}px`,
        height: `${MOBILE.FAB_SIZE}px`,
        borderRadius: '50%',
        backgroundColor: 'var(--color-text-primary)',
        color: 'var(--color-background)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
      aria-label={label}
      type="button"
    >
      <span className="text-2xl font-light">{icon}</span>
    </button>
  );
}
