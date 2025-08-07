
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Zap, AlertTriangle, Calculator, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // This import is no longer needed but keeping it for now in case other components use it, though best practice would be to remove unused imports. For this specific component, it becomes unused after changes.
import { motion } from "framer-motion";
import { format, getYear } from "date-fns";

// Assume these imports point to existing modules in the project
// If these are not real modules, they would need to be defined elsewhere or mocked globally for the app to run.
import { Employee } from '@/api/entities';
import { PayrollRun } from '@/api/entities';
import TransactionService from '../services/TransactionService';
import AuditLogger from '../utils/AuditLogger';

// Kenyan tax brackets and rates for 2024
const TAX_BRACKETS = [
  { min: 0, max: 24000, rate: 0.10 },
  { min: 24001, max: 32333, rate: 0.25 },
  { min: 32334, max: 500000, rate: 0.30 },
  { min: 500001, max: 800000, rate: 0.325 },
  { min: 800001, max: Infinity, rate: 0.35 }
];

const PERSONAL_RELIEF = 2400; // Monthly personal relief
const NSSF_RATE = 0.06; // 6% of pensionable pay
const NSSF_MAX = 1080; // Maximum NSSF contribution
const SHIF_RATE = 0.0275; // 2.75% of gross pay
const HOUSING_LEVY_RATE = 0.015; // 1.5% of gross pay

