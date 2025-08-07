import React, { useState } from 'react';
import { BusinessGoal } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Target, Trash2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const GoalForm = ({ onSave, onCancel }) => {
    const [goal, setGoal] = useState({
        goal_name: '',
        metric: 'revenue',
        target_value: '',
        start_date: '',
        end_date: ''
    });

    const handleChange = (field, value) => {
        setGoal(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...goal, target_value: parseFloat(goal.target_value) });
    };

    return (
        <Card className="glass-effect border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Create New Business Goal
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="goal_name" className="text-base font-semibold text-slate-700">Goal Name</Label>
                            <Input 
                                id="goal_name"
                                value={goal.goal_name} 
                                onChange={e => handleChange('goal_name', e.target.value)} 
                                placeholder="e.g., Q4 Revenue Target"
                                className="mt-2"
                                required 
                            />
                        </div>
                        <div>
                            <Label htmlFor="metric" className="text-base font-semibold text-slate-700">Metric Type</Label>
                            <Select value={goal.metric} onValueChange={val => handleChange('metric', val)}>
                                <SelectTrigger className="mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="revenue">Revenue Growth</SelectItem>
                                    <SelectItem value="net_profit">Net Profit Target</SelectItem>
                                    <SelectItem value="expense_reduction">Expense Reduction</SelectItem>
                                    <SelectItem value="customer_acquisition">Customer Acquisition</SelectItem>
                                    <SelectItem value="gross_margin">Gross Margin Improvement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <Label htmlFor="target_value" className="text-base font-semibold text-slate-700">
                                Target Value {goal.metric.includes('margin') ? '(%)' : '(KES)'}
                            </Label>
                            <Input 
                                id="target_value"
                                type="number" 
                                step="0.01"
                                value={goal.target_value} 
                                onChange={e => handleChange('target_value', e.target.value)} 
                                placeholder="0.00"
                                className="mt-2"
                                required 
                            />
                        </div>
                        <div>
                            <Label htmlFor="start_date" className="text-base font-semibold text-slate-700">Start Date</Label>
                            <Input 
                                id="start_date"
                                type="date" 
                                value={goal.start_date} 
                                onChange={e => handleChange('start_date', e.target.value)} 
                                className="mt-2"
                                required 
                            />
                        </div>
                        <div>
                            <Label htmlFor="end_date" className="text-base font-semibold text-slate-700">End Date</Label>
                            <Input 
                                id="end_date"
                                type="date" 
                                value={goal.end_date} 
                                onChange={e => handleChange('end_date', e.target.value)} 
                                className="mt-2"
                                required 
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} className="px-8">
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8">
                            Create Goal
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default function GoalManager({ goals = [], onRefresh }) {
    const [showForm, setShowForm] = useState(false);
    const { toast } = useToast();

    const handleSave = async (data) => {
        try {
            await BusinessGoal.create(data);
            toast({ 
                title: 'Success', 
                description: 'Business goal created successfully.',
                className: 'bg-green-50 border-green-200 text-green-800'
            });
            setShowForm(false);
            if (onRefresh) onRefresh();
        } catch (error) {
            toast({ 
                title: 'Error', 
                description: 'Failed to create goal. Please try again.', 
                variant: 'destructive' 
            });
        }
    };

    const handleDelete = async (goalId) => {
        try {
            await BusinessGoal.delete(goalId);
            toast({ 
                title: 'Success', 
                description: 'Business goal deleted successfully.',
                className: 'bg-green-50 border-green-200 text-green-800'
            });
            if (onRefresh) onRefresh();
        } catch (error) {
            toast({ 
                title: 'Error', 
                description: 'Failed to delete goal. Please try again.', 
                variant: 'destructive' 
            });
        }
    };

    const getGoalStatus = (goal) => {
        if (!goal.target_value || goal.target_value === 0) return { status: 'pending', color: 'bg-gray-100 text-gray-800' };
        
        const progress = (goal.current_value / goal.target_value) * 100;
        
        if (progress >= 100) return { status: 'achieved', color: 'bg-green-100 text-green-800' };
        if (progress >= 80) return { status: 'on track', color: 'bg-blue-100 text-blue-800' };
        if (progress >= 50) return { status: 'at risk', color: 'bg-yellow-100 text-yellow-800' };
        return { status: 'off track', color: 'bg-red-100 text-red-800' };
    };

    const formatMetricValue = (metric, value) => {
        if (metric.includes('margin')) return `${value.toFixed(1)}%`;
        if (metric === 'customer_acquisition') return `${Math.round(value)} customers`;
        return `KES ${value.toLocaleString()}`;
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Business Goals Management</h2>
                    <p className="text-slate-600 mt-1">Track and monitor your key business objectives</p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                        <Plus className="w-4 h-4 mr-2" /> 
                        Add Goal
                    </Button>
                )}
            </div>

            {showForm && (
                <GoalForm onSave={handleSave} onCancel={() => setShowForm(false)} />
            )}

            {goals.length === 0 ? (
                <Card className="glass-effect border-0 shadow-lg">
                    <CardContent className="p-12 text-center">
                        <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Business Goals Set</h3>
                        <p className="text-slate-500 mb-6">Start tracking your business objectives by creating your first goal.</p>
                        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Goal
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {goals.map(goal => {
                        const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;
                        const goalStatus = getGoalStatus(goal);
                        
                        return (
                            <Card key={goal.id} className="glass-effect border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-5 h-5 text-blue-600" />
                                            <CardTitle className="text-lg font-bold text-slate-800">
                                                {goal.goal_name}
                                            </CardTitle>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete "{goal.goal_name}"? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                        onClick={() => handleDelete(goal.id)}
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    <Badge className={goalStatus.color}>
                                        {goalStatus.status}
                                    </Badge>
                                </CardHeader>
                                
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-slate-600 capitalize mb-2">
                                            {goal.metric.replace('_', ' ')}
                                        </p>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-lg text-slate-800">
                                                {formatMetricValue(goal.metric, goal.current_value)}
                                            </span>
                                            <span className="text-slate-600">
                                                of {formatMetricValue(goal.metric, goal.target_value)}
                                            </span>
                                        </div>
                                        <Progress 
                                            value={Math.min(progress, 100)} 
                                            className="h-3 mb-2"
                                        />
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-700">
                                                {progress.toFixed(1)}% Complete
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {progress >= 100 ? (
                                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                                ) : progress >= 50 ? (
                                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2 border-t border-slate-200">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-slate-500">Start Date</p>
                                                <p className="font-medium">{new Date(goal.start_date).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">End Date</p>
                                                <p className="font-medium">{new Date(goal.end_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}