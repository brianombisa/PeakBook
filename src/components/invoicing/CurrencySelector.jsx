import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CurrencyService from '../services/CurrencyService';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function CurrencySelector({ 
    selectedCurrency, 
    onCurrencyChange, 
    baseCurrency, 
    amount = 0,
    showConversion = true,
    autoFetchRate = true 
}) {
    const [availableCurrencies, setAvailableCurrencies] = useState([]);
    const [exchangeRate, setExchangeRate] = useState(1);
    const [baseAmount, setBaseAmount] = useState(0);
    const [isLoadingRate, setIsLoadingRate] = useState(false);
    const [rateError, setRateError] = useState(null);
    const [rateLastUpdated, setRateLastUpdated] = useState(null);

    useEffect(() => {
        loadCurrencies();
    }, []);

    useEffect(() => {
        if (selectedCurrency && selectedCurrency !== baseCurrency && amount > 0 && autoFetchRate) {
            fetchExchangeRate();
        } else if (selectedCurrency === baseCurrency) {
            setExchangeRate(1);
            setBaseAmount(amount);
            setRateError(null);
        }
    }, [selectedCurrency, baseCurrency, amount, autoFetchRate]);

    const loadCurrencies = async () => {
        try {
            const result = await CurrencyService.getAllSupportedCurrencies();
            if (result.success) {
                setAvailableCurrencies(result.currencies);
            }
        } catch (error) {
            console.error('Error loading currencies:', error);
            setAvailableCurrencies(CurrencyService.COMMON_CURRENCIES);
        }
    };

    const fetchExchangeRate = async () => {
        if (!selectedCurrency || selectedCurrency === baseCurrency) return;

        setIsLoadingRate(true);
        setRateError(null);

        try {
            const result = await CurrencyService.getCurrentExchangeRate(selectedCurrency, baseCurrency);
            if (result.success) {
                setExchangeRate(result.rate);
                setBaseAmount(amount * result.rate);
                setRateLastUpdated(new Date().toLocaleTimeString());
                
                // Notify parent component of the exchange rate
                if (onCurrencyChange) {
                    onCurrencyChange({
                        currency: selectedCurrency,
                        exchangeRate: result.rate,
                        baseAmount: amount * result.rate
                    });
                }
            } else {
                setRateError(result.error);
                setExchangeRate(1);
                setBaseAmount(amount);
            }
        } catch (error) {
            setRateError('Failed to fetch exchange rate');
            setExchangeRate(1);
            setBaseAmount(amount);
        } finally {
            setIsLoadingRate(false);
        }
    };

    const handleCurrencyChange = (currency) => {
        if (onCurrencyChange) {
            onCurrencyChange({
                currency,
                exchangeRate: currency === baseCurrency ? 1 : exchangeRate,
                baseAmount: currency === baseCurrency ? amount : baseAmount
            });
        }
    };

    const handleManualRateChange = (newRate) => {
        const rate = parseFloat(newRate) || 1;
        setExchangeRate(rate);
        setBaseAmount(amount * rate);
        
        if (onCurrencyChange) {
            onCurrencyChange({
                currency: selectedCurrency,
                exchangeRate: rate,
                baseAmount: amount * rate
            });
        }
    };

    const isForeignCurrency = selectedCurrency && selectedCurrency !== baseCurrency;

    return (
        <div className="space-y-4">
            {/* Currency Selection */}
            <div className="space-y-2">
                <Label>Invoice Currency</Label>
                <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select currency">
                            {selectedCurrency && (
                                <div className="flex items-center gap-2">
                                    <span className="font-mono">
                                        {CurrencyService.getCurrencySymbol(selectedCurrency)}
                                    </span>
                                    <span>{selectedCurrency}</span>
                                    {selectedCurrency === baseCurrency && (
                                        <Badge variant="secondary" className="text-xs">Base</Badge>
                                    )}
                                </div>
                            )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {availableCurrencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm min-w-8">
                                        {currency.symbol}
                                    </span>
                                    <span className="font-medium">{currency.code}</span>
                                    <span className="text-muted-foreground">- {currency.name}</span>
                                    {currency.code === baseCurrency && (
                                        <Badge variant="secondary" className="text-xs ml-2">Base</Badge>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Exchange Rate Section */}
            {isForeignCurrency && showConversion && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Exchange Rate</Label>
                        {autoFetchRate && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchExchangeRate}
                                disabled={isLoadingRate}
                            >
                                {isLoadingRate ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3 h-3" />
                                )}
                                Refresh
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">1 {selectedCurrency} =</span>
                        <Input
                            type="number"
                            step="0.0001"
                            value={exchangeRate}
                            onChange={(e) => handleManualRateChange(e.target.value)}
                            className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">{baseCurrency}</span>
                    </div>

                    {rateLastUpdated && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Last updated: {rateLastUpdated}
                        </div>
                    )}

                    {rateError && (
                        <Alert className="border-amber-200 bg-amber-50">
                            <AlertCircle className="w-4 h-4" />
                            <AlertDescription className="text-amber-800">
                                {rateError}. Please enter the exchange rate manually.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Conversion Display */}
                    {amount > 0 && (
                        <div className="pt-2 border-t">
                            <div className="text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Invoice Total:</span>
                                    <span className="font-medium">
                                        {CurrencyService.formatCurrency(amount, selectedCurrency)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Base Currency ({baseCurrency}):</span>
                                    <span className="font-medium">
                                        {CurrencyService.formatCurrency(baseAmount, baseCurrency)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}