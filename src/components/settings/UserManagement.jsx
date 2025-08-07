
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Trash2, Users } from 'lucide-react'; // Added Trash2 icon

export default function UserManagement({ users: initialUsers = [], onRefresh }) {
  const [users, setUsers] = useState(initialUsers);
  const [isSaving, setIsSaving] = useState(false); // For role updates
  const [isInviting, setIsInviting] = useState(false); // For inviting new users
  const [inviteFormData, setInviteFormData] = useState({
    full_name: '',
    email: '',
    app_role: 'Account Manager' // Default role for new invite
  });
  const { toast } = useToast();

  useEffect(() => {
    // Update internal state if initialUsers prop changes
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setIsSaving(true);
    try {
      await User.update(userId, { app_role: newRole });
      onRefresh(); // Trigger refresh from parent component
      toast({ title: 'Success', description: 'User role updated successfully.' });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setIsInviting(true);

    try {
      await User.create(inviteFormData);

      toast({
        title: "User Invited",
        description: `${inviteFormData.full_name} has been invited. They will receive an invitation email.`
      });

      setInviteFormData({ full_name: '', email: '', app_role: 'Account Manager' }); // Reset form
      onRefresh(); // Trigger refresh of user list
    } catch (error) {
      console.error("Error inviting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to invite user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveUser = async (user) => {
    if (!window.confirm(`Are you sure you want to remove ${user.full_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await User.delete(user.id);
      toast({ title: "User Removed", description: `${user.full_name} has been successfully removed.` });
      onRefresh(); // Trigger refresh of user list
    } catch (error) {
      console.error("Error removing user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove user. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Map roles to Tailwind CSS classes for badges
  const roleColors = {
    'Director': 'bg-purple-100 text-purple-800',
    'Manager': 'bg-blue-100 text-blue-800',
    'Accountant': 'bg-green-100 text-green-800',
    'Account Manager': 'bg-orange-100 text-orange-800',
    'Auditor': 'bg-red-100 text-red-800'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">Manage team members and their access levels</p>
      </CardHeader>
      <CardContent>
        <div className="mb-6 pb-6 border-b"> {/* Separator for invite form */}
          <h3 className="text-lg font-medium mb-4">Invite New User</h3>
          <form onSubmit={handleInviteSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="invite-full_name">Full Name</Label>
              <Input
                id="invite-full_name"
                value={inviteFormData.full_name}
                onChange={(e) => setInviteFormData({ ...inviteFormData, full_name: e.target.value })}
                placeholder="John Doe"
                required
                disabled={isInviting}
              />
            </div>
            <div>
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteFormData.email}
                onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                placeholder="john@company.com"
                required
                disabled={isInviting}
              />
            </div>
            <div>
              <Label htmlFor="invite-role-select">App Role</Label>
              <Select
                value={inviteFormData.app_role}
                onValueChange={(value) => setInviteFormData({ ...inviteFormData, app_role: value })}
                disabled={isInviting}
              >
                <SelectTrigger id="invite-role-select">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Account Manager">Account Manager</SelectItem>
                  <SelectItem value="Accountant">Accountant</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Auditor">Auditor</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={isInviting}>
                {isInviting ? "Inviting..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </div>

        <div className="pt-4">
          <h3 className="text-lg font-medium mb-4">Manage Existing Users</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>System Role</TableHead> {/* New column */}
                <TableHead>App Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.role || 'User'}</Badge> {/* Displaying system role */}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.app_role || 'Accountant'}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        disabled={isSaving} // Disable during save
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Director">Director</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Accountant">Accountant</SelectItem>
                          <SelectItem value="Auditor">Auditor</SelectItem>
                          <SelectItem value="Account Manager">Account Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveUser(user)}
                        disabled={isSaving || isInviting} // Disable if other actions are pending
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No team members found. Invite your first team member to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
