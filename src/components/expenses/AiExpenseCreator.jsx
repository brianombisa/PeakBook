import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { Upload, Loader2, Bot, FileCheck2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";

const expenseSchema = {
  type: "object",
  properties: {
    vendor_name: { type: "string", description: "The name of the vendor, store, or merchant." },
    expense_date: { type: "string", format: "date", description: "The date of the transaction." },
    amount: { type: "number", description: "The final total amount of the expense." },
    description: { type: "string", description: "A brief summary of the key items purchased, or the general purpose of the expense." }
  },
  required: ["vendor_name", "expense_date", "amount"]
};

export default function AiExpenseCreator({ onSuccess, onClose }) {
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, success, error
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('uploading');
    setError('');

    try {
      // Step 1: Upload the file
      const { file_url } = await UploadFile({ file });
      toast({ title: "File Uploaded", description: "Now processing with AI..." });
      setStatus('processing');

      // Step 2: Extract data using AI
      const result = await ExtractDataFromUploadedFile({ file_url, json_schema: expenseSchema });

      if (result.status === "success" && result.output) {
        setStatus('success');
        toast({ title: "AI Scan Complete!", description: "Review the extracted expense details.", variant: "success" });
        onSuccess(result.output, file_url);
      } else {
        throw new Error(result.details || "AI could not extract expense details from the document.");
      }
    } catch (err) {
      console.error("AI Expense Creation Error:", err);
      setError(err.message || "An unknown error occurred.");
      setStatus('error');
      toast({ title: "AI Scan Failed", description: err.message, variant: "destructive" });
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return (
          <div className="text-center p-8 space-y-4">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
            <h3 className="text-lg font-medium">{status === 'uploading' ? 'Uploading file...' : 'Scanning with AI...'}</h3>
            <p className="text-sm text-slate-500">{fileName}</p>
            <p className="text-xs text-slate-400">Please wait, this may take a moment.</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center p-8 space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500" />
            <h3 className="text-lg font-medium text-red-600">Scan Failed</h3>
            <p className="text-sm text-slate-600 bg-red-50 p-3 rounded-md">{error}</p>
            <Button onClick={() => setStatus('idle')}>Try Again</Button>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="p-8">
            <label htmlFor="receipt-ai-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-slate-400" />
                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-slate-400">PDF, PNG, JPG (MAX. 10MB)</p>
              </div>
              <input id="receipt-ai-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, application/pdf" />
            </label>
          </div>
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="w-6 h-6 text-blue-600"/> Create Expense from Receipt
          </DialogTitle>
          <DialogDescription>
            Upload a receipt or bill, and our AI will automatically read and fill in the details for you.
          </DialogDescription>
        </DialogHeader>
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}