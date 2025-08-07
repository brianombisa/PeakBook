import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, DollarSign, List, FileText, Building } from 'lucide-react';

import EmployeeList from '../components/payroll/EmployeeList';
import PayrollRunList from '../components/payroll/PayrollRunList';
import StatutoryReports from '../components/payroll/StatutoryReports';

import { Employee } from '@/api/entities';
import { PayrollRun } from '@/api/entities';

export default function PayrollPage() {
    const [employees, setEmployees] = useState([]);
    const [payrollRuns, setPayrollRuns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [empData, runData] = await Promise.all([
                Employee.list(),
                PayrollRun.list()
            ]);
            setEmployees(empData);
            setPayrollRuns(runData);
        } catch (error) {
            toast({
                title: "Error fetching data",
                description: "Could not load payroll information.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-800">Payroll Management</h1>
                            <p className="text-slate-600 mt-2">Manage employees, process salaries, and file statutory returns.</p>
                        </div>
                    </div>
                </header>

                <Tabs defaultValue="employees" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="employees">
                            <User className="w-4 h-4 mr-2" /> Employees
                        </TabsTrigger>
                        <TabsTrigger value="payroll_runs">
                            <DollarSign className="w-4 h-4 mr-2" /> Payroll Runs
                        </TabsTrigger>
                        <TabsTrigger value="statutory_reports">
                            <Building className="w-4 h-4 mr-2" /> Statutory Reports
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="employees" className="mt-6">
                        <EmployeeList employees={employees} onRefresh={fetchData} isLoading={isLoading} />
                    </TabsContent>
                    <TabsContent value="payroll_runs" className="mt-6">
                        <PayrollRunList payrollRuns={payrollRuns} employees={employees} onRefresh={fetchData} isLoading={isLoading} />
                    </TabsContent>
                    <TabsContent value="statutory_reports" className="mt-6">
                        <StatutoryReports payrollRuns={payrollRuns} isLoading={isLoading} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}