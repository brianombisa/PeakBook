
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, Code, Zap, Globe, Shield, Building2 } from 'lucide-react'; // Added Building2

export default function MobilePreview() {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* New Branding Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">PeakBooks</h1>
                            <p className="text-xs text-blue-100">Mobile</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                        <Smartphone className="w-12 h-12 text-white" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-slate-800">PeakBooks Mobile App</h1> {/* Changed from AccouPro */}
                <p className="text-xl text-slate-600">Take your accounting business on the go</p>
                <Badge className="bg-green-100 text-green-800 px-4 py-2">
                    API Foundation Complete ✓
                </Badge>
            </div>

            {/* Mobile Features */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-blue-600" />
                            Real-time Sync
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600">
                            All data syncs instantly between web and mobile. Create an invoice on your phone, 
                            see it immediately on your desktop.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-green-600" />
                            Offline Capable
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600">
                            Work without internet connection. Data syncs automatically when you're back online.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-purple-600" />
                            Enterprise Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600">
                            Bank-level encryption and security. Your financial data is protected with the same 
                            standards as major financial institutions.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="w-5 h-5 text-orange-600" />
                            Native Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600">
                            Built specifically for iOS and Android for the fastest, most responsive experience possible.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Mobile Screens Preview */}
            <div className="bg-gradient-to-br from-slate-100 to-blue-50 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-center mb-8">Mobile Experience Preview</h2>
                <div className="flex justify-center space-x-8">
                    {/* Phone mockup 1 - Dashboard */}
                    <div className="bg-black rounded-3xl p-2 shadow-2xl">
                        <div className="bg-white rounded-2xl p-4 w-64 h-96 overflow-hidden">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg">Dashboard</h3>
                                    <Badge className="bg-green-100 text-green-800 text-xs">Live</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-xs text-slate-600">Revenue</p>
                                        <p className="font-bold text-blue-600">KES 245K</p>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-lg">
                                        <p className="text-xs text-slate-600">Expenses</p>
                                        <p className="font-bold text-red-600">KES 89K</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <p className="text-xs text-slate-600">Profit</p>
                                        <p className="font-bold text-green-600">KES 156K</p>
                                    </div>
                                    <div className="bg-yellow-50 p-3 rounded-lg">
                                        <p className="text-xs text-slate-600">Outstanding</p>
                                        <p className="font-bold text-yellow-600">KES 34K</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Recent Invoices</p>
                                    <div className="space-y-1">
                                        <div className="bg-slate-50 p-2 rounded text-xs">
                                            <p className="font-medium">INV-1045 - Acme Corp</p>
                                            <p className="text-slate-500">KES 25,000</p>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded text-xs">
                                            <p className="font-medium">INV-1044 - Tech Ltd</p>
                                            <p className="text-slate-500">KES 18,500</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phone mockup 2 - Create Invoice */}
                    <div className="bg-black rounded-3xl p-2 shadow-2xl">
                        <div className="bg-white rounded-2xl p-4 w-64 h-96 overflow-hidden">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg">New Invoice</h3>
                                    <Button className="bg-blue-600 text-white text-xs px-3 py-1">Save</Button>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Customer</p>
                                        <div className="border rounded p-2 bg-slate-50">
                                            <p className="text-sm">Acme Corporation</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Amount</p>
                                        <div className="border rounded p-2">
                                            <p className="text-sm">KES 50,000</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Description</p>
                                        <div className="border rounded p-2 h-16 bg-slate-50">
                                            <p className="text-xs text-slate-500">Web development services...</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" className="text-xs">Save Draft</Button>
                                        <Button className="bg-green-600 text-white text-xs">Send Invoice</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Next Steps */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                    <CardTitle>Ready for Mobile Development</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-slate-700">
                        The complete API foundation is now ready! Here's what we've built:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-slate-800">✅ Complete APIs</h4>
                            <ul className="text-sm text-slate-600 space-y-1">
                                <li>• Invoice management (CRUD + stats)</li>
                                <li>• Expense tracking with AI</li>
                                <li>• Customer relationships</li>
                                <li>• Dashboard data & analytics</li>
                                <li>• Financial reports</li>
                                <li>• Real-time synchronization</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-slate-800">🔄 Next Phase</h4>
                            <ul className="text-sm text-slate-600 space-y-1">
                                <li>• Mobile app development starts</li>
                                <li>• iOS & Android native apps</li>
                                <li>• App Store deployment</li>
                                <li>• Push notifications</li>
                                <li>• Offline functionality</li>
                                <li>• Mobile-specific features</li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-4 border-t">
                        <p className="text-sm text-slate-600">
                            <strong>For Mobile Developers:</strong> Complete API documentation and integration 
                            examples are available in the <code className="bg-slate-200 px-2 py-1 rounded">api/index.js</code> file.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
