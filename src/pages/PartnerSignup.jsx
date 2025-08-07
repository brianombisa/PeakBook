import React, { useState } from 'react';
import { AccountantPartner } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
    Building2, Users, DollarSign, Award, 
    CheckCircle, FileText, Shield, Briefcase 
} from 'lucide-react';

// Generate unique partner ID
const generatePartnerId = () => {
    return 'PB-PARTNER-' + Date.now().toString(36).toUpperCase();
};

// Generate referral code
const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'PA';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export default function PartnerSignupPage() {
    const [formData, setFormData] = useState({
        firm_name: '',
        contact_person: '',
        email: '',
        phone: '',
        business_registration: '',
        cpa_license: '',
        specializations: [],
        experience_years: '',
        current_clients: '',
        why_partner: '',
        agree_terms: false,
        agree_commission: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { toast } = useToast();

    const specializationOptions = [
        'small_business',
        'tax_preparation', 
        'audit',
        'payroll',
        'consulting',
        'bookkeeping'
    ];

    const handleSpecializationChange = (specialization, checked) => {
        if (checked) {
            setFormData({
                ...formData,
                specializations: [...formData.specializations, specialization]
            });
        } else {
            setFormData({
                ...formData,
                specializations: formData.specializations.filter(s => s !== specialization)
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.agree_terms || !formData.agree_commission) {
            toast({
                title: 'Agreement Required',
                description: 'Please agree to the terms and commission structure.',
                variant: 'destructive'
            });
            return;
        }

        if (formData.specializations.length === 0) {
            toast({
                title: 'Specializations Required',
                description: 'Please select at least one area of expertise.',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await AccountantPartner.create({
                partner_id: generatePartnerId(),
                referral_code: generateReferralCode(),
                ...formData,
                status: 'pending',
                commission_tier: 'bronze',
                commission_rate: 0.15,
                onboarding_bonus_rate: 2500,
                total_clients_managed: 0,
                total_earnings: 0,
                joined_date: new Date().toISOString().split('T')[0]
            });

            setSubmitted(true);
            toast({
                title: 'Application Submitted!',
                description: 'We will review your application and get back to you within 48 hours.',
            });
        } catch (error) {
            console.error('Partner signup error:', error);
            toast({
                title: 'Submission Failed',
                description: 'Please try again or contact support.',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-800">Application Submitted!</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-slate-600">
                            Thank you for your interest in becoming a PeakBooks Partner. We've received your application and will review it within 48 hours.
                        </p>
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                            <h3 className="font-semibold text-indigo-800 mb-2">What's Next?</h3>
                            <ul className="text-sm text-indigo-700 space-y-1 text-left">
                                <li>• We'll verify your credentials and experience</li>
                                <li>• You'll receive an email with your partner portal access</li>
                                <li>• We'll schedule a brief onboarding call</li>
                                <li>• You can start referring clients immediately after approval</li>
                            </ul>
                        </div>
                        <Button onClick={() => window.location.href = '/'} className="w-full">
                            Return to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-800 mb-4">
                        Join the PeakBooks Partner Program
                    </h1>
                    <p className="text-xl text-slate-600 mb-8">
                        Grow your practice while helping SMEs digitize their accounting
                    </p>
                    
                    {/* Benefits Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <Card className="bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-6 text-center">
                                <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
                                <h3 className="font-bold text-lg mb-2">Earn More Revenue</h3>
                                <p className="text-sm text-slate-600">15-30% recurring commission plus KES 2,500 onboarding bonus per client</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-6 text-center">
                                <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h3 className="font-bold text-lg mb-2">Manage Multiple Clients</h3>
                                <p className="text-sm text-slate-600">Dedicated portal to manage all your clients from one dashboard</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-6 text-center">
                                <Award className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                                <h3 className="font-bold text-lg mb-2">Tier-Based Rewards</h3>
                                <p className="text-sm text-slate-600">Higher commission rates as you grow your client base</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Application Form */}
                <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Briefcase className="w-6 h-6" />
                            Partner Application
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="firm_name">Firm/Company Name *</Label>
                                    <Input
                                        id="firm_name"
                                        value={formData.firm_name}
                                        onChange={(e) => setFormData({...formData, firm_name: e.target.value})}
                                        placeholder="ABC Accounting Services"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="contact_person">Your Full Name *</Label>
                                    <Input
                                        id="contact_person"
                                        value={formData.contact_person}
                                        onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        placeholder="john@abcaccounting.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        placeholder="+254 712 345 678"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Credentials */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="business_registration">Business Registration Number</Label>
                                    <Input
                                        id="business_registration"
                                        value={formData.business_registration}
                                        onChange={(e) => setFormData({...formData, business_registration: e.target.value})}
                                        placeholder="e.g., C.123456"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="cpa_license">CPA License Number (if applicable)</Label>
                                    <Input
                                        id="cpa_license"
                                        value={formData.cpa_license}
                                        onChange={(e) => setFormData({...formData, cpa_license: e.target.value})}
                                        placeholder="e.g., CPA/001234"
                                    />
                                </div>
                            </div>

                            {/* Experience */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="experience_years">Years of Experience</Label>
                                    <Select onValueChange={(value) => setFormData({...formData, experience_years: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select experience level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1-2">1-2 years</SelectItem>
                                            <SelectItem value="3-5">3-5 years</SelectItem>
                                            <SelectItem value="6-10">6-10 years</SelectItem>
                                            <SelectItem value="10+">10+ years</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="current_clients">Current Number of Clients</Label>
                                    <Select onValueChange={(value) => setFormData({...formData, current_clients: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select client range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0-5">0-5 clients</SelectItem>
                                            <SelectItem value="6-15">6-15 clients</SelectItem>
                                            <SelectItem value="16-30">16-30 clients</SelectItem>
                                            <SelectItem value="30+">30+ clients</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Specializations */}
                            <div>
                                <Label>Areas of Expertise *</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                    {specializationOptions.map(spec => (
                                        <div key={spec} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={spec}
                                                checked={formData.specializations.includes(spec)}
                                                onCheckedChange={(checked) => handleSpecializationChange(spec, checked)}
                                            />
                                            <Label htmlFor={spec} className="text-sm capitalize">
                                                {spec.replace('_', ' ')}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Why Partner */}
                            <div>
                                <Label htmlFor="why_partner">Why do you want to become a PeakBooks Partner?</Label>
                                <Textarea
                                    id="why_partner"
                                    value={formData.why_partner}
                                    onChange={(e) => setFormData({...formData, why_partner: e.target.value})}
                                    placeholder="Tell us about your goals and how you plan to help SMEs..."
                                    className="h-24"
                                />
                            </div>

                            {/* Agreements */}
                            <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                                <div className="flex items-start space-x-2">
                                    <Checkbox
                                        id="agree_terms"
                                        checked={formData.agree_terms}
                                        onCheckedChange={(checked) => setFormData({...formData, agree_terms: checked})}
                                    />
                                    <Label htmlFor="agree_terms" className="text-sm">
                                        I agree to the Partner Terms & Conditions and will maintain professional standards when representing PeakBooks
                                    </Label>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <Checkbox
                                        id="agree_commission"
                                        checked={formData.agree_commission}
                                        onCheckedChange={(checked) => setFormData({...formData, agree_commission: checked})}
                                    />
                                    <Label htmlFor="agree_commission" className="text-sm">
                                        I understand the commission structure (15% base rate, KES 2,500 onboarding bonus) and payment terms
                                    </Label>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting Application...' : 'Submit Partner Application'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}