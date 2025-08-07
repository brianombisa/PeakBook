import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { ReportSchedule } from '@/api/entities';
import { Save, Calendar, Users, FileText, Repeat } from 'lucide-react';
import AuditLogger from '../utils/AuditLogger';

export default function ReportAutomation({ existingSchedules = [], onScheduleCreated }) {
  const [newSchedule, setNewSchedule] = useState({
    report_name: '',
    frequency: 'monthly',
    recipients: '',
    schedule_time: '09:00',
    schedule_day: 1
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const reportOptions = [
    { value: 'profit_loss', label: 'Profit & Loss' },
    { value: 'balance_sheet', label: 'Balance Sheet' },
    { value: 'cash_flow', label: 'Cash Flow Statement' },
    { value: 'aged_receivables', label: 'Aged Receivables' },
    { value: 'sales_summary', label: 'Sales Summary' },
    { value: 'expense_analysis', label: 'Expense Analysis' }
  ];

  const handleSave = async () => {
    if (!newSchedule.report_name || !newSchedule.recipients) {
      toast({ title: "Missing Information", description: "Please select a report and add at least one recipient.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const scheduleData = {
        ...newSchedule,
        recipients: newSchedule.recipients.split(',').map(e => e.trim()).filter(e => e),
      };
      
      const created = await ReportSchedule.create(scheduleData);
      await AuditLogger.log('created', 'ReportSchedule', created.id, `Automation for ${scheduleData.report_name}`);
      
      toast({ title: "Schedule Saved!", description: "Your report will be sent automatically." });
      onScheduleCreated(created); // Callback to update parent state
      // Reset form
      setNewSchedule({ report_name: '', frequency: 'monthly', recipients: '', schedule_time: '09:00', schedule_day: 1 });
    } catch (error) {
      console.error("Failed to save schedule:", error);
      toast({ title: "Error", description: "Could not save the schedule.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Repeat className="w-5 h-5 text-indigo-600"/> Report Automation</CardTitle>
        <CardDescription>Set up recurring financial reports to be sent to your email.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="report_name" className="flex items-center gap-1"><FileText className="w-4 h-4"/>Report</Label>
          <Select onValueChange={(val) => setNewSchedule(p => ({...p, report_name: val}))} value={newSchedule.report_name}>
            <SelectTrigger><SelectValue placeholder="Select a report..." /></SelectTrigger>
            <SelectContent>
              {reportOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequency" className="flex items-center gap-1"><Calendar className="w-4 h-4"/>Frequency</Label>
          <Select onValueChange={(val) => setNewSchedule(p => ({...p, frequency: val}))} value={newSchedule.frequency}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 col-span-1 md:col-span-2">
          <Label htmlFor="recipients" className="flex items-center gap-1"><Users className="w-4 h-4"/>Recipients</Label>
          <Input id="recipients" placeholder="Enter emails, separated by commas" value={newSchedule.recipients} onChange={e => setNewSchedule(p => ({...p, recipients: e.target.value}))}/>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Schedule'}
        </Button>
      </CardFooter>
    </Card>
  );
}