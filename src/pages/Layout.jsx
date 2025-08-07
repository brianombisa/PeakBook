

import React, { useState, useEffect } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { CompanyProfile } from "@/api/entities"; // Added CompanyProfile import
import AuditLogger from "./components/utils/AuditLogger";
import {
  Building2,
  LayoutDashboard,
  Receipt,
  FileText,
  CreditCard,
  Users,
  Package,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  ChevronDown,
  FileArchive,
  Landmark,
  Bell,
  Search,
  Plus,
  Star,
  Layers,
  Clock,
  Smartphone,
  DollarSign,
  Store,
  ShoppingCart,
  User as UserIcon,
  FileClock,
  Megaphone,
  Gift, // Add Gift icon for referrals
  Shield, // Added Shield import for Admin Portal icon
  Trophy, // Added Trophy icon for PeakPoints
  AlertTriangle, // Added for ErrorBoundary
  RefreshCw, // Added for ErrorBoundary
  FileText as FileTextIcon, // Rename to avoid conflict
  Receipt as ReceiptIcon,
  UserPlus as UserPlusIcon,
  BrainCircuit, // Added for AI Features
  Repeat // Added for Bank Reconciliation
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card components for error handling
import { ThemeProvider, useTheme } from "./components/ThemeProvider";
import ThemeSwitcher from "./components/ThemeSwitcher";
import SEO from "./components/utils/SEO";
import { useToast } from '@/components/ui/use-toast';
import QuickAddModal from './components/utils/QuickAddModal'; // Import the new modal

// Core Business Application Navigation (No Admin Features)
const coreModules = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    description: "Business overview & insights"
  },
  {
    title: "Invoicing",
    url: createPageUrl("Invoicing"),
    icon: FileText,
    description: "Bills & payments"
  },
  {
    title: "Expenses",
    url: createPageUrl("Expenses"),
    icon: CreditCard,
    description: "Track spending"
  },
  {
    title: "Inventory",
    url: createPageUrl("Inventory"),
    icon: Package,
    description: "Items, stock & purchasing"
  },
  {
    title: "Transactions",
    url: createPageUrl("Transactions"),
    icon: Receipt,
    description: "Record & manage"
  }
];

const advancedModules = [
  {
    title: "KRA Tax Center",
    url: createPageUrl("KRATaxCenter"),
    icon: Shield,
    description: "Automated tax returns",
    badge: "AUTO"
  },
  {
    title: "M-Pesa Hub",
    url: createPageUrl("MPesaIntegration"),
    icon: Smartphone,
    description: "Connect & reconcile M-Pesa",
    badge: "NEW"
  },
  {
    title: "PeakBooks Capital",
    url: createPageUrl("PeakBooksCapital"),
    icon: DollarSign,
    description: "Access business loans",
    badge: "BETA"
  },
  {
    title: "Bank Reconciliation",
    url: createPageUrl("BankReconciliation"),
    icon: Repeat,
    description: "Match bank transactions",
    badge: "AI"
  },
  {
    title: "Reports",
    url: createPageUrl("Reports"),
    icon: BarChart3,
    description: "Financial reports"
  },
  {
    title: "Payroll",
    url: createPageUrl("Payroll"),
    icon: Users,
    description: "Employee management"
  },
  {
    title: "Scheduled Transactions",
    url: createPageUrl("ScheduledTransactions"),
    icon: Clock,
    description: "Automate recurring entries"
  }
];

const businessModules = [
  {
    title: "Subscription Management",
    url: createPageUrl("SubscriptionManagement"),
    icon: CreditCard,
    description: "Manage your plan & billing"
  },
  {
    title: "Referrals & Rewards",
    url: createPageUrl("Referrals"),
    icon: Gift,
    description: "Earn free months"
  }
];

const intelligenceModules = [
  {
    title: "Cash Flow Forecast",
    url: createPageUrl("CashFlowForecast"),
    icon: BrainCircuit,
    description: "AI-powered cash prediction"
  }
];

const systemModules = [
  {
    title: "Audit Trail",
    url: createPageUrl("AuditLog"),
    icon: FileArchive,
    description: "Activity logs"
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
    description: "Users & company profile"
  }
];

