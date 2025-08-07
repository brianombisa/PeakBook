
import React, { useState, useEffect, useCallback } from 'react';
import { CompanyProfile as CompanyProfileEntity } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { UploadFile } from '@/api/integrations';
import { Loader2, Upload, Trash2, Building, Landmark } from 'lucide-react';
import AuditLogger from '../utils/AuditLogger';

const businessSectors = [
  "wholesale", "retail", "professional_services", "manufacturing", "hospitality", 
  "not_for_profit", "agri_business", "general_trading", "construction", "other"
];

const financialYearMonths = [
  "January", "February", "March", "April", "May", "June", "July", 
  "August", "September", "October", "November", "December"
];

const ImageUploader = ({ label, imageUrl, onUpload, onRemove, isUploading }) => {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <Input
                    type="file"
                    className="flex-1"
                    onChange={(e) => onUpload(e.target.files[0])}
                    accept="image/*"
                    disabled={isUploading}
                />
                {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                ) : (
                    <>
                        {imageUrl && (
                            <img src={imageUrl} alt={label} className="w-16 h-16 object-contain border rounded-md p-1" />
                        )}
                        {imageUrl ? (
                            <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={`Remove ${label}`}>
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </Button>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
};

export default function CompanyProfile() {
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        company_name: '',
        business_sector: '',
        address: '',
        email: '',
        phone: '',
        kra_pin: '',
        financial_year_start_month: 'January',
        default_invoice_message: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [logoUrl, setLogoUrl] = useState('');
    const [signatureUrl, setSignatureUrl] = useState('');
    const [stampUrl, setStampUrl] = useState('');
    const [isLogoUploading, setIsLogoUploading] = useState(false);
    const [isSignatureUploading, setIsSignatureUploading] = useState(false);
    const [isStampUploading, setIsStampUploading] = useState(false);
    const { toast } = useToast();

    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            const profiles = await CompanyProfileEntity.filter({ created_by: user.email });
            if (profiles.length > 0) {
                const p = profiles[0];
                setProfile(p);
                setFormData({
                    company_name: p.company_name || '',
                    business_sector: p.business_sector || '',
                    address: p.address || '',
                    email: p.email || '',
                    phone: p.phone || '',
                    kra_pin: p.kra_pin || '',
                    financial_year_start_month: p.financial_year_start_month || 'January',
                    default_invoice_message: p.default_invoice_message || '',
                });
                setLogoUrl(p.logo_url || '');
                setSignatureUrl(p.signature_url || '');
                setStampUrl(p.stamp_url || '');
            } else {
                // If no profile, create a placeholder
                const newProfile = await CompanyProfileEntity.create({ company_name: "My Company", financial_year_start_month: 'January' });
                setProfile(newProfile);
                setFormData(prev => ({ ...prev, company_name: newProfile.company_name, financial_year_start_month: 'January' }));
            }
        } catch (error) {
            console.error("Error loading company profile:", error);
            toast({ title: "Error", description: "Could not load company profile.", variant: "destructive" });
        }
        setIsLoading(false);
    }, [toast]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (file, type) => {
        if (!file) return;

        let setIsUploading;
        let setImageUrl;

        switch (type) {
            case 'logo': setIsUploading = setIsLogoUploading; setImageUrl = setLogoUrl; break;
            case 'signature': setIsUploading = setIsSignatureUploading; setImageUrl = setSignatureUrl; break;
            case 'stamp': setIsUploading = setIsStampUploading; setImageUrl = setStampUrl; break;
            default: return;
        }

        setIsUploading(true);
        try {
            const { file_url } = await UploadFile({ file });
            setImageUrl(file_url);
            toast({ title: "Success", description: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully.` });
        } catch (error) {
            console.error(`Error uploading ${type}:`, error);
            toast({ title: "Upload Failed", description: "Could not upload the file.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageRemove = (type) => {
        switch (type) {
            case 'logo': setLogoUrl(''); break;
            case 'signature': setSignatureUrl(''); break;
            case 'stamp': setStampUrl(''); break;
            default: return;
        }
        toast({ title: "Removed", description: `${type.charAt(0).toUpperCase() + type.slice(1)} removed.` });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dataToSave = {
                ...formData,
                logo_url: logoUrl,
                signature_url: signatureUrl,
                stamp_url: stampUrl,
            };

            if (profile) {
                const updatedProfile = await CompanyProfileEntity.update(profile.id, dataToSave);
                await AuditLogger.logUpdate('CompanyProfile', profile.id, profile, updatedProfile, updatedProfile.company_name);
                setProfile(updatedProfile); // Update local profile state with latest data
                toast({ title: "Success", description: "Company profile updated." });
            } else {
                const newProfile = await CompanyProfileEntity.create(dataToSave);
                await AuditLogger.logCreate('CompanyProfile', newProfile, newProfile.company_name);
                setProfile(newProfile);
                toast({ title: "Success", description: "Company profile created." });
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            toast({ title: "Error", description: "Could not save company profile.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-700">Loading company profile...</span>
            </div>
        );
    }

    return (
        <Card className="max-w-4xl mx-auto my-8">
            <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>Manage your company's information, branding, and defaults.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-4">
                    <h3 className="font-medium text-lg flex items-center gap-2 text-slate-700"><Building className="w-5 h-5"/> Business Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><Label htmlFor="company_name">Company Name</Label><Input id="company_name" name="company_name" value={formData.company_name} onChange={handleInputChange} /></div>
                        <div><Label htmlFor="kra_pin">KRA PIN</Label><Input id="kra_pin" name="kra_pin" value={formData.kra_pin} onChange={handleInputChange} /></div>
                        <div>
                            <Label htmlFor="business_sector">Business Sector</Label>
                            <Select name="business_sector" onValueChange={(value) => handleSelectChange('business_sector', value)} value={formData.business_sector}>
                                <SelectTrigger id="business_sector">
                                    <SelectValue placeholder="Select sector..."/>
                                </SelectTrigger>
                                <SelectContent>
                                    {businessSectors.map(sector => (
                                        <SelectItem key={sector} value={sector} className="capitalize">
                                            {sector.replace(/_/g, ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="financial_year_start_month">Financial Year Start Month</Label>
                            <Select name="financial_year_start_month" onValueChange={(value) => handleSelectChange('financial_year_start_month', value)} value={formData.financial_year_start_month}>
                                <SelectTrigger id="financial_year_start_month">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    {financialYearMonths.map(month => (
                                        <SelectItem key={month} value={month}>{month}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div><Label htmlFor="email">Company Email</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} /></div>
                        <div><Label htmlFor="phone">Company Phone</Label><Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} /></div>
                        <div className="md:col-span-2">
                            <Label htmlFor="address">Company Address</Label>
                            <Textarea id="address" name="address" value={formData.address} onChange={handleInputChange} />
                        </div>
                        <div className="md:col-span-2">
                            <Label htmlFor="default_invoice_message">Default Invoice Message</Label>
                            <Textarea id="default_invoice_message" name="default_invoice_message" placeholder="e.g., Thank you for your business. Please find our payment details below..." value={formData.default_invoice_message} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-medium text-lg text-slate-700">Branding</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ImageUploader label="Company Logo" imageUrl={logoUrl} onUpload={(file) => handleImageUpload(file, 'logo')} onRemove={() => handleImageRemove('logo')} isUploading={isLogoUploading} />
                        <ImageUploader label="Signature" imageUrl={signatureUrl} onUpload={(file) => handleImageUpload(file, 'signature')} onRemove={() => handleImageRemove('signature')} isUploading={isSignatureUploading} />
                        <ImageUploader label="Company Stamp" imageUrl={stampUrl} onUpload={(file) => handleImageUpload(file, 'stamp')} onRemove={() => handleImageRemove('stamp')} isUploading={isStampUploading} />
                    </div>
                </div>

            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Profile
                </Button>
            </CardFooter>
        </Card>
    );
}
