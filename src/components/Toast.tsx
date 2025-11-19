import { useToast, Toast as ToastType } from '../hooks/useToast';

function ToastContainer() {
  const toasts = useToast((state) => state.toasts);
  const removeToast = useToast((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-24 right-24 z-50 flex flex-col gap-12 max-w-md"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastType;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-[#0A3A0A] border-[#1A5A1A] text-[#90EE90]';
      case 'error':
        return 'bg-[#3A0A0A] border-[#5A1A1A] text-[#FF6B6B]';
      case 'warning':
        return 'bg-[#3A2A0A] border-[#5A4A1A] text-[#FFD93D]';
      case 'info':
      default:
        return 'bg-[#0A1A2A] border-[#1A2A3A] text-[#87CEEB]';
    }
  };

  const getTypeIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      className={`
        flex items-start gap-12 px-16 py-12 rounded-sm
        border ${getTypeStyles()}
        shadow-lg animate-slideIn
        font-mono text-sm
      `}
      role="alert"
      aria-atomic="true"
    >
      <span className="flex-shrink-0 text-base" aria-hidden="true">
        {getTypeIcon()}
      </span>
      <p className="flex-1 leading-relaxed">{toast.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

export default ToastContainer;
