import { cn } from '@/lib/utils';
import { DocumentStatus } from '@/types/database';

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

const statusConfig: Record<DocumentStatus, { label: string; className: string }> = {
  uploaded: { label: 'Uploaded', className: 'status-uploaded' },
  processing: { label: 'Processing', className: 'status-processing' },
  needs_review: { label: 'Needs Review', className: 'status-needs-review' },
  approved: { label: 'Approved', className: 'status-approved' },
  failed: { label: 'Failed', className: 'status-failed' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
