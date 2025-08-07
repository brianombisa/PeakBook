import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Mail, MessageSquare, Twitter, Linkedin } from 'lucide-react';
import { Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MarketingMaterial = ({ title, icon, children }) => (
  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
    <CardHeader className="flex flex-row items-center gap-4">
      {icon}
      <div>
        <CardTitle>{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="prose prose-slate max-w-none">
      {children}
    </CardContent>
  </Card>
);

const CopyButton = ({ textToCopy }) => {
    const { toast } = useToast();
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        toast({ title: "Copied to clipboard!" });
    };
    return (
        <Button variant="ghost" size="sm" onClick={handleCopy} className="float-right -mt-2">
            <Copy className="w-4 h-4 mr-2" /> Copy
        </Button>
    );
};

export default function MarketingPage() {
    const elevatorPitch = "PeakBooks is the all-in-one cloud accounting suite designed for modern Kenyan businesses. We simplify your finances—from invoicing and expense tracking to payroll and M-Pesa payments—so you can focus on growth.";
    const emailSubject = "Introducing PeakBooks: The Smart Accounting Software for Your Business";
    const emailBody = `Hi [Recipient Name],

Tired of juggling spreadsheets and complex accounting software?

Meet PeakBooks (https://peakbooks.app), the all-in-one cloud accounting platform designed to simplify finances for ambitious Kenyan businesses like yours.

With PeakBooks, you can:
- Create & Send Professional Invoices in Seconds
- Track Expenses & Manage Company Spending
- Run Accurate Payroll with Tax Compliance
- Accept Payments Seamlessly with M-Pesa Integration
- Get Real-Time Financial Insights with our Admin Dashboard

Stop guessing and start growing. Take control of your finances today.

Sign up for a free 14-day trial at https://peakbooks.app and see the difference.

Best regards,

The PeakBooks Team`;

    const linkedInPost = `Running a business in Kenya? It's time to upgrade your accounting.

Introducing PeakBooks — the all-in-one cloud accounting suite that simplifies everything from invoicing to payroll.

✅ Professional Invoicing
✅ Expense Management
✅ KRA-Compliant Payroll
✅ M-Pesa Payment Integration
✅ Real-time Admin Dashboard

Spend less time on bookkeeping and more time growing your business.
Get started with a free 14-day trial today! 👉 https://peakbooks.app

#PeakBooks #AccountingSoftware #SaaS #Kenya #Fintech #SMB #BusinessTools`;

    const twitterPost = `Say goodbye to spreadsheets! 👋

PeakBooks is the modern accounting platform for Kenyan SMEs.

Invoice, track expenses, run payroll, and get paid via M-Pesa—all in one place.

Start your free trial & simplify your finances: https://peakbooks.app

#SaaS #FintechKenya #PeakBooks`;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800">Marketing & Branding Kit</h1>
          <p className="text-slate-600 mt-2">Everything you need to announce and promote your new domain: <a href="https://peakbooks.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold">peakbooks.app</a></p>
        </header>

        <div className="space-y-6">
            <MarketingMaterial title="Elevator Pitch" icon={<Lightbulb className="w-8 h-8 text-yellow-500" />}>
                <CopyButton textToCopy={elevatorPitch} />
                <p>{elevatorPitch}</p>
            </MarketingMaterial>

            <MarketingMaterial title="Email Announcement" icon={<Mail className="w-8 h-8 text-blue-500" />}>
                <h4 className="font-semibold">Subject:</h4>
                <CopyButton textToCopy={emailSubject} />
                <p>{emailSubject}</p>
                <hr className="my-4" />
                <h4 className="font-semibold">Body:</h4>
                <CopyButton textToCopy={emailBody} />
                <p className="whitespace-pre-line">{emailBody}</p>
            </MarketingMaterial>

            <MarketingMaterial title="Social Media Posts" icon={<MessageSquare className="w-8 h-8 text-green-500" />}>
                <div className="flex items-center gap-2">
                    <Linkedin className="w-6 h-6 text-[#0A66C2]" />
                    <h4 className="font-semibold">LinkedIn Post</h4>
                </div>
                <CopyButton textToCopy={linkedInPost} />
                <p className="whitespace-pre-line text-sm bg-slate-50 p-4 rounded-lg mt-2">{linkedInPost}</p>

                <div className="flex items-center gap-2 mt-6">
                    <Twitter className="w-6 h-6 text-[#1DA1F2]" />
                    <h4 className="font-semibold">Twitter/X Post</h4>
                </div>
                <CopyButton textToCopy={twitterPost} />
                <p className="whitespace-pre-line text-sm bg-slate-50 p-4 rounded-lg mt-2">{twitterPost}</p>
            </MarketingMaterial>
        </div>
      </div>
    </div>
  );
}