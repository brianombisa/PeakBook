
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Removed Building, Users, ShieldCheck as they are no longer used for icons in the tab triggers.

import CompanyProfile from '../components/settings/CompanyProfile';
import UserManagement from '../components/settings/UserManagement';
import RolesAndPermissions from '../components/settings/RolesAndPermissions';
import CurrencySettings from '../components/settings/CurrencySettings';

export default function SettingsPage() {
  // Added state for companyProfile to manage settings across different components.
  // Initial state includes basic currency settings and dummy company info.
  const [companyProfile, setCompanyProfile] = useState({
    baseCurrency: 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY'],
    exchangeRates: {
      'EUR': 0.92, // Example rate for 1 USD = 0.92 EUR
      'GBP': 0.79, // Example rate for 1 USD = 0.79 GBP
      'JPY': 155.00 // Example rate for 1 USD = 155 JPY
    },
    // Dummy company profile settings for the CompanyProfile component
    companyName: 'Acme Corp',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '90210',
    country: 'USA',
  });

  // Function to handle updates to the companyProfile state
  const handleCompanyUpdate = (newSettings) => {
    setCompanyProfile(prev => ({ ...prev, ...newSettings }));
  };

  return (
    // Outermost div's padding and background adjusted as per outline
    <div className="p-6 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Wrapper div updated as per outline */}
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          {/* h1 classname updated and p tag removed as per outline */}
          <h1 className="text-3xl font-bold text-slate-800 mb-8">Settings</h1>
        </header>

        <Tabs defaultValue="company" className="w-full">
          {/* TabsList className updated to grid-cols-4 as per outline */}
          <TabsList className="grid w-full grid-cols-4">
            {/* TabsTrigger content (text only) and values updated as per outline.
                Existing classNames are preserved to maintain styling. */}
            <TabsTrigger value="company" className="bg-slate-50 p-4 text-sm font-medium inline-flex items-center justify-center whitespace-nowrap rounded-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Company Profile
            </TabsTrigger>
            <TabsTrigger value="users" className="bg-slate-50 p-4 text-sm font-medium inline-flex items-center justify-center whitespace-nowrap rounded-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Team & Users
            </TabsTrigger>
            <TabsTrigger value="currency" className="bg-slate-50 p-4 text-sm font-medium inline-flex items-center justify-center whitespace-nowrap rounded-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Currency
            </TabsTrigger>
            <TabsTrigger value="permissions" className="bg-slate-50 p-4 text-sm font-medium inline-flex items-center justify-center whitespace-nowrap rounded-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Roles & Permissions
            </TabsTrigger>
            {/* The 'Banking' tab trigger has been removed as per the outline */}
          </TabsList>
          
          <TabsContent value="company" className="mt-6">
            {/* CompanyProfile now receives companyProfile state and an update handler */}
            <CompanyProfile 
              companyProfile={companyProfile} 
              onUpdate={handleCompanyUpdate} 
            />
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="currency" className="mt-6">
            {/* CurrencySettings already received companyProfile state and an update handler */}
            <CurrencySettings 
              companyProfile={companyProfile} 
              onUpdate={handleCompanyUpdate} 
            />
          </TabsContent>
          
          <TabsContent value="permissions" className="mt-6">
            {/* Value changed from "roles" to "permissions" */}
            <RolesAndPermissions />
          </TabsContent>

          {/* The 'Banking' TabsContent has been removed as per the outline */}
        </Tabs>
      </div> {/* End of max-w-6xl mx-auto div */}
    </div>
  );
}
