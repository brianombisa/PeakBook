import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Banknote, PiggyBank, Briefcase, TrendingUp } from 'lucide-react';

const data = [
  { name: 'Operations', value: 40, icon: <Briefcase/> },
  { name: 'Tax', value: 10, icon: <Banknote/> },
  { name: 'Emergency', value: 10, icon: <PiggyBank/> },
  { name: 'Growth', value: 10, icon: <TrendingUp/> },
];
const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981'];

export default function AllocationWidget() {
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
                        <Banknote className="w-6 h-6 text-green-600" />
                        Auto-Allocation Engine
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600 mb-4 text-center">
                        Based on best practices, here's how every incoming shilling could be allocated.
                    </p>
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value">
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}