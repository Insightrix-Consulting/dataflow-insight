import { Settings } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { UsersManagement } from '@/components/UsersManagement';
import { AuditLogTable } from '@/components/AuditLogTable';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  const { isAdmin, loading } = useAuth();

  if (loading) return null;
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Settings className="h-5 w-5 text-slate-600" />
            </div>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage users, roles, and system settings
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">Users & Roles</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <AuditLogTable />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
