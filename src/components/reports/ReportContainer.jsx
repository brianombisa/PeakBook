import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { CompanyProfile } from '@/api/entities';
import { generateReport } from '@/api/functions';

export default function ReportContainer({ title, children }) {
    const [isDownloading, setIsDownloading] = React.useState(false);
    
    const handleDownload = async (format) => {
        setIsDownloading(true);
        try {
            const companyProfile = await CompanyProfile.list();
            const reportData = {
                reportType: title,
                data: children?.props?.data || {}, // Pass the full data object
                period: children?.props?.period, // Pass the period
                branding: {
                    logoUrl: companyProfile[0]?.logo_url,
                    companyName: companyProfile[0]?.company_name
                },
                format
            };
            
            const { data: fileBlob } = await generateReport({ reportData, format });

            const url = window.URL.createObjectURL(new Blob([fileBlob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (error) {
            console.error("Failed to download report", error);
        } finally {
            setIsDownloading(false);
        }
    };
    
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl min-h-[500px]">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-xl font-bold text-slate-800">{title || 'Report'}</CardTitle>
        <div className="flex gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => handleDownload('pdf')} disabled={isDownloading}>
                <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownload('xlsx')} disabled={isDownloading}>
                <Download className="w-4 h-4 mr-2" /> Excel
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}