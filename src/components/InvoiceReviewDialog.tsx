import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckCircle, FileText, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfidenceBadge, ConfidenceBar } from '@/components/ConfidenceBadge';
import { EnergyInvoice, ReadingType } from '@/types/database';
import { useUpdateEnergyInvoice, useApproveInvoice } from '@/hooks/useEnergyInvoices';
import { useAuth } from '@/contexts/AuthContext';

interface InvoiceReviewDialogProps {
  invoice: EnergyInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceReviewDialog({ invoice, open, onOpenChange }: InvoiceReviewDialogProps) {
  const { canEdit } = useAuth();
  const updateInvoice = useUpdateEnergyInvoice();
  const approveInvoice = useApproveInvoice();

  const [formData, setFormData] = useState({
    invoice_date: '',
    billing_period_start: '',
    billing_period_end: '',
    reading_type: 'Unknown' as ReadingType,
    kwh_used: '',
    reviewer_notes: ''
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_date: invoice.invoice_date ?? '',
        billing_period_start: invoice.billing_period_start ?? '',
        billing_period_end: invoice.billing_period_end ?? '',
        reading_type: invoice.reading_type,
        kwh_used: invoice.kwh_used?.toString() ?? '',
        reviewer_notes: invoice.reviewer_notes ?? ''
      });
    }
  }, [invoice]);

  if (!invoice) return null;

  const getOverallConfidence = () => {
    const confidences = [
      invoice.confidence_invoice_date,
      invoice.confidence_reading_type,
      invoice.confidence_kwh
    ].filter(c => c !== null) as number[];

    if (confidences.length === 0) return null;
    return Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);
  };

  const overallConfidence = getOverallConfidence();
  const needsReview = overallConfidence !== null && overallConfidence < 85;

  const handleSave = async () => {
    await updateInvoice.mutateAsync({
      id: invoice.id,
      updates: {
        invoice_date: formData.invoice_date || undefined,
        billing_period_start: formData.billing_period_start || undefined,
        billing_period_end: formData.billing_period_end || undefined,
        reading_type: formData.reading_type,
        kwh_used: formData.kwh_used ? parseFloat(formData.kwh_used) : undefined,
        reviewer_notes: formData.reviewer_notes || undefined
      }
    });
  };

  const handleApprove = async () => {
    await handleSave();
    await approveInvoice.mutateAsync(invoice.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {invoice.document?.filename ?? 'Invoice Review'}
            {needsReview && (
              <span className="flex items-center gap-1 text-amber-600 text-sm font-normal">
                <AlertTriangle className="h-4 w-4" />
                Needs Review
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Left: PDF Preview */}
          <div className="bg-muted/50 rounded-lg overflow-hidden min-h-[400px]">
            {invoice.document?.file_url ? (
              <iframe
                src={invoice.document.file_url}
                className="w-full h-full min-h-[500px] border-0"
                title={`Preview of ${invoice.document?.filename ?? 'document'}`}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No document uploaded</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Extracted fields */}
          <div className="space-y-6">
            {/* Confidence overview */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Confidence</span>
                <ConfidenceBadge confidence={overallConfidence} />
              </div>
              <ConfidenceBar confidence={overallConfidence} />
            </div>

            {/* Invoice Date */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="invoice_date">Invoice Date</Label>
                <ConfidenceBadge confidence={invoice.confidence_invoice_date} showLabel={false} />
              </div>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                disabled={!canEdit}
              />
            </div>

            {/* Billing Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billing_start">Billing Period Start</Label>
                <Input
                  id="billing_start"
                  type="date"
                  value={formData.billing_period_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, billing_period_start: e.target.value }))}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_end">Billing Period End</Label>
                <Input
                  id="billing_end"
                  type="date"
                  value={formData.billing_period_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, billing_period_end: e.target.value }))}
                  disabled={!canEdit}
                />
              </div>
            </div>

            {/* Reading Type */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reading_type">Reading Type</Label>
                <ConfidenceBadge confidence={invoice.confidence_reading_type} showLabel={false} />
              </div>
              <Select
                value={formData.reading_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reading_type: value as ReadingType }))}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Actual">Actual</SelectItem>
                  <SelectItem value="Estimated">Estimated</SelectItem>
                  <SelectItem value="Customer Read">Customer Read</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* kWh Used */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="kwh_used">kWh Used</Label>
                <ConfidenceBadge confidence={invoice.confidence_kwh} showLabel={false} />
              </div>
              <Input
                id="kwh_used"
                type="number"
                step="0.01"
                value={formData.kwh_used}
                onChange={(e) => setFormData(prev => ({ ...prev, kwh_used: e.target.value }))}
                disabled={!canEdit}
              />
            </div>

            {/* Reviewer Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Reviewer Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this invoice..."
                value={formData.reviewer_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, reviewer_notes: e.target.value }))}
                disabled={!canEdit}
                rows={3}
              />
            </div>

            {/* Actions */}
            {canEdit && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSave}
                  disabled={updateInvoice.isPending}
                >
                  Save Changes
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleApprove}
                  disabled={approveInvoice.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
