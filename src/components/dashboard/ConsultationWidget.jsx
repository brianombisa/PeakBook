import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ConsultationRequest } from '@/api/entities';
import { LifeBuoy, Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ConsultationWidget = ({ data }) => {
    const { user, companyProfile } = data;
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) {
            toast({
                title: 'Message is empty',
                description: 'Please tell us what you need help with.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            await ConsultationRequest.create({
                company_id: companyProfile.id,
                company_name: companyProfile.company_name,
                user_id: user.id,
                user_name: user.full_name,
                user_email: user.email,
                request_message: message,
            });
            setIsSubmitted(true);
            toast({
                title: 'Request Sent!',
                description: 'Our team will get back to you within 24 hours.',
            });
        } catch (error) {
            console.error('Failed to send consultation request:', error);
            toast({
                title: 'Submission Failed',
                description: 'There was an issue sending your request. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center h-full text-center p-10">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Request Received!</h3>
                        <p className="text-slate-600">
                            Thank you for reaching out. A PeakBooks consultant will contact you at{' '}
                            <span className="font-semibold text-slate-700">{user.email}</span> shortly.
                        </p>
                        <Button onClick={() => setIsSubmitted(false)} className="mt-6">
                            Submit Another Request
                        </Button>
                    </motion.div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LifeBuoy className="w-6 h-6 text-blue-600" />
                    Request a Free Consultation
                </CardTitle>
                <CardDescription>
                    Stuck? Need expert advice? Our professional accountants are here to help you succeed.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-slate-700">Your Company</p>
                        <p className="text-slate-600">{companyProfile?.company_name}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-700">Your Contact</p>
                        <p className="text-slate-600">{user?.full_name} ({user?.email})</p>
                    </div>
                    <div>
                        <label htmlFor="message" className="text-sm font-medium text-slate-700 block mb-2">
                            What can we help you with?
                        </label>
                        <Textarea
                            id="message"
                            placeholder="e.g., I need help setting up my Chart of Accounts for IFRS compliance, assistance with tax filing, or advice on managing cash flow..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="text-right">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Request'}
                            <Send className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default ConsultationWidget;