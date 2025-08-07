import { exchangeRates } from '@/api/functions';

/**
 * CurrencyService - Handles all currency-related operations
 * Provides exchange rate fetching, currency conversion, and formatting
 */
class CurrencyService {
    
    // Common world currencies with their symbols
    static COMMON_CURRENCIES = [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'KES', name: 'Kenyan Shilling', symbol: 'KES' },
        { code: 'UGX', name: 'Ugandan Shilling', symbol: 'UGX' },
        { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS' },
        { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
        { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
        { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
        { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
        { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
        { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
        { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
        { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
        { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
        { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
        { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
        { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
        { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
        { code: 'SAR', name: 'Saudi Riyal', symbol: 'SR' },
        { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' }
    ];

    /**
     * Get current exchange rate between two currencies
     */
    static async getCurrentExchangeRate(baseCurrency, targetCurrency) {
        try {
            const response = await exchangeRates({
                action: 'getCurrentRate',
                baseCurrency,
                targetCurrency
            });

            if (response.data.success) {
                return {
                    success: true,
                    rate: response.data.rate,
                    lastUpdate: response.data.lastUpdate
                };
            } else {
                return {
                    success: false,
                    error: response.data.error
                };
            }
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            return {
                success: false,
                error: 'Failed to fetch exchange rate'
            };
        }
    }

    /**
     * Convert amount from one currency to another
     */
    static async convertAmount(amount, fromCurrency, toCurrency) {
        try {
            const response = await exchangeRates({
                action: 'convertAmount',
                baseCurrency: fromCurrency,
                targetCurrency: toCurrency,
                amount: amount
            });

            if (response.data.success) {
                return {
                    success: true,
                    originalAmount: response.data.originalAmount,
                    convertedAmount: response.data.convertedAmount,
                    rate: response.data.rate
                };
            } else {
                return {
                    success: false,
                    error: response.data.error
                };
            }
        } catch (error) {
            console.error('Error converting amount:', error);
            return {
                success: false,
                error: 'Failed to convert amount'
            };
        }
    }

    /**
     * Format currency amount with proper symbol and locale
     */
    static formatCurrency(amount, currencyCode, locale = 'en-US') {
        const currency = this.COMMON_CURRENCIES.find(c => c.code === currencyCode);
        
        if (!currency) {
            return `${currencyCode} ${amount.toLocaleString()}`;
        }

        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        } catch (error) {
            // Fallback formatting if Intl.NumberFormat fails
            return `${currency.symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }

    /**
     * Get currency symbol by code
     */
    static getCurrencySymbol(currencyCode) {
        const currency = this.COMMON_CURRENCIES.find(c => c.code === currencyCode);
        return currency ? currency.symbol : currencyCode;
    }

    /**
     * Get currency name by code
     */
    static getCurrencyName(currencyCode) {
        const currency = this.COMMON_CURRENCIES.find(c => c.code === currencyCode);
        return currency ? currency.name : currencyCode;
    }

    /**
     * Detect base currency from user's country (geolocation)
     */
    static detectBaseCurrencyFromLocation(countryCode) {
        const countryToCurrency = {
            'KE': 'KES', // Kenya
            'UG': 'UGX', // Uganda
            'TZ': 'TZS', // Tanzania
            'ZA': 'ZAR', // South Africa
            'NG': 'NGN', // Nigeria
            'US': 'USD', // United States
            'GB': 'GBP', // United Kingdom
            'FR': 'EUR', 'DE': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', // Eurozone
            'JP': 'JPY', // Japan
            'CN': 'CNY', // China
            'IN': 'INR', // India
            'CA': 'CAD', // Canada
            'AU': 'AUD', // Australia
            'CH': 'CHF', // Switzerland
            'SE': 'SEK', // Sweden
            'NO': 'NOK', // Norway
            'DK': 'DKK', // Denmark
            'PL': 'PLN', // Poland
            'CZ': 'CZK', // Czech Republic
            'HU': 'HUF', // Hungary
            'RU': 'RUB', // Russia
            'BR': 'BRL', // Brazil
            'MX': 'MXN', // Mexico
            'AE': 'AED', // UAE
            'SA': 'SAR', // Saudi Arabia
            'EG': 'EGP'  // Egypt
        };

        return countryToCurrency[countryCode] || 'USD'; // Default to USD if country not found
    }

    /**
     * Get user's country from their IP (basic geolocation)
     */
    static async detectUserLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return {
                success: true,
                countryCode: data.country_code,
                country: data.country_name,
                baseCurrency: this.detectBaseCurrencyFromLocation(data.country_code)
            };
        } catch (error) {
            console.error('Error detecting location:', error);
            return {
                success: false,
                baseCurrency: 'KES' // Default to KES for AccouPro
            };
        }
    }

    /**
     * Get all supported currencies (fetched from API)
     */
    static async getAllSupportedCurrencies() {
        try {
            const response = await exchangeRates({
                action: 'getSupportedCurrencies'
            });

            if (response.data.success) {
                return {
                    success: true,
                    currencies: response.data.currencies.map(([code, name]) => ({
                        code,
                        name,
                        symbol: this.getCurrencySymbol(code)
                    }))
                };
            } else {
                // Fallback to our common currencies
                return {
                    success: true,
                    currencies: this.COMMON_CURRENCIES
                };
            }
        } catch (error) {
            console.error('Error fetching supported currencies:', error);
            return {
                success: true,
                currencies: this.COMMON_CURRENCIES
            };
        }
    }
}

export default CurrencyService;