// Helper component for menu sections
const MenuSection = ({ title, items, icon: SectionIcon, location }) => (
  <SidebarGroup>
    <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 flex items-center gap-2">
      <SectionIcon className="w-3 h-3" />
      {title}
    </SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu className="space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link
                  to={item.url}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md transform scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className={`p-1.5 rounded-md transition-colors ${
                    isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'
                  }`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{item.title}</span>
                      {item.badge && (
                        <Badge className={`text-xs px-1.5 py-0.5 border-0 shrink-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white`}>
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-xs truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
);

// PeakBooks Business Application Sidebar (Clean, Business-Focused)
const BusinessSidebar = ({ user, isCollapsed, handleLogout, location }) => {
  return (
    <Sidebar
      className={`border-r-0 bg-gradient-to-b from-white to-slate-50/80 backdrop-blur-sm shadow-xl no-print ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300`}
      isCollapsed={isCollapsed}
    >
      <SidebarHeader className="border-b border-slate-200/60 p-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <Building2 className="w-7 h-7 text-white transform -rotate-3" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-2xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                PeakBooks
              </h2>
              <p className="text-xs text-slate-500 font-medium">Business Accounting Suite</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 space-y-6">
        <MenuSection title="Core" items={coreModules} icon={Star} location={location} />
        <MenuSection title="Intelligence" items={intelligenceModules} icon={BrainCircuit} location={location} />
        <MenuSection title="Advanced" items={advancedModules} icon={Layers} location={location} />
        <MenuSection title="Business" items={businessModules} icon={CreditCard} location={location} />
        <MenuSection title="System" items={systemModules} icon={Settings} location={location} />
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200/60 p-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-white/60 rounded-xl">
                <div className="flex items-center gap-3 w-full">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-sm">
                        {user.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-sm truncate text-slate-700">{user.full_name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-sm border-slate-200">
              <div className="p-3 border-b border-slate-100">
                <p className="font-semibold text-slate-800">{user.full_name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <ThemeSwitcher />
              {user && (user.role === 'admin' || user.email === 'admin@peakbooks.app') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = createPageUrl('AdminPortal')}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Portal</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

// Define public pages that don't require authentication
const publicPages = ['Home', 'Referrals']; // Added Referrals to public for sharing

// Error Boundary Component
const ErrorBoundary = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (err) => {
      console.error('Application Error:', err);
      setError(err);
      setHasError(true);
    };

    // Catch synchronous errors
    const syncErrorHandler = (event) => {
      handleError(event.error || new Error(event.message || 'Unknown synchronous error'));
      event.preventDefault(); // Prevent default browser error reporting
    };

    // Catch unhandled promise rejections
    const promiseRejectionHandler = (event) => {
      handleError(event.reason || new Error('Unknown promise rejection'));
      event.preventDefault(); // Prevent default browser error reporting
    };

    window.addEventListener('error', syncErrorHandler);
    window.addEventListener('unhandledrejection', promiseRejectionHandler);

    return () => {
      window.removeEventListener('error', syncErrorHandler);
      window.removeEventListener('unhandledrejection', promiseRejectionHandler);
    };
  }, []);

  if (hasError) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle>Application Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              We're experiencing technical difficulties. Please try refreshing the page.
            </p>
            <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded break-all">
              Error: {error?.message || 'Unknown error occurred'}
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
};


const MainLayout = ({ children, currentPageName }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null); // New state for company profile
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [appError, setAppError] = useState(null); // New state for specific app errors
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false); // State for modal
  const [quickAddView, setQuickAddView] = useState('invoice'); // State for initial tab
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        // Add some debugging information
        console.log('Current URL:', window.location.href);
        console.log('Current pathname:', location.pathname);
        // Ensure BASE44_APP_ID is available globally, e.g., via process.env in Next.js or exposed in index.html
        if (typeof window !== 'undefined' && window.BASE44_APP_ID) {
            console.log('App ID from environment:', window.BASE44_APP_ID);
        } else {
            console.log('App ID not found in window.BASE44_APP_ID');
        }

        const userData = await User.me();
        setUser(userData);

        // Fetch company profile
        const profiles = await CompanyProfile.filter({ created_by: userData.email });
        if (profiles.length > 0) {
          setCompanyProfile(profiles[0]);
        }

        // Attempt to log login, but don't let it break the flow
        try {
          await AuditLogger.logLogin();
        } catch (auditError) {
          console.warn("Audit logging unavailable during login:", auditError.message);
        }

        setAppError(null); // Clear any previous specific app errors
      } catch (error) {
        console.error("Error in fetchUserAndProfile:", error);

        // Explicitly handle 403 Forbidden error for expired sessions
        if (error.message?.includes('403')) {
          setAppError({
            type: 'auth_error',
            message: 'Your session has expired or is invalid.',
            details: 'To protect your account, you have been logged out. Please log in again to continue.'
          });
          setIsLoading(false); // Stop loading spinner
          return; // Exit function to show the auth error message
        }

        // Handle specific app loading configuration error
        if (error.message?.includes('Either id or slug must be provided')) {
          setAppError({
            type: 'app_loading_error',
            message: 'Application configuration error. Please contact support.',
            details: error.message
          });

          // Try to recover by redirecting to home after a delay
          setTimeout(() => {
            window.location.href = createPageUrl('Home'); // Use createPageUrl for consistency
          }, 3000);

          return; // Stop further execution in this catch block
        }

        // Generic case for unauthenticated users (e.g., first visit)
        setUser(null);
        setCompanyProfile(null);
        console.warn("User not authenticated or session expired:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndProfile();
  }, [location.pathname]);

  const handleOpenQuickAdd = (view) => {
    setQuickAddView(view);
    setIsQuickAddOpen(true);
  };
  
  const handleLogoutAndLogin = async () => {
    try {
      await User.logout();
    } catch (e) {
      console.error("Logout failed during re-auth flow, but proceeding to login page anyway.", e);
    }
    // Redirect to the home page to trigger the login flow
    window.location.href = createPageUrl('Home');
  };

  const handleLogout = async () => {
    try {
      // Attempt to log logout, but don't let it block the logout process
      try {
        await AuditLogger.logLogout();
      } catch (auditError) {
          console.warn("Audit logging unavailable during logout:", auditError.message);
      }

      await User.logout();
      setUser(null);
      setCompanyProfile(null); // Clear company profile on logout
      toast({ title: "Logged out successfully.", description: "You have been securely signed out." });
      window.location.href = createPageUrl('Home');
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Logout Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
      // Force logout even if there's an error
      await User.logout();
      setUser(null);
      setCompanyProfile(null); // Ensure profile is cleared even on error
      window.location.href = createPageUrl('Home');
    }
  };

  // Show app error if present (e.g., configuration issue or auth error)
  if (appError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle>
                {appError.type === 'auth_error' ? 'Authentication Error' : 'App Loading Error'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              {appError.message}
            </p>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded break-all">
              <strong>Details:</strong><br />
              {appError.details}
            </div>
            {appError.type === 'auth_error' ? (
              <Button onClick={handleLogoutAndLogin} className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Logout & Login Again
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.href = createPageUrl('Home')}
                  className="flex-1"
                >
                  Go to Home
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading spinner UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin animation-delay-150 mx-auto"></div>
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">PeakBooks</h2>
          <p className="text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // --- NEW ONBOARDING LOGIC ---
  // If the user is logged in but has NOT set up their company profile yet,
  // redirect them to the Onboarding page. This happens only once.
  if (user && !companyProfile && currentPageName !== 'Onboarding') {
    return <Navigate to={createPageUrl('Onboarding')} replace />;
  }
  // --- END OF NEW ONBOARDING LOGIC ---


  // Authentication and Redirection Logic
  const isPublicPage = publicPages.includes(currentPageName) || currentPageName === 'Onboarding'; // Added 'Onboarding' to public pages check

  // If user is not logged in and tries to access a protected page, redirect to Home
  if (!user && !isPublicPage) {
    return <Navigate to={createPageUrl('Home')} replace />;
  }

  // If user is logged in and tries to access the Home page, redirect to Dashboard
  if (user && currentPageName === 'Home') {
    return <Navigate to={createPageUrl('Dashboard')} replace />;
  }

  // If it's a public page and the user is not logged in, render without layout
  if (isPublicPage && !user) {
    return <>{children}</>;
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <SEO
          title="PeakBooks | Professional Accounting Suite for Kenyan Businesses"
          description="The all-in-one cloud accounting platform for invoicing, expenses, payroll, and M-Pesa payments. Simplify your finances and grow your business with PeakBooks."
          keywords="accounting software, invoicing, expense tracking, payroll, kenya, m-pesa, smb accounting, cloud accounting, peakbooks"
          ogUrl="https://peakbooks.app"
          ogImage="https://images.unsplash.com/photo-1554224155-1696413565d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
        />
        <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-x-hidden">
          <BusinessSidebar
            user={user}
            isCollapsed={isSidebarCollapsed}
            handleLogout={handleLogout}
            location={location}
          />

          <main className={`flex-1 flex flex-col min-w-0 w-full`}>
            <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 shadow-sm no-print w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden hover:bg-slate-100 p-2 rounded-lg transition-colors"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                  <h1 className="text-xl font-semibold text-gray-800 hidden md:block">{currentPageName}</h1>
                  <div className="hidden md:flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Search transactions, invoices..."
                        className="pl-10 w-80 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2 bg-amber-100/60 text-amber-700 hover:bg-amber-100">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="font-bold">{companyProfile?.peak_points_balance || 0}</span>
                    <span>PeakPoints</span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2 bg-white hover:bg-slate-50">
                        <Plus className="w-4 h-4" />
                        Quick Add
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Create New</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleOpenQuickAdd('invoice')}>
                        <FileTextIcon className="mr-2 h-4 w-4" />
                        <span>Invoice</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenQuickAdd('expense')}>
                        <ReceiptIcon className="mr-2 h-4 w-4" />
                        <span>Expense</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenQuickAdd('customer')}>
                        <UserPlusIcon className="mr-2 h-4 w-4" />
                        <span>Customer</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="relative">
                        <Bell className="w-5 h-5" />
                        {notifications > 0 && (
                          <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 hover:bg-red-500">
                            {notifications}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                          <div className="flex items-start gap-3">
                              <div className="bg-green-100 text-green-700 p-2 rounded-full"><CreditCard size={16}/></div>
                              <div>
                                  <p className="font-medium text-sm">Invoice INV-2023-012 Paid</p>
                                  <p className="text-xs text-gray-500">ABC Limited just paid KES 25,000.</p>
                              </div>
                          </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                          <div className="flex items-start gap-3">
                              <div className="bg-yellow-100 text-yellow-700 p-2 rounded-full"><FileClock size={16}/></div>
                              <div>
                                  <p className="font-medium text-sm">VAT Return Due Soon</p>
                                  <p className="text-xs text-gray-500">Your monthly VAT return is due in 3 days.</p>
                              </div>
                          </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                           <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                               {user?.full_name?.charAt(0).toUpperCase()}
                           </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = createPageUrl('Settings')}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        {user && (user.role === 'admin' || user.email === 'admin@peakbooks.app') && (
                          <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => window.location.href = createPageUrl('AdminPortal')}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  <span>Admin Portal</span>
                              </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-auto w-full">
              {children}
            </div>
          </main>
        </div>
        
        {/* Render the modal at the layout level */}
        <QuickAddModal 
          open={isQuickAddOpen}
          onOpenChange={setIsQuickAddOpen}
          initialView={quickAddView}
        />
      </SidebarProvider>
    </ErrorBoundary>
  );
};

// The top-level Layout component that provides ThemeProvider
export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="peakbooks-theme">
      <MainLayout currentPageName={currentPageName}>{children}</MainLayout>
      <style jsx global>{`
        html, body {
          overflow-x: hidden !important;
          width: 100%;
          max-width: 100%;
        }

        * {
          box-sizing: border-box;
        }

        .min-w-0 {
          min-width: 0;
        }

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .animation-delay-150 {
          animation-delay: 0.15s;
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #a5b4fc, #818cf8);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #818cf8, #6366f1);
        }

        * {
          transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }

        button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid #818cf8;
          outline-offset: 2px;
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        h1, h2, h3, h4, h5, h6 {
          font-weight: 600;
          letter-spacing: -0.025em;
          color: #1e293b;
        }

        .text-gradient {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        h1, h2, h3 {
          position: relative;
          padding-bottom: 0.75rem;
          margin-bottom: 1.5rem;
        }

        h1::after, h2::after, h3::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 3px;
          background: linear-gradient(135deg, #818cf8, #6366f1);
          border-radius: 2px;
        }

        :root {
          --radius: 0.75rem;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          main, .flex-1.overflow-auto {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            padding: 0;
            margin: 0;
          }
          .printable-content {
            box-shadow: none !important;
            border: none !important;
          }
        }
        .watermarked {
            position: relative;
        }
        .watermarked::after {
            content: "";
            background-image: var(--watermark-url);
            background-repeat: no-repeat;
            background-position: center;
            background-size: 60%;
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            transform: translate(-50%, -50%);
            opacity: 0.05;
            pointer-events: none;
            z-index: 1;
        }
        .watermarked > * {
            position: relative;
            z-index: 2;
        }
      `}</style>
    </ThemeProvider>
  );
}

