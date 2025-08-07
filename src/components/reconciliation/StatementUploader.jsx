import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';

const StatementUploader = ({ onUpload }) => {
    const [isParsing, setIsParsing] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsParsing(true);
        // In a real app, you would parse CSV/OFX here.
        // We will simulate parsing with mock data.
        setTimeout(() => {
            const mockData = [
                { date: '2024-07-01', description: 'KPLC PREPAID', amount: -2000 },
                { date: '2024-07-02', description: 'PAYMENT FROM XYZ LTD', amount: 150000 },
                { date: '2024-07-03', description: 'FUEL AT TOTAL', amount: -5000 },
                { date: '2024-07-05', description: 'SALARY PAYMENT', amount: -250000 },
                { date: '2024-07-10', description: 'TRANSFER TO ABC SUPPLIES', amount: -75000 },
                { date: '2024-07-15', description: 'PAYMENT FROM ABC CLIENT', amount: 80000 },
            ];
            onUpload(mockData);
            setIsParsing(false);
        }, 1500);
    };

    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <UploadCloud className="mx-auto w-12 h-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Upload Bank Statement</h3>
            <p className="mt-1 text-sm text-gray-600">Drag and drop a CSV or OFX file, or click to select.</p>
            <div className="mt-6">
                <input
                    type="file"
                    id="statement-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".csv,.ofx"
                />
                <label htmlFor="statement-upload">
                    <Button asChild disabled={isParsing}>
                        <span>{isParsing ? 'Parsing...' : 'Select File'}</span>
                    </Button>
                </label>
            </div>
        </div>
    );
};

export default StatementUploader;