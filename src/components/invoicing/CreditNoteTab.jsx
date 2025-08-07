
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CreditNoteList from './CreditNoteList';
import CreditNoteForm from './CreditNoteForm';

const TABS = {
    LIST: 'list',
    FORM: 'form'
};

export default function CreditNoteTab({ creditNotes, invoices, customers, onRefresh }) {
    const [view, setView] = useState(TABS.LIST);
    const [selectedCreditNote, setSelectedCreditNote] = useState(null);

    const handleCreateNew = () => {
        setSelectedCreditNote(null);
        setView(TABS.FORM);
    };

    const handleEdit = (cn) => {
        setSelectedCreditNote(cn);
        setView(TABS.FORM);
    };

    const handleSuccess = () => {
        setView(TABS.LIST);
        onRefresh();
    };

    const handleCancel = () => {
        setView(TABS.LIST);
    };

    return (
        <div>
            {view === TABS.LIST && (
                 <CreditNoteList 
                    creditNotes={creditNotes} 
                    onEdit={handleEdit} 
                    onCreateNew={handleCreateNew} 
                />
            )}

            {view === TABS.FORM && (
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>{selectedCreditNote ? 'Edit Credit Note' : 'Create New Credit Note'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <CreditNoteForm 
                                creditNote={selectedCreditNote}
                                onSuccess={handleSuccess} 
                                onCancel={handleCancel}
                                invoices={invoices} // Pass invoices down
                                customers={customers} // Pass customers down
                            />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
