import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Smartphone, FileText, Bot, Zap, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";

const mpesaStatementSchema = {
    type: "object",
    properties: {
        transactions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    date: { type: "string", format: "date", description: "Transaction date" },
                    time: { type: "string", description: "Transaction time" },
                    transaction_type: { type: "string", description: "Type of M-Pesa transaction (Send Money, Receive Money, Pay Bill, etc.)" },
                    transaction_id: { type: "string", description: "M-Pesa transaction ID" },
                    description: { type: "string", description: "Transaction description including recipient/sender info" },
                    amount: { type: "number", description: "Transaction amount in KES" },
                    balance: { type: "number", description: "M-Pesa wallet balance after transaction" },
                    recipient_sender: { type: "string", description: "Name or phone number of recipient/sender" },
                    paybill_number: { type: "string", description: "Paybill or till number if applicable" }
                },
                required: ["date", "transaction_type", "description", "amount"]
            }
        }
    },
    required: ["transactions"]
};

export default function MPesaIntegration({ onStatementProcessed, isLoading, setIsLoading }) {
    const [file, setFile] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const { toast } = useToast();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleProcessMPesaStatement = async () => {
        if (!file) {
            toast({ 
                title: "No file selected", 
                description: "Please select your M-Pesa statement file to upload.", 
                variant: "destructive" 
            });
            return;
        }

        setIsLoading(true);
        try {
            // Step 1: Upload the file
            const uploadResult = await UploadFile({ file });
            if (!uploadResult || !uploadResult.file_url) {
                throw new Error("File upload failed.");
            }
            const { file_url } = uploadResult;

            // Step 2: Extract M-Pesa data using AI
            const extractResult = await ExtractDataFromUploadedFile({
                file_url,
                json_schema: mpesaStatementSchema
            });
            
            if (extractResult.status !== 'success' || !extractResult.output?.transactions) {
                throw new Error(extractResult.details || "AI failed to extract M-Pesa transaction data. Please ensure the file is a clear M-Pesa statement.");
            }

            // Step 3: Process and format M-Pesa transactions
            const processedTransactions = extractResult.output.transactions.map((tx, index) => {
                // Determine if it's a debit or credit based on transaction type
                const isCredit = tx.transaction_type?.toLowerCase().includes('receive') || 
                               tx.transaction_type?.toLowerCase().includes('deposit') ||
                               tx.transaction_type?.toLowerCase().includes('cashback');

                return {
                    ...tx,
                    id: `mpesa-${index}-${new Date().getTime()}`,
                    date: tx.date,
                    description: `${tx.transaction_type}: ${tx.description}${tx.recipient_sender ? ` - ${tx.recipient_sender}` : ''}`,
                    debit: isCredit ? 0 : tx.amount,
                    credit: isCredit ? tx.amount : 0,
                    source: 'mpesa',
                    transaction_id: tx.transaction_id,
                    phone_number: phoneNumber || 'Unknown'
                };
            });

            toast({ 
                title: "Success", 
                description: `Extracted ${processedTransactions.length} M-Pesa transactions from the statement.` 
            });
            
            onStatementProcessed(processedTransactions);

        } catch (error) {
            console.error("Error processing M-Pesa statement:", error);
            toast({ 
                title: "Processing Failed", 
                description: error.message, 
                variant: "destructive" 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Info Alert */}
            <Alert className="border-emerald-200 bg-emerald-50">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                    <strong>M-Pesa Statement Integration:</strong> Upload your M-Pesa statement (PDF or Excel format) 
                    to automatically extract and categorize mobile money transactions. Perfect for businesses that 
                    frequently use M-Pesa for payments and receipts.
                </AlertDescription>
            </Alert>

            <Card className="glass-effect border-0 shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                            <Smartphone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Upload M-Pesa Statement</CardTitle>
                            <CardDescription>
                                AI-powered extraction of M-Pesa transactions with smart categorization
                            </CardDescription>
                        </div>
                        <Badge className="ml-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                            Kenya Optimized
                        </Badge>
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                    {/* Phone Number Input */}
                    <div>
                        <Label htmlFor="phone-number" className="text-sm font-semibold text-slate-700">
                            M-Pesa Phone Number (Optional)
                        </Label>
                        <Input
                            id="phone-number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="e.g., 0722123456"
                            className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            This helps identify transactions and improves matching accuracy
                        </p>
                    </div>

                    {/* File Upload */}
                    <div>
                        <Label htmlFor="mpesa-file" className="text-sm font-semibold text-slate-700">
                            M-Pesa Statement File
                        </Label>
                        <Input 
                            id="mpesa-file"
                            type="file" 
                            onChange={handleFileChange} 
                            accept=".pdf,.xlsx,.csv,.xls"
                            className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Supported formats: PDF, Excel (.xlsx, .xls), or CSV files
                        </p>
                    </div>

                    {/* Selected File Display */}
                    {file && (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                            <FileText className="w-5 h-5 text-emerald-600" />
                            <div className="flex-1">
                                <p className="font-semibold text-emerald-800">{file.name}</p>
                                <p className="text-sm text-emerald-600">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB • Ready for processing
                                </p>
                            </div>
                            <Badge className="bg-emerald-500 text-white">
                                M-Pesa Ready
                            </Badge>
                        </div>
                    )}

                    {/* M-Pesa Features */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-4 h-4 text-emerald-600" />
                                <h4 className="font-semibold text-slate-800">Smart Recognition</h4>
                            </div>
                            <p className="text-sm text-slate-600">
                                Automatically identifies Send Money, Receive Money, Pay Bill, Buy Goods, and other M-Pesa transaction types.
                            </p>
                        </div>
                        
                        <div className="p-4 bg-white rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Bot className="w-4 h-4 text-emerald-600" />
                                <h4 className="font-semibold text-slate-800">AI Categorization</h4>
                            </div>
                            <p className="text-sm text-slate-600">
                                Intelligently categorizes transactions and extracts recipient/sender information for better matching.
                            </p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter>
                    <Button 
                        onClick={handleProcessMPesaStatement} 
                        disabled={isLoading || !file} 
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
                        size="lg"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                Processing M-Pesa Statement...
                            </>
                        ) : (
                            <>
                                <Bot className="w-5 h-5 mr-3" />
                                Process M-Pesa Statement with AI
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            {/* Instructions Card */}
            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                        How to Get Your M-Pesa Statement
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                            <p className="text-sm text-slate-700">
                                <strong>Via SMS:</strong> Dial *334# and follow prompts to request your M-Pesa statement
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                            <p className="text-sm text-slate-700">
                                <strong>MySafaricom App:</strong> Log in and navigate to M-Pesa → Statement
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                            <p className="text-sm text-slate-700">
                                <strong>Customer Care:</strong> Call 100 and request your M-Pesa statement to be sent via email
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}