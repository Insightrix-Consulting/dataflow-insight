import { useState } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { EnergyInvoice } from '@/types/database';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { InvoiceReviewDialog } from './InvoiceReviewDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteEnergyInvoice } from '@/hooks/useEnergyInvoices';

interface EnergyInvoicesTableProps {
  invoices: EnergyInvoice[];
  isLoading?: boolean;
}

export function EnergyInvoicesTable({ invoices, isLoading }: EnergyInvoicesTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<EnergyInvoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<EnergyInvoice | null>(null);
  const { canEdit, isAdmin } = useAuth();
  const deleteInvoice = useDeleteEnergyInvoice();

  const handleDelete = (invoice: EnergyInvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setInvoiceToDelete(invoice);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      deleteInvoice.mutate(invoiceToDelete.id);
      setInvoiceToDelete(null);
    }
  };

  const getOverallConfidence = (invoice: EnergyInvoice) => {
    const confidences = [
      invoice.confidence_invoice_date,
      invoice.confidence_reading_type,
      invoice.confidence_kwh
    ].filter(c => c !== null) as number[];

    if (confidences.length === 0) return null;
    return Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);
  };

  const formatBillingPeriod = (start: string | null, end: string | null) => {
    if (!start || !end) return 'N/A';
    return `${format(new Date(start), 'MMM d')} - ${format(new Date(end), 'MMM d, yyyy')}`;
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">
          Loading invoices...
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">
          No energy invoices found. Upload some documents to get started.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table className="data-table">
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Billing Period</TableHead>
              <TableHead>Reading Type</TableHead>
              <TableHead className="text-right">kWh Used</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const overall = getOverallConfidence(invoice);
              const needsReview = overall !== null && overall < 85;

              return (
                <TableRow 
                  key={invoice.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <TableCell className="font-medium">
                    {invoice.document?.filename ?? 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {invoice.invoice_date 
                      ? format(new Date(invoice.invoice_date), 'MMM d, yyyy')
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {formatBillingPeriod(invoice.billing_period_start, invoice.billing_period_end)}
                  </TableCell>
                  <TableCell>
                    <span className={
                      invoice.reading_type === 'Unknown' 
                        ? 'text-amber-600' 
                        : ''
                    }>
                      {invoice.reading_type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {invoice.kwh_used?.toLocaleString() ?? 'N/A'}
                  </TableCell>
                  <TableCell>
                    <ConfidenceBadge confidence={overall} showLabel={false} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.document?.status ?? 'uploaded'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(invoice);
                        }}
                      >
                        {needsReview && canEdit ? (
                          <>
                            <Edit className="h-4 w-4 mr-1" />
                            Review
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </>
                        )}
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDelete(invoice, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <InvoiceReviewDialog
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      />

      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The extracted invoice data</li>
                <li>The document record</li>
                <li>The uploaded file</li>
              </ul>
              <p className="mt-2 font-medium">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
