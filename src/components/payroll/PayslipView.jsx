import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { generatePayslipsPdf } from '@/api/functions';

export default function PayslipView({ payrollRun, employees, onClose }) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null); // To show spinner on specific button

  const handleDownload = async (targetEmployeeId = null) => {
    const isSingleDownload = !!targetEmployeeId;
    if (isSingleDownload) {
      setDownloadingId(targetEmployeeId);
    } else {
      setIsDownloading(true);
    }
    
    try {
        const { data: pdfBlob, error, status } = await generatePayslipsPdf({ payrollRun, targetEmployeeId });
        
        if (status !== 200 || !pdfBlob) {
            const errorData = error ? JSON.parse(await new Response(error).text()) : { message: "Backend failed to generate PDF." };
            throw new Error(errorData.message);
        }

        const blob = new Blob([pdfBlob], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const singlePayslip = isSingleDownload ? payrollRun.payslips.find(p => p.employee_id === targetEmployeeId) : null;
        const filename = isSingleDownload
            ? `Payslip - ${singlePayslip.employee_name} - ${payrollRun.payroll_period}.pdf`
            : `Payroll - ${payrollRun.payroll_period}.pdf`;
            
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

    } catch(e) {
        console.error("Failed to download PDF:", e);
        toast({ title: "Download Error", description: e.message || "Could not download PDF.", variant: "destructive" });
    } finally {
        setIsDownloading(false);
        setDownloadingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800">Payslips for {payrollRun.payroll_period}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleDownload()} disabled={isDownloading}>
              {isDownloading && !downloadingId ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download All
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-8">
          {payrollRun.payslips.length === 0 ? (
            <p className="text-center text-slate-600">No payslips found for this payroll run.</p>
          ) : (
            <div className="space-y-4">
              {payrollRun.payslips.map((payslip) => {
                const employee = employees.find(e => e.id === payslip.employee_id);
                const isThisDownloading = downloadingId === payslip.employee_id;
                return (
                  <Card key={payslip.employee_id}>
                    <CardHeader className="flex flex-row justify-between items-center">
                      <div>
                        <CardTitle>{payslip.employee_name}</CardTitle>
                        <CardDescription>{employee?.position || 'Employee'}</CardDescription>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge variant="secondary">Period: {payrollRun.payroll_period}</Badge>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDownload(payslip.employee_id)}
                          disabled={isDownloading || downloadingId}
                        >
                           {isThisDownloading ? (
                             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                           ) : (
                             <Download className="w-4 h-4 mr-2" />
                           )}
                          Download
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><span className="text-slate-600">Employee No:</span> <span className="font-medium">{payslip.employee_number}</span></p>
                        <p><span className="text-slate-600">KRA PIN:</span> <span className="font-medium">{payslip.kra_pin}</span></p>
                        <p><span className="text-slate-600">Bank Account:</span> <span className="font-medium">{payslip.bank_account || "N/A"}</span></p>
                      </div>
                      <div className="text-right">
                        <p><span className="text-green-700 font-semibold">GROSS PAY:</span> <span className="font-bold text-green-700">KES {payslip.gross_pay.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></p>
                        <p><span className="text-red-700 font-semibold">TOTAL DEDUCTIONS:</span> <span className="font-bold text-red-700">KES {payslip.deductions.total_deductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></p>
                        <p><span className="text-blue-700 font-semibold text-lg">NET PAY:</span> <span className="font-bold text-blue-700 text-lg">KES {payslip.net_pay.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}