import { Truck, Info } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { TransportRecordsTable } from '@/components/TransportRecordsTable';
import { useTransportRecords } from '@/hooks/useTransportRecords';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function TransportDataPage() {
  const { data: records, isLoading } = useTransportRecords();

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold">Transport Data</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            This sample shows one month of transport data. The process includes segregation 
            by transport mode and geographic zones, with distance calculations added in later phases.
          </p>
        </div>

        {/* Pilot 2 indicator */}
        <Alert className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Pilot 2 - Preview Only</AlertTitle>
          <AlertDescription className="text-amber-700">
            This is a preview of the transport data workflow. Upload and automation features 
            are intentionally disabled until Pilot 1 is validated.
          </AlertDescription>
        </Alert>

        {/* Phase 2 notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs">1</span>
              Distance Calculation
            </h3>
            <p className="text-sm text-muted-foreground">
              Road and sea distance calculations will be enabled in Phase 2 after 
              Pilot 1 validation is complete.
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs">2</span>
              Nearest Port Logic
            </h3>
            <p className="text-sm text-muted-foreground">
              Automatic detection of the nearest port for sea freight will be 
              added after initial validation.
            </p>
          </div>
        </div>

        {/* Records Table */}
        <div>
          <h2 className="font-semibold mb-4">Sample Transport Records</h2>
          <TransportRecordsTable records={records || []} isLoading={isLoading} />
        </div>
      </div>
    </AppLayout>
  );
}
