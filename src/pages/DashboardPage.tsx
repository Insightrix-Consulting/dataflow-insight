import { FileText, CheckCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDocuments } from '@/hooks/useDocuments';
import { KPICard } from '@/components/KPICard';
import { AppLayout } from '@/components/AppLayout';
import { ConfidenceBar } from '@/components/ConfidenceBadge';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: documents } = useDocuments();

  // Calculate status distribution for chart
  const statusCounts = documents?.reduce((acc, doc) => {
    const status = doc.status === 'needs_review' ? 'Needs Review' : 
                   doc.status === 'approved' ? 'Approved' :
                   doc.status === 'processing' ? 'Processing' :
                   doc.status === 'uploaded' ? 'Uploaded' : 'Failed';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const chartData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = {
    'Approved': '#22c55e',
    'Needs Review': '#f59e0b',
    'Processing': '#3b82f6',
    'Uploaded': '#94a3b8',
    'Failed': '#ef4444'
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your data extraction pipeline
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Documents Uploaded"
            value={statsLoading ? '...' : stats?.documentsUploaded ?? 0}
            icon={FileText}
          />
          <KPICard
            title="Documents Processed"
            value={statsLoading ? '...' : stats?.documentsProcessed ?? 0}
            icon={CheckCircle}
          />
          <KPICard
            title="Needs Review"
            value={statsLoading ? '...' : stats?.documentsNeedingReview ?? 0}
            icon={AlertTriangle}
          />
          <KPICard
            title="Avg. Confidence"
            value={statsLoading ? '...' : `${stats?.averageConfidence ?? 0}%`}
            icon={BarChart3}
          >
            <div className="mt-4">
              <ConfidenceBar confidence={stats?.averageConfidence ?? null} />
            </div>
          </KPICard>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Document Status Distribution</h3>
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No documents to display
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Pipeline Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Energy Invoices</span>
                <span className="font-semibold">Pilot 1 - Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Transport Records</span>
                <span className="font-semibold text-amber-600">Pilot 2 - Preview</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Travel & Commuting</span>
                <span className="font-semibold text-muted-foreground">Coming Soon</span>
              </div>
              <div className="mt-6 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  The platform is designed for multi-client deployment. Current workspace 
                  serves 7 users with role-based access control.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
