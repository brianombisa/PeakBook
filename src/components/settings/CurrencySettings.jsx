import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CompanyProfile } from '@/api/entities';
import CurrencyService from '../services/CurrencyService';
import { useToast } from '@/components/ui/use-toast';
import { Globe, DollarSign, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function CurrencySettings({ companyProfile, onUpdate }) {
    const [settings, setSettings] = useState({
        base_currency: companyProfile?.base_currency || 'KES',
        currency_display_format: companyProfile?.currency_display_format || 'symbol',
        auto_currency_conversion: companyProfile?.auto_currency_conversion !== false,
        default_exchange_rate_source: companyProfile?.default_exchange_rate_source || 'api'
    });
    const [availableCurrencies, setAvailableCurrencies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [sampleRate, setSampleRate] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        loadCurrencies();
    }, []);

    useEffect(() => {
        // Get sample exchange rate when base currency changes
        if (settings.base_currency !== 'USD') {
            getSampleExchangeRate();
        }
    }, [settings.base_currency]);

    const loadCurrencies = async () => {
        setIsLoading(true);
        try {
            const result = await CurrencyService.getAllSupportedCurrencies();
            if (result.success) {
                setAvailableCurrencies(result.currencies);
            }
        } catch (error) {
            console.error('Error loading currencies:', error);
            // Fallback to common currencies
            setAvailableCurrencies(CurrencyService.COMMON_CURRENCIES);
        } finally {
            setIsLoading(false);
        }
    };

    const getSampleExchangeRate = async () => {
        try {
            const result = await CurrencyService.getCurrentExchangeRate('USD', settings.base_currency);
            if (result.success) {
                setSampleRate(result.rate);
            }
        } catch (error) {
            console.error('Error fetching sample rate:', error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await CompanyProfile.update(companyProfile.id, settings);
            onUpdate(settings);
            toast({
                title: "Currency Settings Updated",
                description: "Your currency preferences have been saved successfully.",
                className: "bg-green-50 border-green-200 text-green-800"
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save currency settings.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const detectLocation = async () => {
        setIsLoading(true);
        try {
            const location = await CurrencyService.detectUserLocation();
            if (location.success && location.baseCurrency) {
                setSettings(prev => ({
                    ...prev,
                    base_currency: location.baseCurrency
                }));
                toast({
                    title: "Location Detected",
                    description: `Base currency set to ${location.baseCurrency} based on your location (${location.country}).`,
                    className: "bg-blue-50 border-blue-200 text-blue-800"
                });
            } else {
                toast({
                    title: "Detection Failed",
                    description: "Could not detect your location. Please select your currency manually.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to detect location.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatSampleAmount = (amount, currency) => {
        return CurrencyService.formatCurrency(amount, currency);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Multi-Currency Settings
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Configure how your business handles multiple currencies and exchange rates.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Base Currency Selection */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Base Currency</Label>
                    <p className="text-sm text-muted-foreground">
                        Your primary business currency. All reports and financial statements will be consolidated in this currency.
                    </p>
                    <div className="flex gap-3">
                        <Select
                            value={settings.base_currency}
                            onValueChange={(value) => setSettings(prev => ({ ...prev, base_currency: value }))}
                        >
                            <SelectTrigger className="w-64">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCurrencies.map((currency) => (
                                    <SelectItem key={currency.code} value={currency.code}>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm">{currency.symbol}</span>
                                            <span>{currency.code}</span>
                                            <span className="text-muted-foreground">- {currency.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button 
                            variant="outline" 
                            onClick={detectLocation}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Globe className="w-4 h-4" />
                            )}
                            Auto-Detect
                        </Button>
                    </div>
                    {sampleRate && settings.base_currency !== 'USD' && (
                        <div className="text-sm text-muted-foreground">
                            Current rate: 1 USD = {sampleRate.toFixed(4)} {settings.base_currency}
                        </div>
                    )}
                </div>

                <Separator />

                {/* Currency Display Format */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Currency Display Format</Label>
                    <Select
                        value={settings.currency_display_format}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, currency_display_format: value }))}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="symbol">Symbol Only (e.g., $1,234.56)</SelectItem>
                            <SelectItem value="code">Code Only (e.g., USD 1,234.56)</SelectItem>
                            <SelectItem value="both">Symbol + Code (e.g., $1,234.56 USD)</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="text-sm text-muted-foreground">
                        Preview: {formatSampleAmount(1234.56, settings.base_currency)}
                    </div>
                </div>

                <Separator />

                {/* Auto Currency Conversion */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base font-medium">Automatic Currency Conversion</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically fetch real-time exchange rates for foreign currency transactions.
                            </p>
                        </div>
                        <Switch
                            checked={settings.auto_currency_conversion}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_currency_conversion: checked }))}
                        />
                    </div>
                    
                    {settings.auto_currency_conversion && (
                        <div className="ml-4 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 text-green-800 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                Exchange rates will be fetched automatically when creating invoices and expenses in foreign currencies.
                            </div>
                        </div>
                    )}
                    
                    {!settings.auto_currency_conversion && (
                        <div className="ml-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="flex items-center gap-2 text-amber-800 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                You will need to manually enter exchange rates for foreign currency transactions.
                            </div>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Exchange Rate Source */}
                {settings.auto_currency_conversion && (
                    <div className="space-y-3">
                        <Label className="text-base font-medium">Default Exchange Rate Source</Label>
                        <Select
                            value={settings.default_exchange_rate_source}
                            onValueChange={(value) => setSettings(prev => ({ ...prev, default_exchange_rate_source: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="api">
                                    <div className="space-y-1">
                                        <div>Live API Rates (Recommended)</div>
                                        <div className="text-xs text-muted-foreground">
                                            Real-time rates from ExchangeRate-API
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="manual">
                                    <div className="space-y-1">
                                        <div>Manual Entry</div>
                                        <div className="text-xs text-muted-foreground">
                                            Enter rates manually for each transaction
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="bank">
                                    <div className="space-y-1">
                                        <div>Bank Rates</div>
                                        <div className="text-xs text-muted-foreground">
                                            Use your bank's published rates
                                        </div>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <Separator />

                {/* Important Notes */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Changing your base currency only affects new transactions</li>
                        <li>• Existing transactions will retain their original currencies and rates</li>
                        <li>• All financial reports will be consolidated in your base currency</li>
                        <li>• Exchange rates are locked to each transaction for audit compliance</li>
                    </ul>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Save Currency Settings
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}