import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Referral } from '@/api/entities';
import { CompanyProfile } from '@/api/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Check, Users, Gift, CheckCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';

// Generate a unique referral code if one doesn't exist
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'PB';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function ReferralsPage() {
    const [profile, setProfile] = useState(null);
    const [referrals, setReferrals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const user = await User.me();
                let profiles = await CompanyProfile.filter({ created_by: user.email });
                
                if (profiles.length === 0) {
                    toast({ title: 'Profile not found', description: 'Please complete your company profile to get a referral code.', variant: 'destructive' });
                    setIsLoading(false);
                    return;
                }
                
                let currentProfile = profiles[0];
                if (!currentProfile.referral_code) {
                    currentProfile = await CompanyProfile.update(currentProfile.id, {
                        referral_code: generateReferralCode()
                    });
                }
                setProfile(currentProfile);
                
                const referralData = await Referral.filter({ referrer_user_id: user.id });
                setReferrals(referralData);
            } catch (error) {
                console.error("Error loading referral data:", error);
                toast({ title: 'Error', description: 'Could not load your referral information.', variant: 'destructive' });
            }
            setIsLoading(false);
        };
        loadData();
    }, [toast]);

    const handleCopy = () => {
        if (profile?.referral_code) {
            const referralLinkToCopy = `${window.location.origin}${createPageUrl('Home')}?ref=${profile.referral_code}`;
            navigator.clipboard.writeText(referralLinkToCopy);
            setIsCopied(true);
            toast({ title: 'Copied to clipboard!', description: 'You can now share your referral link.' });
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const referralsRewarded = referrals.filter(r => r.reward_applied).length;
    const freeMonthsEarned = referralsRewarded; // Each rewarded referral gives a free month

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }
    
    const referralLink = profile ? `${window.location.origin}${createPageUrl('Home')}?ref=${profile.referral_code}` : '';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-slate-800">Give a Month, Get a Month</h1>
                    <p className="text-indigo-600 mt-4 text-lg">
                        Invite a friend to PeakBooks. When they subscribe, you both get a FREE month.
                    </p>
                </header>

                <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Your Unique Referral Link</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                            <Input 
                                value={referralLink} 
                                readOnly 
                                className="flex-grow bg-white"
                            />
                            <Button onClick={handleCopy} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700" disabled={!profile?.referral_code}>
                                {isCopied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                                {isCopied ? 'Copied!' : 'Copy Link'}
                            </Button>
                        </div>
                        <p className="text-sm text-slate-500 mt-4">
                            Share this link with your friends. When they sign up and subscribe, you'll both automatically receive a credit for a free month.
                        </p>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <Card className="shadow-lg border-0">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Successful Referrals</CardTitle>
                            <Users className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{referrals.filter(r => r.status === 'subscribed').length}</div>
                            <p className="text-xs text-muted-foreground">Businesses you've referred who are now subscribed.</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Free Months Earned</CardTitle>
                            <Gift className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{freeMonthsEarned}</div>
                            <p className="text-xs text-muted-foreground">Rewards are applied automatically to your subscription.</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-xl border-0">
                    <CardHeader>
                        <CardTitle>Your Referral History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Referred Business</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Reward</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {referrals.length > 0 ? (
                                    referrals.map(ref => (
                                        <TableRow key={ref.id}>
                                            <TableCell>{ref.referred_email || 'N/A'}</TableCell>
                                            <TableCell><Badge variant={ref.status === 'subscribed' ? 'success' : 'secondary'}>{ref.status}</Badge></TableCell>
                                            <TableCell>
                                                {ref.reward_applied ? (
                                                    <Badge className="bg-green-100 text-green-800">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Month Awarded
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">Pending</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan="3" className="text-center">You haven't referred anyone yet.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}