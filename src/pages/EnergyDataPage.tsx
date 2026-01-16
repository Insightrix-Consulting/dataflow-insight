import { Download } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { FileUploadZone } from '@/components/FileUploadZone';
import { EnergyInvoicesTable } from '@/components/EnergyInvoicesTable';
import { useEnergyInvoices } from '@/hooks/useEnergyInvoices';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap } from 'lucide-react';

export default function EnergyDataPage() {
  const { data: invoices, isLoading } = useEnergyInvoices();
  const { canEdit } = useAuth();

  const handleExport = () => {
    if (!invoices || invoices.length === 0) return;

    const headers = ['Invoice Date', 'Billing Period Start', 'Billing Period End', 'Reading Type', 'kWh Used', 'Confidence', 'Status'];
    const rows = invoices.map(inv => [
      inv.invoice_date || '',
      inv.billing_period_start || '',
      inv.billing_period_end || '',
      inv.reading_type,
      inv.kwh_used?.toString() || '',
      ((inv.confidence_invoice_date || 0) + (inv.confidence_reading_type || 0) + (inv.confidence_kwh || 0)) / 3,
      inv.document?.status || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `energy-invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold">Energy Data</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Here is a selection of electric and gas bills. We extract the date of the invoice, 
              whether it is estimated, actual, or customer read, and the kWh's used in the period.
            </p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!invoices?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Pilot indicator */}
        <Alert className="bg-green-50 border-green-200">
          <Zap className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Pilot 1 - Active:</strong> This is the primary extraction workflow. 
            All features are fully functional.
          </AlertDescription>
        </Alert>

        {/* Upload Section */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Upload Documents</h2>
          <FileUploadZone documentType="energy" />
        </div>

        {/* Invoices Table */}
        <div>
          <h2 className="font-semibold mb-4">Extracted Invoices</h2>
          <EnergyInvoicesTable invoices={invoices || []} isLoading={isLoading} />
        </div>
      </div>
    </AppLayout>
  );
}
