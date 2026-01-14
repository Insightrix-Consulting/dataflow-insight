import { format } from 'date-fns';
import { Info } from 'lucide-react';
import { TransportRecord } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TransportRecordsTableProps {
  records: TransportRecord[];
  isLoading?: boolean;
}

export function TransportRecordsTable({ records, isLoading }: TransportRecordsTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">
          Loading transport records...
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">
          No transport records found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table className="data-table">
          <TableHeader>
            <TableRow>
              <TableHead>Receipt Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead className="text-right">Weight (kg)</TableHead>
              <TableHead>Transport Mode</TableHead>
              <TableHead>UK Zone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {record.receipt_created_date 
                    ? format(new Date(record.receipt_created_date), 'MMM d, yyyy')
                    : 'N/A'
                  }
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{record.supplier_name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{record.supplier_code}</p>
                  </div>
                </TableCell>
                <TableCell>{record.ship_country ?? 'N/A'}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {record.destination_postcode ?? 'N/A'}
                  </code>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {record.total_weight?.toLocaleString() ?? 'N/A'}
                </TableCell>
                <TableCell>
                  <span className={
                    record.transport_mode === 'Unknown' 
                      ? 'text-amber-600' 
                      : ''
                  }>
                    {record.transport_mode}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={
                    record.uk_zone === 'Unknown' 
                      ? 'text-amber-600' 
                      : ''
                  }>
                    {record.uk_zone}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Coming in Phase 2:</strong> Distance calculation (road/sea) and nearest port logic 
          will be enabled after Pilot 1 validation is complete.
        </AlertDescription>
      </Alert>
    </div>
  );
}
