import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { X, Save, Plus, Upload, Paperclip, Trash2, Loader2 } from 'lucide-react';
import { UploadFile } from '@/api/integrations';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const DocumentUploader = ({ documents, onDocumentsChange }) => {
    const [docName, setDocName] = useState('');
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const handleUpload = async () => {
        if (!file || !docName) {
            toast({ title: "Missing Details", description: "Please provide a document name and select a file.", variant: "destructive" });
            return;
        }
        setIsUploading(true);
        try {
            const { file_url } = await UploadFile({ file });
            const newDoc = { name: docName, url: file_url, uploaded_at: new Date().toISOString() };
            onDocumentsChange([...documents, newDoc]);
            setDocName('');
            setFile(null);
            document.getElementById('file-input').value = null; // Reset file input
            toast({ title: "Success", description: "Document uploaded." });
        } catch (error) {
            console.error(error);
            toast({ title: "Upload Failed", description: "Could not upload the document.", variant: "destructive" });
        }
        setIsUploading(false);
    };

    const handleDelete = (index) => {
        const updatedDocs = documents.filter((_, i) => i !== index);
        onDocumentsChange(updatedDocs);
    };

    return (
        <div className="space-y-4">
            <Label>Employee Documents</Label>
            <div className="p-4 border rounded-lg bg-slate-50 space-y-4">
                {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm">
                        <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-slate-500" />
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate">{doc.name}</a>
                        </div>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-8 w-8" onClick={() => handleDelete(index)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
                {documents.length === 0 && <p className="text-sm text-center text-slate-500">No documents uploaded.</p>}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                    <Input placeholder="Document Name (e.g., ID Copy)" value={docName} onChange={(e) => setDocName(e.target.value)} className="flex-grow" />
                    <Input id="file-input" type="file" onChange={(e) => setFile(e.target.files[0])} className="flex-grow" />
                    <Button type="button" onClick={handleUpload} disabled={isUploading} className="shrink-0">
                        {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Upload
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function EmployeeForm({ employee, onSave, onCancel, nextEmployeeId }) {
    const [formData, setFormData] = useState(
        employee || {
            employee_id: nextEmployeeId || '',
            full_name: '',
            email: '',
            phone: '',
            position: '',
            department: '',
            hire_date: new Date().toISOString().split('T')[0],
            basic_salary: 0,
            allowances: {},
            bank_details: {},
            kra_pin: '',
            national_id: '',
            nhif_number: '',
            nssf_number: '',
            documents: []
        }
    );

    const handleSave = () => {
        onSave(formData);
    };

    const handleDocumentsChange = (newDocs) => {
        setFormData({ ...formData, documents: newDocs });
    };

    return (
        <Card className="mb-6 shadow-lg">
            <CardHeader>
                <CardTitle>{employee ? `Edit ${employee.full_name}` : 'Add New Employee'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label>Employee ID</Label><Input value={formData.employee_id} readOnly className="bg-slate-100" /></div>
                    <div><Label>Full Name</Label><Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} /></div>
                    <div><Label>Position</Label><Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                    <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                    <div><Label>Hire Date</Label><Input type="date" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div><Label>KRA PIN</Label><Input value={formData.kra_pin} onChange={e => setFormData({...formData, kra_pin: e.target.value})} /></div>
                     <div><Label>National ID</Label><Input value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} /></div>
                     <div><Label>NSSF No.</Label><Input value={formData.nssf_number} onChange={e => setFormData({...formData, nssf_number: e.target.value})} /></div>
                     <div><Label>NHIF No.</Label><Input value={formData.nhif_number} onChange={e => setFormData({...formData, nhif_number: e.target.value})} /></div>
                </div>
                
                <Card>
                    <CardHeader><CardTitle className="text-base">Salary & Banking</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                             <div><Label>Basic Salary (Monthly)</Label><Input type="number" value={formData.basic_salary} onChange={(e) => setFormData({ ...formData, basic_salary: parseFloat(e.target.value) || 0 })} /></div>
                             <div><Label>House Allowance</Label><Input type="number" value={formData.allowances?.house_allowance || ''} onChange={(e) => setFormData({ ...formData, allowances: { ...formData.allowances, house_allowance: parseFloat(e.target.value) || 0 } })} /></div>
                             <div><Label>Transport Allowance</Label><Input type="number" value={formData.allowances?.transport_allowance || ''} onChange={(e) => setFormData({ ...formData, allowances: { ...formData.allowances, transport_allowance: parseFloat(e.target.value) || 0 } })} /></div>
                        </div>
                         <div className="space-y-4">
                             <div><Label>Bank Name</Label><Input value={formData.bank_details?.bank_name || ''} onChange={(e) => setFormData({ ...formData, bank_details: { ...formData.bank_details, bank_name: e.target.value } })} /></div>
                             <div><Label>Bank Branch</Label><Input value={formData.bank_details?.branch || ''} onChange={(e) => setFormData({ ...formData, bank_details: { ...formData.bank_details, branch: e.target.value } })} /></div>
                             <div><Label>Account Number</Label><Input value={formData.bank_details?.account_number || ''} onChange={(e) => setFormData({ ...formData, bank_details: { ...formData.bank_details, account_number: e.target.value } })} /></div>
                        </div>
                    </CardContent>
                </Card>

                <DocumentUploader documents={formData.documents || []} onDocumentsChange={handleDocumentsChange} />

            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" />Cancel</Button>
                <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save Employee</Button>
            </CardFooter>
        </Card>
    );
}