import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const KRA_RATES = {
    PAYE: [
        { limit: 24000, rate: 0.10 },
        { limit: 32333, rate: 0.25 },
        { limit: Infinity, rate: 0.30 }
    ],
    NHIF_SHIF: [ // SHIF rates (example, replace with official)
        { limit: 5999, amount: 150 },
        { limit: 7999, amount: 300 },
        { limit: 11999, amount: 400 },
        { limit: 14999, amount: 500 },
        { limit: 19999, amount: 600 },
        { limit: 24999, amount: 750 },
        { limit: 29999, amount: 850 },
        { limit: 34999, amount: 900 },
        { limit: 39999, amount: 950 },
        { limit: 44999, amount: 1000 },
        { limit: 49999, amount: 1100 },
        { limit: 59999, amount: 1200 },
        { limit: 69999, amount: 1300 },
        { limit: 79999, amount: 1400 },
        { limit: 89999, amount: 1500 },
        { limit: 99999, amount: 1600 },
        { limit: Infinity, amount: 1700 }
    ],
    NSSF_TIER_1_LIMIT: 6000,
    NSSF_RATE: 0.06,
    HOUSING_LEVY_RATE: 0.015,
};

const StatutoryReportCard = ({ title, amount, description }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-blue-600">
                KES {Math.round(amount).toLocaleString()}
            </div>
        </CardContent>
    </Card>
);

export default function StatutoryReports({ payrollRuns = [], isLoading }) {
    const [selectedPeriod, setSelectedPeriod] = useState('all');

    const availablePeriods = useMemo(() => {
        const periods = new Set(payrollRuns.map(run => run.payroll_period));
        return Array.from(periods);
    }, [payrollRuns]);

    const filteredRuns = useMemo(() => {
        if (selectedPeriod === 'all') return payrollRuns;
        return payrollRuns.filter(run => run.payroll_period === selectedPeriod);
    }, [payrollRuns, selectedPeriod]);

    const reportData = useMemo(() => {
        let totalPAYE = 0;
        let totalNSSF = 0;
        let totalSHIF = 0;
        let totalHousingLevy = 0;
        let totalGrossPay = 0;

        filteredRuns.forEach(run => {
            (run.payslips || []).forEach(slip => {
                totalPAYE += slip.deductions?.paye_tax || 0;
                totalNSSF += slip.deductions?.nssf || 0;
                totalSHIF += slip.deductions?.shif || 0;
                totalHousingLevy += slip.deductions?.housing_levy || 0;
                totalGrossPay += slip.gross_pay || 0;
            });
        });

        return { totalPAYE, totalNSSF, totalSHIF, totalHousingLevy, totalGrossPay };
    }, [filteredRuns]);

    if (isLoading) {
        return <div>Loading statutory reports...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Statutory Contribution Summary</CardTitle>
                        <CardDescription>View total deductions for PAYE, NSSF, SHIF, and Housing Levy.</CardDescription>
                    </div>
                    <div className="flex gap-4">
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Periods</SelectItem>
                                {availablePeriods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Download Summary</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatutoryReportCard title="Total PAYE" amount={reportData.totalPAYE} description="Income tax remitted to KRA" />
                        <StatutoryReportCard title="Total SHIF (NHIF)" amount={reportData.totalSHIF} description="Social Health Insurance Fund" />
                        <StatutoryReportCard title="Total NSSF" amount={reportData.totalNSSF} description="National Social Security Fund" />
                        <StatutoryReportCard title="Total Housing Levy" amount={reportData.totalHousingLevy} description="Affordable Housing Levy" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detailed Breakdown</CardTitle>
                    <CardDescription>Contribution details per payroll run.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead className="text-right">Gross Pay</TableHead>
                                <TableHead className="text-right">PAYE</TableHead>
                                <TableHead className="text-right">SHIF (NHIF)</TableHead>
                                <TableHead className="text-right">NSSF</TableHead>
                                <TableHead className="text-right">Housing Levy</TableHead>
                                <TableHead className="text-right">Total Deductions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRuns.map(run => {
                                const periodDeductions = (run.payslips || []).reduce((acc, slip) => {
                                    acc.paye += slip.deductions?.paye_tax || 0;
                                    acc.shif += slip.deductions?.shif || 0;
                                    acc.nssf += slip.deductions?.nssf || 0;
                                    acc.housing_levy += slip.deductions?.housing_levy || 0;
                                    acc.gross_pay += slip.gross_pay || 0;
                                    return acc;
                                }, { paye: 0, shif: 0, nssf: 0, housing_levy: 0, gross_pay: 0 });
                                const totalPeriodDeductions = periodDeductions.paye + periodDeductions.shif + periodDeductions.nssf + periodDeductions.housing_levy;

                                return (
                                    <TableRow key={run.id}>
                                        <TableCell className="font-medium">{run.payroll_period}</TableCell>
                                        <TableCell className="text-right">KES {Math.round(periodDeductions.gross_pay).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">KES {Math.round(periodDeductions.paye).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">KES {Math.round(periodDeductions.shif).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">KES {Math.round(periodDeductions.nssf).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">KES {Math.round(periodDeductions.housing_levy).toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold">KES {Math.round(totalPeriodDeductions).toLocaleString()}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}