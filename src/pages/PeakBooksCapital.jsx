import React, { useState, useEffect } from 'react';
import { CreditScore } from '@/api/entities';
import { LoanApplication } from '@/api/entities';
import { Invoice } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { DollarSign, TrendingUp, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format, subMonths } from 'date-fns';

export default function PeakBooksCapitalPage() {
  const [creditScore, setCreditScore] = useState(null);
  const [loanApplications, setLoanApplications] = useState([]);
  const [showApplication, setShowApplication] = useState(false);
  const [applicationData, setApplicationData] = useState({
    loan_amount: '',
    loan_purpose: 'working_capital',
    repayment_period_months: 12
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    try {
      const user = await User.me();
      
      // Load existing credit score
      const creditScores = await CreditScore.filter({ business_id: user.id });
      if (creditScores.length > 0) {
        setCreditScore(creditScores[0]);
      } else {
        // Calculate initial credit score
        await calculateCreditScore(user);
      }

      // Load loan applications
      const applications = await LoanApplication.filter({ applicant_id: user.id }, '-application_date');
      setLoanApplications(applications);

    } catch (error) {
      console.error('Error loading credit data:', error);
    }
    setIsLoading(false);
  };

  const calculateCreditScore = async (user) => {
    try {
      // Get business data for scoring
      const invoices = await Invoice.filter({ created_by: user.email });
      const recentInvoices = invoices.filter(inv => 
        new Date(inv.invoice_date) >= subMonths(new Date(), 6)
      );

      // Calculate metrics
      const totalRevenue = recentInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const paidInvoices = recentInvoices.filter(inv => inv.status === 'paid');
      const paymentRate = recentInvoices.length > 0 ? (paidInvoices.length / recentInvoices.length) * 100 : 0;
      
      // Simple scoring algorithm
      let score = 300; // Base score
      
      // Revenue factor (0-300 points)
      if (totalRevenue > 1000000) score += 300;
      else if (totalRevenue > 500000) score += 200;
      else if (totalRevenue > 100000) score += 100;
      else if (totalRevenue > 50000) score += 50;

      // Payment history (0-250 points)
      score += (paymentRate / 100) * 250;

      // Business age (0-150 points)
      const businessAge = invoices.length > 0 ? 
        Math.floor((new Date() - new Date(invoices[0].created_date)) / (1000 * 60 * 60 * 24 * 30)) : 1;
      score += Math.min(businessAge * 10, 150);

      // Determine grade
      let grade = 'D';
      if (score >= 800) grade = 'A+';
      else if (score >= 700) grade = 'A';
      else if (score >= 600) grade = 'B+';
      else if (score >= 500) grade = 'B';
      else if (score >= 400) grade = 'C+';
      else if (score >= 350) grade = 'C';

      // Calculate max loan amount (conservative approach)
      const monthlyRevenue = totalRevenue / 6;
      const maxLoan = Math.min(monthlyRevenue * 3, score >= 600 ? 500000 : score >= 400 ? 200000 : 50000);

      const creditScoreData = {
        business_id: user.id,
        score: Math.round(score),
        grade,
        revenue_trend: 0, // Would calculate from historical data
        payment_history_score: paymentRate,
        cash_flow_stability: 70, // Simplified
        outstanding_debt_ratio: 0,
        business_age_months: businessAge,
        last_calculated: new Date().toISOString(),
        eligible_for_credit: score >= 400,
        max_loan_amount: maxLoan
      };

      const savedScore = await CreditScore.create(creditScoreData);
      setCreditScore(savedScore);

    } catch (error) {
      console.error('Error calculating credit score:', error);
    }
  };

  const handleLoanApplication = async (e) => {
    e.preventDefault();
    if (!creditScore) return;

    try {
      const user = await User.me();
      
      const application = await LoanApplication.create({
        applicant_id: user.id,
        loan_amount: parseFloat(applicationData.loan_amount),
        loan_purpose: applicationData.loan_purpose,
        repayment_period_months: applicationData.repayment_period_months,
        credit_score_at_application: creditScore.score,
        monthly_revenue: creditScore.business_age_months > 0 ? creditScore.max_loan_amount / 3 : 0,
        application_date: new Date().toISOString().split('T')[0],
        interest_rate: creditScore.grade === 'A+' ? 1.5 : creditScore.grade === 'A' ? 2.0 : 2.5
      });

      toast({
        title: 'Application Submitted',
        description: 'Your loan application has been submitted for review. You will hear back within 24 hours.',
      });

      setShowApplication(false);
      setApplicationData({ loan_amount: '', loan_purpose: 'working_capital', repayment_period_months: 12 });
      loadCreditData();

    } catch (error) {
      console.error('Error submitting loan application:', error);
      toast({
        title: 'Application Failed',
        description: 'Could not submit your application. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 700) return 'text-green-600';
    if (score >= 600) return 'text-blue-600';
    if (score >= 400) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      disbursed: 'bg-purple-100 text-purple-800',
      repaid: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Calculating your credit profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-600 rounded-xl">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
              PeakBooks Capital
            </h1>
            <p className="text-slate-600">Access business loans based on your financial data</p>
          </div>
        </div>

        {/* Credit Score Dashboard */}
        {creditScore && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  Credit Score
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(creditScore.score)}`}>
                  {creditScore.score}
                </div>
                <Badge className={`text-lg px-4 py-1 ${getScoreColor(creditScore.score)}`}>
                  Grade {creditScore.grade}
                </Badge>
                <Progress value={(creditScore.score / 1000) * 100} className="mt-4" />
                <p className="text-sm text-slate-600 mt-2">
                  Last updated: {format(new Date(creditScore.last_calculated), 'MMM dd, yyyy')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Loan Eligibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                {creditScore.eligible_for_credit ? (
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      KES {creditScore.max_loan_amount.toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-600">Maximum eligible amount</p>
                    <Badge className="bg-green-100 text-green-800 mt-3">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Eligible for credit
                    </Badge>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-red-600 mb-2">
                      Not Eligible
                    </div>
                    <p className="text-sm text-slate-600">Build more transaction history to qualify</p>
                    <Badge className="bg-red-100 text-red-800 mt-3">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Improve credit score
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Payment History</span>
                    <span className="font-medium">{Math.round(creditScore.payment_history_score)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Business Age</span>
                    <span className="font-medium">{creditScore.business_age_months} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Applications</span>
                    <span className="font-medium">{loanApplications.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loan Application Form */}
        {showApplication && creditScore?.eligible_for_credit && (
          <Card className="bg-white/80 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle>Apply for Business Loan</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLoanApplication} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Loan Amount (KES)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={applicationData.loan_amount}
                      onChange={(e) => setApplicationData({...applicationData, loan_amount: e.target.value})}
                      max={creditScore.max_loan_amount}
                      required
                    />
                    <p className="text-xs text-slate-600 mt-1">
                      Maximum: KES {creditScore.max_loan_amount.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Loan Purpose</label>
                    <Select value={applicationData.loan_purpose} onValueChange={(value) => setApplicationData({...applicationData, loan_purpose: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="working_capital">Working Capital</SelectItem>
                        <SelectItem value="inventory">Inventory Purchase</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="expansion">Business Expansion</SelectItem>
                        <SelectItem value="emergency">Emergency Funds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Repayment Period</label>
                  <Select value={applicationData.repayment_period_months.toString()} onValueChange={(value) => setApplicationData({...applicationData, repayment_period_months: parseInt(value)})}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="18">18 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowApplication(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Submit Application
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {!showApplication && (
          <div className="flex justify-center gap-4 mb-8">
            {creditScore?.eligible_for_credit ? (
              <Button 
                onClick={() => setShowApplication(true)}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Apply for Loan
              </Button>
            ) : (
              <Button 
                onClick={() => calculateCreditScore()} 
                variant="outline"
                size="lg"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Improve Credit Score
              </Button>
            )}
            <Button 
              onClick={loadCreditData} 
              variant="outline"
              size="lg"
            >
              Refresh Credit Data
            </Button>
          </div>
        )}

        {/* Loan Applications History */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Your Loan Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {loanApplications.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No loan applications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {loanApplications.map((application) => (
                  <div key={application.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">KES {application.loan_amount.toLocaleString()}</p>
                        <p className="text-sm text-slate-600 capitalize">
                          {application.loan_purpose.replace('_', ' ')} • {application.repayment_period_months} months
                        </p>
                      </div>
                      <Badge className={getStatusColor(application.status)}>
                        {application.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Applied: {format(new Date(application.application_date), 'MMM dd, yyyy')}
                    </p>
                    {application.interest_rate && (
                      <p className="text-xs text-slate-600 mt-1">
                        Interest Rate: {application.interest_rate}% per month
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}