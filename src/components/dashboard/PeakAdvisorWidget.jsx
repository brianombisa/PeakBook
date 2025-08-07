import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, CornerDownLeft } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';
import { motion, AnimatePresence } from 'framer-motion';

const PeakAdvisorWidget = ({ data }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const financialContext = `
            Recent Revenue: ${data.invoices.slice(0,10).reduce((sum, inv) => sum + inv.total_amount, 0)}
            Recent Expenses: ${data.expenses.slice(0,10).reduce((sum, exp) => sum + exp.amount, 0)}
            Number of Customers: ${data.customers.length}
            Number of Invoices: ${data.invoices.length}
        `;

        const prompt = `
            You are "PeakAdvisor", an expert business consultant for Kenyan SMEs. 
            A user is asking for advice. Use the provided financial context to give a concise, actionable, and encouraging answer.
            Keep your response to 2-3 short paragraphs.

            Financial Context:
            ${financialContext}

            User's Question:
            "${userMessage.content}"
        `;

        try {
            const response = await InvokeLLM({ prompt });
            const botMessage = { role: 'bot', content: response };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage = { role: 'bot', content: "I'm sorry, I'm having trouble connecting right now. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
            console.error("PeakAdvisor Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>PeakAdvisor</CardTitle>
                <CardDescription>Your AI business consultant. Ask me anything.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                <ScrollArea className="flex-grow pr-4 -mr-4 mb-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        <AnimatePresence>
                             <motion.div
                                key="initial"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3 p-3 bg-slate-100 rounded-lg"
                            >
                                <Bot className="w-5 h-5 text-slate-600 mt-1" />
                                <div>
                                    <p className="font-semibold text-slate-800">PeakAdvisor</p>
                                    <p className="text-sm text-slate-700">Hello! How can I help you optimize your business today? Ask about improving profits, cutting costs, or understanding your finances.</p>
                                </div>
                            </motion.div>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-start gap-3 p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-50' : 'bg-slate-100'}`}
                                >
                                    {msg.role === 'user' ? <User className="w-5 h-5 text-blue-600 mt-1" /> : <Bot className="w-5 h-5 text-slate-600 mt-1" />}
                                    <div>
                                        <p className={`font-semibold ${msg.role === 'user' ? 'text-blue-800' : 'text-slate-800'}`}>{msg.role === 'user' ? 'You' : 'PeakAdvisor'}</p>
                                        <p className="text-sm text-slate-700">{msg.content}</p>
                                    </div>
                                </motion.div>
                            ))}
                             {isLoading && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10}}
                                    className="flex items-center gap-2 text-slate-500"
                                >
                                    <Bot className="w-5 h-5 animate-pulse" />
                                    <p className="text-sm">PeakAdvisor is thinking...</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
                <form onSubmit={handleSubmit} className="relative">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g., How can I improve my cash flow?"
                        className="pr-12"
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isLoading}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default PeakAdvisorWidget;