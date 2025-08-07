import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Brain, CheckCircle, AlertTriangle, Camera } from 'lucide-react';
import { ExtractDataFromUploadedFile, UploadFile } from '@/api/integrations';

// Smart expense categorization rules
const EXPENSE_CATEGORIZATION_RULES = {
    'transport': ['uber', 'taxi', 'matatu', 'fuel', 'petrol', 'diesel', 'parking'],
    'utilities': ['kplc', 'kenya power', 'water', 'internet', 'wifi', 'electricity'],
    'office_supplies': ['stationery', 'paper', 'printer', 'ink', 'office'],
    'marketing': ['facebook ads', 'google ads', 'advertising', 'marketing', 'promotion'],
    'meals': ['restaurant', 'lunch', 'dinner', 'breakfast', 'coffee', 'food'],
    'professional_services': ['lawyer', 'accountant', 'consultant', 'legal', 'audit'],
    'rent': ['rent', 'lease', 'office space', 'warehouse'],
    'insurance': ['insurance', 'cover', 'premium', 'policy'],
    'software': ['subscription', 'saas', 'software', 'license', 'app']
};

// Intelligent Receipt OCR Processor
const IntelligentReceiptProcessor = ({ onExpenseExtracted }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [confidence, setConfidence] = useState(0);
    const { toast } = useToast();

    const processReceiptFile = async (file) => {
        setIsProcessing(true);
        try {
            // Upload the file first
            const uploadResult = await UploadFile({ file });
            const fileUrl = uploadResult.file_url;
            
            // Extract data using AI
            const extractionSchema = {
                type: "object",
                properties: {
                    vendor_name: { type: "string" },
                    total_amount: { type: "number" },
                    expense_date: { type: "string", format: "date" },
                    description: { type: "string" },
                    items: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                description: { type: "string" },
                                amount: { type: "number" },
                                quantity: { type: "number" }
                            }
                        }
                    },
                    tax_amount: { type: "number" },
                    receipt_number: { type: "string" }
                }
            };
            
            const extractionResult = await ExtractDataFromUploadedFile({
                file_url: fileUrl,
                json_schema: extractionSchema
            });
            
            if (extractionResult.status === 'success') {
                const data = extractionResult.output;
                
                // Smart categorization
                const category = categorizExpense(data.vendor_name, data.description, data.items);
                
                const enhancedData = {
                    ...data,
                    category,
                    receipt_url: fileUrl,
                    confidence: calculateConfidence(data)
                };
                
                setExtractedData(enhancedData);
                setConfidence(enhancedData.confidence);
                
                toast({
                    title: "Receipt Processed Successfully",
                    description: `Extracted expense data with ${enhancedData.confidence}% confidence`,
                });
            } else {
                throw new Error(extractionResult.details);
            }
        } catch (error) {
            console.error('Receipt processing error:', error);
            toast({
                title: "Processing Failed",
                description: "Could not extract data from receipt. Please enter manually.",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const categorizExpense = (vendorName = '', description = '', items = []) => {
        const text = `${vendorName} ${description} ${items.map(i => i.description).join(' ')}`.toLowerCase();
        
        for (const [category, keywords] of Object.entries(EXPENSE_CATEGORIZATION_RULES)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return category;
            }
        }
        
        return 'other'; // Default category
    };
    
    const calculateConfidence = (data) => {
        let score = 50; // Base confidence
        
        if (data.vendor_name && data.vendor_name.length > 2) score += 20;
        if (data.total_amount && data.total_amount > 0) score += 20;
        if (data.expense_date) score += 10;
        if (data.receipt_number) score += 10;
        if (data.items && data.items.length > 0) score += 10;
        
        return Math.min(100, score);
    };
    
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast({
                title: "Invalid File Type",
                description: "Please upload a JPG, PNG, or PDF file.",
                variant: "destructive"
            });
            return;
        }
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: "File Too Large",
                description: "Please upload a file smaller than 10MB.",
                variant: "destructive"
            });
            return;
        }
        
        await processReceiptFile(file);
    };
    
    return (
        <div className="space-y-6">
            {/* Upload Interface */}
            <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
                <CardContent className="p-8 text-center">
                    {isProcessing ? (
                        <div className="space-y-4">
                            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                            <div>
                                <h3 className="text-lg font-semibold text-blue-800 mb-2">Processing Receipt...</h3>
                                <p className="text-blue-600">Our AI is extracting expense data from your receipt.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                <Camera className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-blue-800 mb-2">Upload Receipt</h3>
                                <p className="text-blue-600 mb-4">Take a photo or upload a PDF of your receipt</p>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="receipt-upload"
                                />
                                <label htmlFor="receipt-upload">
                                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                                        <span>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Choose File or Take Photo
                                        </span>
                                    </Button>
                                </label>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {/* Extracted Data Display */}
            {extractedData && (
                <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                        <CardTitle className="text-green-800 flex items-center gap-2">
                            <Brain className="w-5 h-5" />
                            AI Extracted Data
                            <Badge className={
                                confidence > 80 ? 'bg-green-100 text-green-800' :
                                confidence > 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }>
                                {confidence}% Confidence
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Vendor</label>
                                <Input 
                                    value={extractedData.vendor_name || ''} 
                                    onChange={(e) => setExtractedData({...extractedData, vendor_name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Amount</label>
                                <Input 
                                    type="number"
                                    value={extractedData.total_amount || ''} 
                                    onChange={(e) => setExtractedData({...extractedData, total_amount: parseFloat(e.target.value)})}
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Date</label>
                                <Input 
                                    type="date"
                                    value={extractedData.expense_date || ''} 
                                    onChange={(e) => setExtractedData({...extractedData, expense_date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Category</label>
                                <Select 
                                    value={extractedData.category} 
                                    onValueChange={(value) => setExtractedData({...extractedData, category: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="transport">Transport</SelectItem>
                                        <SelectItem value="utilities">Utilities</SelectItem>
                                        <SelectItem value="office_supplies">Office Supplies</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="meals">Meals</SelectItem>
                                        <SelectItem value="professional_services">Professional Services</SelectItem>
                                        <SelectItem value="rent">Rent</SelectItem>
                                        <SelectItem value="insurance">Insurance</SelectItem>
                                        <SelectItem value="software">Software</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <Input 
                                value={extractedData.description || ''} 
                                onChange={(e) => setExtractedData({...extractedData, description: e.target.value})}
                            />
                        </div>
                        
                        {confidence < 70 && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-sm text-yellow-700 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Low confidence detected. Please review and correct the extracted data.
                                </p>
                            </div>
                        )}
                        
                        <div className="flex gap-2">
                            <Button 
                                onClick={() => onExpenseExtracted(extractedData)}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Use This Data
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => setExtractedData(null)}
                            >
                                Start Over
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default IntelligentReceiptProcessor;