export default function PayrollProcessor({ employees, onComplete, onCancel, period }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const activeEmployees = useMemo(() => employees.filter(e => e.is_active), [employees]);

  const calculatePAYE = (taxablePay) => {
    let tax = 0;
    let remainingPay = taxablePay;

    for (const bracket of TAX_BRACKETS) {
      if (remainingPay <= 0) break;
      
      const taxableInBracket = Math.min(remainingPay, bracket.max - bracket.min + 1);
      tax += taxableInBracket * bracket.rate;
      remainingPay -= taxableInBracket;
    }

    return Math.max(0, tax - PERSONAL_RELIEF);
  };

  const calculatePayroll = (employee) => {
    const basicSalary = employee.basic_salary || 0;
    const allowances = employee.allowances || {};
    
    const totalAllowances = Object.values(allowances).reduce((sum, allowance) => sum + (allowance || 0), 0);
    const grossPay = basicSalary + totalAllowances;
    
    // Taxable pay (some allowances may not be taxable)
    const taxablePay = grossPay;
    
    // Calculate NSSF (6% of pensionable pay, max 1080)
    const nssf = Math.min(basicSalary * NSSF_RATE, NSSF_MAX);
    
    // Calculate SHIF (2.75% of gross pay)
    const shif = grossPay * SHIF_RATE;
    
    // Calculate Housing Levy (1.5% of gross pay)
    const housingLevy = grossPay * HOUSING_LEVY_RATE;
    
    // Calculate PAYE
    const payeBase = taxablePay - nssf;
    const payeTax = calculatePAYE(payeBase);
    
    const totalDeductions = payeTax + nssf + shif + housingLevy;
    const netPay = grossPay - totalDeductions;

    return {
      employee_id: employee.id,
      employee_name: employee.full_name,
      employee_number: employee.employee_id,
      national_id: employee.national_id,
      kra_pin: employee.kra_pin,
      bank_account: employee.bank_details?.account_number || '',
      basic_salary: basicSalary,
      allowances: {
        house_allowance: allowances.house_allowance || 0,
        transport_allowance: allowances.transport_allowance || 0,
        medical_allowance: allowances.medical_allowance || 0,
        lunch_allowance: allowances.lunch_allowance || 0,
        other_allowances: allowances.other_allowances || 0,
        total_allowances: totalAllowances
      },
      gross_pay: grossPay,
      taxable_pay: taxablePay,
      deductions: {
        paye_tax: payeTax,
        nssf: nssf,
        shif: shif,
        housing_levy: housingLevy,
        loan_deductions: 0,
        other_deductions: 0,
        total_deductions: totalDeductions
      },
      personal_relief: PERSONAL_RELIEF,
      net_pay: netPay,
      days_worked: 30,
      overtime_hours: 0,
      overtime_pay: 0
    };
  };

  const handleProcessPayroll = async () => {
    setIsProcessing(true);
    setError(null);

    if (activeEmployees.length === 0) {
      setError("No active employees to process payroll for.");
      setIsProcessing(false);
      toast({
        title: "No Employees",
        description: "There are no active employees to process payroll for.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate payslips for all active employees
      const payslips = activeEmployees.map(calculatePayroll);

      // Calculate totals
      const total_gross_pay = payslips.reduce((sum, p) => sum + (p.gross_pay || 0), 0);
      const total_deductions = payslips.reduce((sum, p) => sum + (p.deductions?.total_deductions || 0), 0);
      const total_net_pay = payslips.reduce((sum, p) => sum + (p.net_pay || 0), 0);

      // Set up dates based on period prop
      const startOfMonth = new Date(period.year, period.month, 1);
      const endOfMonth = new Date(period.year, period.month + 1, 0); // Correctly gets last day of the month

      // Construct the complete payroll run data object
      const payrollRunData = {
        payroll_period: period.name,
        start_date: startOfMonth.toISOString().split('T')[0],
        end_date: endOfMonth.toISOString().split('T')[0],
        payslips: payslips,
        total_gross_pay: total_gross_pay,
        total_deductions: total_deductions,
        total_net_pay: total_net_pay,
        status: 'approved'
      };

      console.log('Creating payroll run with data:', payrollRunData); // Debug log

      // Validate that we have all required data
      if (!payrollRunData.payroll_period || !payrollRunData.start_date || !payrollRunData.end_date) {
        throw new Error('Missing required payroll period information');
      }

      if (!payrollRunData.payslips || payrollRunData.payslips.length === 0) {
        throw new Error('No payslips generated');
      }

      // Step 1: Create the PayrollRun record
      const newPayrollRun = await PayrollRun.create(payrollRunData);
      console.log('Payroll run created:', newPayrollRun); // Debug log

      // Step 2: Use the NEW TransactionService to create the journal entry
      let transaction;
      try {
        transaction = await TransactionService.createPayrollTransaction(newPayrollRun);

        // Step 3: Link the journal entry back to the payroll run for audit trail
        if (transaction && transaction.id) {
          await PayrollRun.update(newPayrollRun.id, { journal_transaction_id: transaction.id });
        }
        
        toast({
          title: "Payroll Posted to Ledger",
          description: `Journal entry ${transaction?.reference_number || 'N/A'} created successfully.`,
          className: "bg-green-100 border-green-300 text-green-800"
        });

      } catch (transactionError) {
        // This is a critical error. The payroll was run but didn't post to the GL.
        console.error("CRITICAL: Payroll run created but failed to post to GL:", transactionError);
        setError(`Payroll run ${newPayrollRun.id} was created but failed to post to accounting. Please contact support immediately.`);
        toast({
          title: "CRITICAL ACCOUNTING ERROR",
          description: `Payroll run ${newPayrollRun.id} processed but GL entry failed. Manual correction required.`,
          variant: "destructive",
          duration: 20000
        });
        setIsProcessing(false);
        return; // Stop execution
      }

      // Log the successful payroll processing
      try {
        await AuditLogger.log('processed', 'PayrollRun', newPayrollRun.id, `Processed payroll for ${newPayrollRun.payroll_period}`);
      } catch (auditError) {
        console.warn("Failed to log audit trail:", auditError);
      }
      
      toast({
        title: "Payroll Processed Successfully",
        description: `${activeEmployees.length} payslips generated for ${payrollRunData.payroll_period}.`
      });
      
      // Call the parent callback to close the processor and refresh data
      onComplete(payrollRunData);

    } catch (e) {
      console.error("Error processing payroll:", e);
      setError(e.message || "An unexpected error occurred.");
      toast({
        title: "Payroll Processing Failed",
        description: e.message || "Could not process payroll. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Process Payroll
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Payroll for <span className="font-semibold text-slate-700">{period.name}</span>. This will generate payslips and post the journal entry to the ledger.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period is now passed as a prop, so no manual selection */}
          <div className="text-center">
            <Button 
              onClick={handleProcessPayroll} 
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Process Payroll
                </>
              )}
            </Button>
            <p className="text-sm text-slate-600 mt-2">
              This will process payroll for {activeEmployees.length} active employees.
            </p>
            {error && (
              <p className="text-red-500 mt-2 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Back
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
