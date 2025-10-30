import { Button } from '../ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-[var(--color-surface)] rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon className="w-10 h-10 text-[var(--color-text-secondary)]" />
        </div>
        <h4 className="mb-3">{title}</h4>
        <p className="text-[var(--color-text-secondary)] mb-6">{description}</p>
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="bg-[var(--color-secondary)] hover:bg-[#6B7AE5] text-white"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
