import { format } from 'date-fns';
import { Activity } from 'lucide-react';
import { useAuditLog } from '@/hooks/useAuditLog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const actionLabels: Record<string, string> = {
  upload: 'Uploaded document',
  approve: 'Approved invoice',
  edit: 'Edited invoice',
  login: 'Logged in',
  logout: 'Logged out',
};

export function AuditLogTable() {
  const { data: logs, isLoading } = useAuditLog();

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading audit log...
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Activity Log</h3>
        <p className="text-sm text-muted-foreground">
          Track all actions taken in the system
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table className="data-table">
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <span className="font-medium">
                    {actionLabels[log.action] || log.action}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {log.entity_type}
                  {log.entity_id && (
                    <code className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                      {log.entity_id.slice(0, 8)}...
                    </code>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
