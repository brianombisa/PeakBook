import React, { useState, useEffect } from 'react';
import { CompanyProfile } from '@/api/entities';
import { User } from '@/api/entities';
import { Referral } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Building, Mail, Phone, MapPin, ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    company_name: '',
    business_sector: '',
    phone: '',
    address: '',
    kra_pin: '',
  });
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        navigate(createPageUrl('Home'));
      }
    };
    fetchUser();
  }, [navigate]);

  const handleSave = async () => {
    if (!profile.company_name || !profile.business_sector) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(true);
    try {
      const newProfile = await CompanyProfile.create(profile);
      
      // CRITICAL FIX: Handle referral after profile creation
      const pendingCode = localStorage.getItem('pendingReferralCode');
      if (pendingCode) {
        const referrers = await CompanyProfile.filter({ referral_code: pendingCode });
        if (referrers.length > 0) {
          const referrerProfile = referrers[0];
          await Referral.create({
            referrer_user_id: referrerProfile.created_by, // Link to the user who owns the company profile
            referrer_email: referrerProfile.email,
            referred_email: user.email,
            referral_code_used: pendingCode,
            status: 'signed_up',
          });
          // Clear the code so it's not used again
          localStorage.removeItem('pendingReferralCode');
        }
      }

      toast({
        title: 'Profile Saved!',
        description: 'Your company profile has been created successfully.',
        className: 'bg-green-100 text-green-800',
      });
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save your company profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (!user) return null; // Or a loading spinner

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-slate-800">
            Welcome to PeakBooks!
          </CardTitle>
          <p className="text-center text-slate-600">Let's set up your company profile.</p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-6">
            <div>
              <label className="font-semibold text-slate-700 flex items-center gap-2 mb-2"><Building className="w-5 h-5 text-blue-600" /> Company Name</label>
              <Input placeholder="Your Company Ltd." value={profile.company_name} onChange={(e) => handleChange('company_name', e.target.value)} />
            </div>
            <div>
              <label className="font-semibold text-slate-700 flex items-center gap-2 mb-2"><Briefcase className="w-5 h-5 text-blue-600" /> Business Sector</label>
              <Select onValueChange={(val) => handleChange('business_sector', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional_services">Professional Services</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="general_trading">General Trading</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="agri_business">Agri-business</SelectItem>
                  <SelectItem value="hospitality">Hospitality</SelectItem>
                  <SelectItem value="not_for_profit">Not-for-Profit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 flex items-center gap-2 mb-2"><Phone className="w-5 h-5 text-blue-600" /> Phone Number</label>
              <Input placeholder="0712 345 678" value={profile.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
            <div>
              <label className="font-semibold text-slate-700 flex items-center gap-2 mb-2"><MapPin className="w-5 h-5 text-blue-600" /> Address</label>
              <Input placeholder="123 Main St, Nairobi" value={profile.address} onChange={(e) => handleChange('address', e.target.value)} />
            </div>
             <div>
              <label className="font-semibold text-slate-700 flex items-center gap-2 mb-2"><Mail className="w-5 h-5 text-blue-600" /> KRA PIN</label>
              <Input placeholder="A001234567Z" value={profile.kra_pin} onChange={(e) => handleChange('kra_pin', e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700">
              {isSaving ? 'Saving...' : 'Complete Setup'}
              {!isSaving && <ChevronRight className="w-5 h-5 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}