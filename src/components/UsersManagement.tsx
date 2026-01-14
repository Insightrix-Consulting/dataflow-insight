import { useState } from 'react';
import { format } from 'date-fns';
import { UserPlus, Shield, Eye, Edit, Mail } from 'lucide-react';
import { UserWithRole, useUsers, useUpdateUserRole } from '@/hooks/useUsers';
import { AppRole } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const roleIcons: Record<AppRole, typeof Shield> = {
  admin: Shield,
  reviewer: Edit,
  viewer: Eye,
};

const roleLabels: Record<AppRole, string> = {
  admin: 'Admin',
  reviewer: 'Reviewer',
  viewer: 'Viewer',
};

const roleDescriptions: Record<AppRole, string> = {
  admin: 'Full access, manage users',
  reviewer: 'Validate extracted data',
  viewer: 'Read-only access',
};

export function UsersManagement() {
  const { data: users, isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const { user: currentUser, isAdmin } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);

  const handleRoleChange = async (userId: string, role: AppRole) => {
    await updateRole.mutateAsync({ userId, role });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading users...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage user access and permissions
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table className="data-table">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => {
              const RoleIcon = roleIcons[user.role];
              const isCurrentUser = user.id === currentUser?.id;

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {(user.full_name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.full_name || 'No name'}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isAdmin && !isCurrentUser ? (
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as AppRole)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(['admin', 'reviewer', 'viewer'] as AppRole[]).map((role) => {
                            const Icon = roleIcons[role];
                            return (
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-3 w-3" />
                                  {roleLabels[role]}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <RoleIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{roleLabels[user.role]}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm text-muted-foreground">
                      {roleDescriptions[user.role]}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your workspace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                />
                <Button>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                New users will receive a viewer role by default. You can change their role after they sign up.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
