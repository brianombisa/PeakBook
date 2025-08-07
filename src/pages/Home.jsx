
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap, Shield, FileText, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast'; // Assuming this path exists
import { motion } from 'framer-motion'; // Assuming framer-motion is installed

export default function HomePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [referralCode, setReferralCode] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        // Extract referral code from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        if (refCode) {
            setReferralCode(refCode);
            toast({ 
                title: "Referral Code Applied", 
                description: `You'll get special benefits with code: ${refCode}`,
                className: "bg-green-100 border-green-200 text-green-800"
            });
        }
    }, [toast]);

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            // Store referral code in localStorage before login
            if (referralCode) {
                localStorage.setItem('pendingReferralCode', referralCode);
            }
            
            // User.login() is expected to handle the redirection after authentication
            await User.login();
        } catch (error) {
            console.error("Login failed:", error);
            toast({ 
                title: "Login failed", 
                description: "Please try again.", 
                variant: "destructive" 
            });
        }
        setIsLoading(false);
    };

    const features = [
        {
            icon: <Zap className="w-5 h-5 text-yellow-400" />,
            title: "Automated M-Pesa Reconciliation",
            description: "Connect your PayBill/Till and let PeakBooks automatically match payments to invoices.",
        },
        {
            icon: <Shield className="w-5 h-5 text-blue-400" />,
            title: "KRA Compliant Tax Reports",
            description: "Generate iTax-ready VAT and PAYE reports in seconds, saving you hours of work.",
        },
        {
            icon: <FileText className="w-5 h-5 text-green-400" />,
            title: "Payroll & Invoicing",
            description: "Manage employees, run payroll with all deductions, and send professional invoices.",
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
            <div className="relative z-10">
                <div className="container mx-auto px-6 py-20 text-white">
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            {/* Original Logo and H1 from the left marketing section, now centered */}
                            <div className="flex items-center gap-3 justify-center mb-8">
                                <img src="https://storage.googleapis.com/base44_prod_public/4574971a-e7c5-4347-a417-383707831868" alt="PeakBooks Logo" className="w-12 h-12"/>
                                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                                    PeakBooks
                                </h1>
                            </div>

                            {referralCode && (
                                <div className="inline-block mb-6 px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-200">
                                    <span className="text-sm font-medium">🎉 Referral Code Applied: {referralCode}</span>
                                </div>
                            )}
                            
                            {/* Original H2 and P from the left marketing section */}
                            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                                The All-In-One Accounting Super App for Kenyan Businesses.
                            </h2>
                            <p className="mt-4 text-lg text-slate-300">
                                From M-Pesa reconciliation and KRA compliance to payroll and invoicing, PeakBooks is the last accounting tool you'll ever need.
                            </p>
                            
                            <div className="flex flex-col items-center gap-6 mt-12">
                                <Button
                                    onClick={handleLogin}
                                    disabled={isLoading}
                                    className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-200"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                            Signing you in...
                                        </>
                                    ) : (
                                        <>
                                            Get Started Free
                                            <ArrowRight className="ml-2 w-5 h-5" />
                                        </>
                                    )}
                                </Button>
                                
                                {referralCode && (
                                    <p className="text-sm text-blue-200">
                                        ✨ You'll receive special onboarding benefits from your referrer
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Features section (originally part of the left marketing section, now standalone below the hero) */}
                    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                        {features.map((feature, index) => (
                            <div key={index} className="flex flex-col items-center text-center p-6 bg-slate-800/50 rounded-lg shadow-xl border border-slate-700">
                                <div className="flex-shrink-0 bg-slate-700 p-3 rounded-full mb-4">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-xl mb-2">{feature.title}</h3>
                                    <p className="text-slate-300 text-sm">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .animate-fade-in-left {
                    animation: fadeInLeft 0.8s ease-in-out forwards;
                    opacity: 0;
                }
                .animate-fade-in-right {
                    animation: fadeInRight 0.8s ease-in-out 0.2s forwards;
                    opacity: 0;
                }
                @keyframes fadeInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes fadeInRight {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
}
