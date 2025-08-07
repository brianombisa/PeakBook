import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Send, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ScheduledTransaction } from "@/api/entities";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ScheduleTransactionModal({ 
  isOpen, 
  onClose, 
  transactionType, 
  transactionData, 
  recipientEmail 
}) {
  const [scheduledDate, setScheduledDate] = useState();
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [deliveryMethod, setDeliveryMethod] = useState('email');
  const [notes, setNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const { toast } = useToast();

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time for scheduling.",
        variant: "destructive"
      });
      return;
    }

    // Combine date and time
    const scheduledDateTime = new Date(scheduledDate);
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    // Check if scheduled time is in the future
    if (scheduledDateTime <= new Date()) {
      toast({
        title: "Invalid Schedule Time",
        description: "Scheduled time must be in the future.",
        variant: "destructive"
      });
      return;
    }

    setIsScheduling(true);
    try {
      await ScheduledTransaction.create({
        transaction_type: transactionType,
        scheduled_date: scheduledDateTime.toISOString(),
        scheduled_time: scheduledTime,
        transaction_data: transactionData,
        delivery_method: deliveryMethod,
        recipient_email: recipientEmail,
        notes: notes,
        status: 'scheduled'
      });

      toast({
        title: "Transaction Scheduled",
        description: `${transactionType} will be delivered on ${format(scheduledDateTime, 'PPP')} at ${scheduledTime}`,
      });

      onClose();
    } catch (error) {
      console.error("Error scheduling transaction:", error);
      toast({
        title: "Scheduling Failed",
        description: "Could not schedule the transaction. Please try again.",
        variant: "destructive"
      });
    }
    setIsScheduling(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Schedule {transactionType} Delivery
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Alert>
            <CalendarIcon className="h-4 w-4" />
            <AlertDescription>
              This {transactionType} will be automatically created and delivered at the scheduled time.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Delivery Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? format(scheduledDate, "PPP") : "Select date..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  disabled={(date) => date <= new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Delivery Time</Label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Delivery Method</Label>
            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email Only</SelectItem>
                <SelectItem value="auto_post">Auto-Post to System</SelectItem>
                <SelectItem value="both">Email + Auto-Post</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Recipient Email</Label>
            <Input
              type="email"
              value={recipientEmail}
              readOnly
              className="bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions..."
              className="h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isScheduling}>
            {isScheduling ? (
              <>Scheduling...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Schedule Delivery
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}