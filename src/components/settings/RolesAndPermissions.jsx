import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle } from 'lucide-react';

const rolesConfig = [
  {
    role: 'Director',
    description: 'Full access to all features, including company settings and user management. Can see and do everything.',
    permissions: {
      dashboard: true,
      invoicing: true,
      expenses: true,
      transactions: true,
      reports: true,
      payroll: true,
      settings: true,
      userManagement: true,
    },
  },
  {
    role: 'Accountant',
    description: 'Manages day-to-day finances. Full access to all financial modules like invoicing, expenses, and payroll.',
    permissions: {
      dashboard: true,
      invoicing: true,
      expenses: true,
      transactions: true,
      reports: true,
      payroll: true,
      settings: false,
      userManagement: false,
    },
  },
  {
    role: 'Manager',
    description: 'Oversees business performance. Can view dashboards and reports to monitor progress, but cannot edit financial data.',
    permissions: {
      dashboard: true,
      invoicing: false,
      expenses: false,
      transactions: false,
      reports: true,
      payroll: false,
      settings: false,
      userManagement: false,
    },
  },
  {
    role: 'Auditor',
    description: 'Has read-only access to all financial data for auditing purposes. Cannot create or edit any transactions.',
    permissions: {
      dashboard: true,
      invoicing: true, // (View only)
      expenses: true, // (View only)
      transactions: true, // (View only)
      reports: true,
      payroll: true, // (View only)
      settings: false,
      userManagement: false,
    },
  },
];

const PermissionCheck = ({ hasPermission }) => {
  return hasPermission ? (
    <CheckCircle2 className="h-5 w-5 text-green-500" />
  ) : (
    <XCircle className="h-5 w-5 text-red-500" />
  );
};

export default function RolesAndPermissions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles & Permissions</CardTitle>
        <CardDescription>
          Understand the access levels for each role to effectively manage your team. Directors can assign these roles in the User Management tab.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {rolesConfig.map((role) => (
            <div key={role.role}>
              <h3 className="text-lg font-semibold">{role.role}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-3">{role.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                  <PermissionCheck hasPermission={role.permissions.dashboard} />
                  <span className="text-sm">View Dashboard</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                  <PermissionCheck hasPermission={role.permissions.invoicing} />
                  <span className="text-sm">Manage Invoices</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                  <PermissionCheck hasPermission={role.permissions.expenses} />
                  <span className="text-sm">Manage Expenses</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                  <PermissionCheck hasPermission={role.permissions.reports} />
                  <span className="text-sm">View Reports</span>
                </div>
                 <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                  <PermissionCheck hasPermission={role.permissions.payroll} />
                  <span className="text-sm">Manage Payroll</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                  <PermissionCheck hasPermission={role.permissions.settings} />
                  <span className="text-sm">Access Settings</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}