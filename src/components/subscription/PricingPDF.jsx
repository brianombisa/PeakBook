import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PricingPDF({ plans }) {
  const { toast } = useToast();

  const generatePricingPDF = async () => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare your pricing sheet...",
      });

      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site to generate PDFs.",
          variant: "destructive"
        });
        return;
      }

      const currentDate = new Date().toLocaleDateString('en-KE');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>PeakBooks Pricing Plans - ${currentDate}</title>
            <meta charset="utf-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                line-height: 1.6;
                color: #1f2937;
                background: white;
                padding: 40px;
              }
              
              .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 3px solid #3b82f6;
                padding-bottom: 20px;
              }
              
              .company-name {
                font-size: 32px;
                font-weight: 700;
                color: #1e40af;
                margin-bottom: 8px;
              }
              
              .tagline {
                font-size: 18px;
                color: #64748b;
                margin-bottom: 16px;
              }
              
              .date {
                font-size: 14px;
                color: #6b7280;
              }
              
              .plans-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 30px;
                margin-bottom: 40px;
              }
              
              .plan-card {
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                overflow: hidden;
                position: relative;
              }
              
              .plan-card.featured {
                border-color: #3b82f6;
                box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15);
              }
              
              .plan-header {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                padding: 24px;
                text-align: center;
                position: relative;
              }
              
              .plan-header.starter {
                background: linear-gradient(135deg, #10b981, #059669);
              }
              
              .plan-header.business {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
              }
              
              .plan-header.enterprise {
                background: linear-gradient(135deg, #8b5cf6, #7c3aed);
              }
              
              .popular-badge {
                position: absolute;
                top: -10px;
                left: 50%;
                transform: translateX(-50%);
                background: #f59e0b;
                color: white;
                padding: 4px 16px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
              }
              
              .plan-name {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 8px;
              }
              
              .plan-description {
                font-size: 14px;
                opacity: 0.9;
              }
              
              .plan-content {
                padding: 24px;
              }
              
              .pricing {
                text-align: center;
                margin-bottom: 24px;
              }
              
              .price-monthly {
                font-size: 28px;
                font-weight: 700;
                color: #1f2937;
              }
              
              .price-annual {
                font-size: 14px;
                color: #6b7280;
                margin-top: 4px;
              }
              
              .features {
                list-style: none;
              }
              
              .features li {
                padding: 6px 0;
                font-size: 14px;
                color: #374151;
                position: relative;
                padding-left: 20px;
              }
              
              .features li:before {
                content: "✓";
                color: #10b981;
                font-weight: bold;
                position: absolute;
                left: 0;
              }
              
              .contact-section {
                background: #f8fafc;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                margin-top: 40px;
              }
              
              .contact-title {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 16px;
              }
              
              .contact-info {
                font-size: 16px;
                color: #4b5563;
                line-height: 1.8;
              }
              
              .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #9ca3af;
              }
              
              @media print {
                body { padding: 20px; }
                .plan-card { break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="company-name">PeakBooks</h1>
              <p class="tagline">Professional Accounting Suite for Kenyan Businesses</p>
              <p class="date">Pricing as of ${currentDate}</p>
            </div>
            
            <div class="plans-grid">
              ${plans.map(plan => `
                <div class="plan-card ${plan.is_featured ? 'featured' : ''}">
                  ${plan.is_featured ? '<div class="popular-badge">Most Popular</div>' : ''}
                  <div class="plan-header ${plan.name.toLowerCase()}">
                    <h2 class="plan-name">${plan.name}</h2>
                    <p class="plan-description">${plan.description}</p>
                  </div>
                  <div class="plan-content">
                    <div class="pricing">
                      <div class="price-monthly">KES ${plan.price_monthly.toLocaleString()}/mo</div>
                      <div class="price-annual">
                        or KES ${plan.price_annual.toLocaleString()}/year 
                        (save KES ${((plan.price_monthly * 12) - plan.price_annual).toLocaleString()})
                      </div>
                    </div>
                    <ul class="features">
                      ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div class="contact-section">
              <h3 class="contact-title">Ready to Get Started?</h3>
              <div class="contact-info">
                <p><strong>Website:</strong> https://peakbooks.app</p>
                <p><strong>Email:</strong> hello@peakbooks.app</p>
                <p><strong>Phone:</strong> +254 700 000 000</p>
                <p style="margin-top: 16px;">
                  <strong>🎉 Start with a 14-day free trial</strong><br>
                  No credit card required • M-Pesa payments accepted • KRA compliant
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p>© 2024 PeakBooks. All rights reserved. • Designed for Kenyan SMBs</p>
            </div>
            
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.focus();
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();

      setTimeout(() => {
        toast({
          title: "PDF Ready",
          description: "In the print dialog, select 'Save as PDF' to download your pricing sheet.",
          duration: 8000
        });
      }, 2000);

    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-4 justify-center mt-8">
      <Button
        onClick={generatePricingPDF}
        variant="outline"
        className="flex items-center gap-2"
      >
        <FileText className="w-4 h-4" />
        View Pricing PDF
      </Button>
      
      <Button
        onClick={generatePricingPDF}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
      >
        <Download className="w-4 h-4" />
        Download Pricing Sheet
      </Button>
    </div>
  );
}