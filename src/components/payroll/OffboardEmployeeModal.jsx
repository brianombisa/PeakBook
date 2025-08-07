
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast"; // Added import for useToast
import { Employee } from '@/lib/api/employee'; // Assuming this path for Employee API
import { AuditLogger } from '@/lib/audit-logger'; // Assuming this path for AuditLogger

export default function OffboardEmployeeModal({ isOpen, onClose, employee, onSuccess }) {
    const [reason, setReason] = useState("");
    const [terminationDate, setTerminationDate] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    if (!employee) return null;

    const handleSubmit = async () => {
        if (!reason) {
            toast({ title: "Reason required", description: "Please select a reason for offboarding.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await Employee.update(employee.id, {
                is_active: false,
                termination_date: terminationDate.toISOString().split('T')[0],
                termination_reason: reason
            });

            await AuditLogger.log('updated', 'Employee', employee.id, `Offboarded employee. Reason: ${reason}`);

            toast({ title: "Employee Offboarded", description: `${employee.full_name} has been marked as inactive.` });
            onSuccess();
            onClose(); // Close the modal on success
        } catch (error) {
            console.error("Failed to offboard employee:", error);
            toast({ title: "Error", description: "Could not offboard employee. Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Offboard {employee.full_name}</DialogTitle>
                    <DialogDescription>
                        Select the reason and date of termination. This will mark the employee as inactive.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="termination_reason">Reason for Offboarding</Label>
                        <Select onValueChange={setReason} defaultValue={reason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="resigned">Resigned</SelectItem>
                                <SelectItem value="terminated">Terminated</SelectItem>
                                <SelectItem value="dismissed">Dismissed</SelectItem>
                                <SelectItem value="deceased">Deceased</SelectItem>
                                <SelectItem value="contract_ended">Contract Ended</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="termination-date">Termination Date</Label>
                        <Input
                            id="termination-date"
                            type="date"
                            value={terminationDate.toISOString().split('T')[0]}
                            onChange={e => setTerminationDate(new Date(e.target.value))}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Offboarding
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
