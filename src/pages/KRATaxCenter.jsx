import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import { 
  FileText, 
  Download, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Calculator,
  Upload,
  Shield
} from 'lucide-react';
import { KRATaxReturn } from '@/api/entities';
import { User } from '@/api/entities';
import DataService from '../components/services/DataService';
import KRATaxService from '../components/services/KRATaxService';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';

const TaxReturnCard = ({ taxReturn, onDownload, onRegenerate }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'generated': return 'bg-blue-100 text-blue-800';
      case 'filed': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = taxReturn.due_date && new Date(taxReturn.due_date) < new Date() && taxReturn.status !== 'filed';

  return (
    <Card className={`${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {taxReturn.return_type.toUpperCase()} Return - {taxReturn.period}
            </CardTitle>
            <CardDescription>
              Period: {format(new Date(taxReturn.period_start_date), 'MMM d')} - {format(new Date(taxReturn.period_end_date), 'MMM d, yyyy')}
            </CardDescription>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(taxReturn.status)}>
              {taxReturn.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {isOverdue && (
              <div className="flex items-center text-red-600 text-sm mt-1">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Overdue
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {taxReturn.return_type === 'vat' && (
            <>
              <div>
                <p className="text-sm text-slate-500">Total Sales</p>
                <p className="font-semibold">KES {taxReturn.total_sales.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Net VAT Due</p>
                <p className="font-semibold text-indigo-600">KES {taxReturn.net_vat.toLocaleString()}</p>
              </div>
            </>
          )}
          {taxReturn.return_type === 'withholding_tax' && (
            <div>
              <p className="text-sm text-slate-500">WHT Deducted</p>
              <p className="font-semibold">KES {taxReturn.withholding_tax_deducted.toLocaleString()}</p>
            </div>
          )}
          {taxReturn.return_type === 'paye' && (
            <div>
              <p className="text-sm text-slate-500">PAYE Deducted</p>
              <p className="font-semibold">KES {taxReturn.paye_deducted.toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-slate-500">Due Date</p>
            <p className="font-semibold">{format(new Date(taxReturn.due_date), 'MMM d, yyyy')}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {taxReturn.itax_file_url && (
            <Button size="sm" onClick={() => onDownload(taxReturn)} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download iTax File
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onRegenerate(taxReturn)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const TaxCalendar = ({ onGenerateReturn }) => {
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  useEffect(() => {
    // Generate upcoming tax deadlines
    const now = new Date();
    const deadlines = [];
    
    // VAT returns - 20th of each month
    for (let i = 0; i < 6; i++) {
      const month = addMonths(now, i);
      const deadline = new Date(month.getFullYear(), month.getMonth(), 20);
      if (deadline > now) {
        deadlines.push({
          type: 'vat',
          title: 'VAT Return',
          period: format(startOfMonth(addMonths(month, -1)), 'MMMM yyyy'),
          due_date: deadline,
          period_start: startOfMonth(addMonths(month, -1)),
          period_end: endOfMonth(addMonths(month, -1))
        });
      }
    }

    setUpcomingDeadlines(deadlines.slice(0, 3));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Tax Deadlines
        </CardTitle>
        <CardDescription>
          Stay ahead of KRA filing deadlines
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingDeadlines.map((deadline, index) => {
            const daysUntilDue = Math.ceil((deadline.due_date - new Date()) / (1000 * 60 * 60 * 24));
            const isUrgent = daysUntilDue <= 7;
            
            return (
              <div key={index} className={`p-4 rounded-lg border ${isUrgent ? 'border-red-200 bg-red-50' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{deadline.title}</h4>
                    <p className="text-sm text-slate-600">Period: {deadline.period}</p>
                    <p className="text-sm text-slate-600">Due: {format(deadline.due_date, 'MMM d, yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={isUrgent ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}>
                      {daysUntilDue} days
                    </Badge>
                    <Button 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={() => onGenerateReturn(deadline.type, deadline.period_start, deadline.period_end)}
                    >
                      Generate Return
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default function KRATaxCenterPage() {
  const [taxReturns, setTaxReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
      
      const returns = await KRATaxReturn.filter({ created_by: userData.email }, '-created_date');
      setTaxReturns(returns);
    } catch (error) {
      console.error('Error loading tax data:', error);
      toast({
        title: "Error",
        description: "Failed to load tax return data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTaxReturn = async (returnType, startDate, endDate) => {
    setIsGenerating(true);
    try {
      // Load financial data for the period
      const reportData = await DataService.loadReportsData();
      if (!reportData.success) {
        throw new Error("Failed to load financial data");
      }

      // Generate the tax return using our service
      const result = await KRATaxService.generateTaxReturn({
        returnType,
        startDate,
        endDate,
        transactions: reportData.transactions,
        invoices: reportData.invoices,
        expenses: reportData.expenses,
        userEmail: user.email
      });

      if (result.success) {
        toast({
          title: "Tax Return Generated",
          description: `${returnType.toUpperCase()} return for ${format(startDate, 'MMMM yyyy')} has been created successfully.`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
        await loadData(); // Refresh the list
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error generating tax return:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate tax return. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadTaxFile = async (taxReturn) => {
    if (taxReturn.itax_file_url) {
      // In a real app, this would download the generated Excel file
      window.open(taxReturn.itax_file_url, '_blank');
      toast({
        title: "Download Started",
        description: "Your iTax-ready file download has started.",
      });
    }
  };

  const regenerateTaxReturn = async (taxReturn) => {
    await generateTaxReturn(
      taxReturn.return_type,
      new Date(taxReturn.period_start_date),
      new Date(taxReturn.period_end_date)
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading KRA Tax Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <CardTitle className="text-2xl">KRA Tax Automation Center</CardTitle>
                <CardDescription className="text-indigo-100">
                  Automatically generate and file your KRA returns from your financial data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tax Calendar */}
          <div className="lg:col-span-1">
            <TaxCalendar onGenerateReturn={generateTaxReturn} />
          </div>

          {/* Tax Returns List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Tax Returns</CardTitle>
                  <Button 
                    onClick={() => generateTaxReturn('vat', startOfMonth(addMonths(new Date(), -1)), endOfMonth(addMonths(new Date(), -1)))}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Generate New Return
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {taxReturns.length > 0 ? (
                  <div className="space-y-4">
                    {taxReturns.map((taxReturn) => (
                      <TaxReturnCard
                        key={taxReturn.id}
                        taxReturn={taxReturn}
                        onDownload={downloadTaxFile}
                        onRegenerate={regenerateTaxReturn}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Tax Returns Yet</h3>
                    <p className="text-slate-500 mb-6">
                      Generate your first automated KRA tax return from your financial data.
                    </p>
                    <Button onClick={() => generateTaxReturn('vat', startOfMonth(addMonths(new Date(), -1)), endOfMonth(addMonths(new Date(), -1)))}>
                      <Calculator className="w-4 h-4 mr-2" />
                      Generate VAT Return
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">How KRA Tax Automation Works</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Calculator className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Auto-Calculate</h4>
                <p className="text-sm">We analyze your invoices, expenses, and transactions to calculate accurate tax figures.</p>
              </div>
              <div className="text-center">
                <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Generate Forms</h4>
                <p className="text-sm">Your data is formatted into KRA-compliant Excel files ready for iTax upload.</p>
              </div>
              <div className="text-center">
                <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">File Easily</h4>
                <p className="text-sm">Download the generated file and upload directly to the KRA iTax portal.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}