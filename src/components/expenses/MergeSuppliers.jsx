import React, { useState, useMemo } from 'react';
import { Supplier } from "@/api/entities";
import { Expense } from "@/api/entities";
import AuditLogger from '../utils/AuditLogger';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Combine, AlertTriangle } from 'lucide-react';

export default function MergeSuppliers({ suppliers, onCancel, onMergeComplete }) {
  const [primarySupplierId, setPrimarySupplierId] = useState(null);
  const [duplicateSupplierIds, setDuplicateSupplierIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const primarySupplier = useMemo(() => suppliers.find(s => s.id === primarySupplierId), [primarySupplierId, suppliers]);
  const duplicateSuppliers = useMemo(() => suppliers.filter(s => duplicateSupplierIds.includes(s.id)), [duplicateSupplierIds, suppliers]);

  const handleSelectDuplicate = (supplierId) => {
    setDuplicateSupplierIds(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };
  
  const handleMerge = async () => {
    if (!primarySupplier || duplicateSuppliers.length === 0) {
      toast({ title: "Selection Missing", description: "Please select a primary supplier and at least one duplicate.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    try {
      for (const duplicate of duplicateSuppliers) {
        await Expense.update({ supplier_id: duplicate.id }, { supplier_id: primarySupplier.id });
      }

      await AuditLogger.logMerge('Supplier', primarySupplier, duplicateSuppliers);

      for (const duplicate of duplicateSuppliers) {
        await Supplier.delete(duplicate.id);
      }

      toast({ title: "Merge Successful", description: `${duplicateSuppliers.length} supplier(s) were merged into ${primarySupplier.supplier_name}.` });
      onMergeComplete();

    } catch (error) {
      console.error("Merge failed:", error);
      toast({ title: "Merge Failed", description: "An error occurred while merging suppliers.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Combine className="w-6 h-6 text-blue-600" />
          Merge Duplicate Suppliers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-700">1. Select Primary Supplier (To Keep)</h3>
            <Select onValueChange={setPrimarySupplierId} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Choose a supplier..." /></SelectTrigger>
              <SelectContent>
                {suppliers
                  .filter(s => !duplicateSupplierIds.includes(s.id))
                  .map(s => <SelectItem key={s.id} value={s.id}>{s.supplier_name}</SelectItem>)}
              </SelectContent>
            </Select>
            {primarySupplier && (
              <Card className="mt-2 p-4 bg-slate-50">
                <p className="font-bold">{primarySupplier.supplier_name}</p>
                <p className="text-sm text-slate-600">{primarySupplier.contact_email}</p>
              </Card>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-700">2. Select Duplicates (To Merge & Delete)</h3>
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="space-y-1">
                {suppliers
                  .filter(s => s.id !== primarySupplierId)
                  .map(s => (
                    <div 
                      key={s.id}
                      onClick={() => !isLoading && handleSelectDuplicate(s.id)}
                      className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${duplicateSupplierIds.includes(s.id) ? 'bg-blue-100' : 'hover:bg-slate-50'}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={duplicateSupplierIds.includes(s.id)} 
                        readOnly
                        className="mr-3"
                      />
                      <p>{s.supplier_name}</p>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            This action is irreversible. All expenses from the duplicate supplier(s) will be reassigned to the primary supplier. The duplicate supplier records will then be permanently deleted.
          </AlertDescription>
        </Alert>

      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button 
          onClick={handleMerge} 
          disabled={isLoading || !primarySupplier || duplicateSuppliers.length === 0}
          className="bg-red-600 hover:bg-red-700"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Combine className="w-4 h-4 mr-2"/>}
          Merge {duplicateSuppliers.length} Supplier(s)
        </Button>
      </CardFooter>
    </Card>
  );
}