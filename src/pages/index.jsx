import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Transactions from "./Transactions";

import Invoicing from "./Invoicing";

import Expenses from "./Expenses";

import Payroll from "./Payroll";

import AuditLog from "./AuditLog";

import Reports from "./Reports";

import BankReconciliation from "./BankReconciliation";

import MobileDev from "./MobileDev";

import Settings from "./Settings";

import ScheduledTransactions from "./ScheduledTransactions";

import SubscriptionManagement from "./SubscriptionManagement";

import AdminDashboard from "./AdminDashboard";

import Marketing from "./Marketing";

import AdminPortal from "./AdminPortal";

import MPesaIntegration from "./MPesaIntegration";

import PeakBooksCapital from "./PeakBooksCapital";

import OnlineStore from "./OnlineStore";

import Orders from "./Orders";

import Home from "./Home";

import Onboarding from "./Onboarding";

import Referrals from "./Referrals";

import CustomerStatement from "./CustomerStatement";

import CashFlowForecast from "./CashFlowForecast";

import KRATaxCenter from "./KRATaxCenter";

import Inventory from "./Inventory";

import PartnerPortal from "./PartnerPortal";

import PartnerSignup from "./PartnerSignup";

import FinancialForecasting from "./FinancialForecasting";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Transactions: Transactions,
    
    Invoicing: Invoicing,
    
    Expenses: Expenses,
    
    Payroll: Payroll,
    
    AuditLog: AuditLog,
    
    Reports: Reports,
    
    BankReconciliation: BankReconciliation,
    
    MobileDev: MobileDev,
    
    Settings: Settings,
    
    ScheduledTransactions: ScheduledTransactions,
    
    SubscriptionManagement: SubscriptionManagement,
    
    AdminDashboard: AdminDashboard,
    
    Marketing: Marketing,
    
    AdminPortal: AdminPortal,
    
    MPesaIntegration: MPesaIntegration,
    
    PeakBooksCapital: PeakBooksCapital,
    
    OnlineStore: OnlineStore,
    
    Orders: Orders,
    
    Home: Home,
    
    Onboarding: Onboarding,
    
    Referrals: Referrals,
    
    CustomerStatement: CustomerStatement,
    
    CashFlowForecast: CashFlowForecast,
    
    KRATaxCenter: KRATaxCenter,
    
    Inventory: Inventory,
    
    PartnerPortal: PartnerPortal,
    
    PartnerSignup: PartnerSignup,
    
    FinancialForecasting: FinancialForecasting,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Transactions" element={<Transactions />} />
                
                <Route path="/Invoicing" element={<Invoicing />} />
                
                <Route path="/Expenses" element={<Expenses />} />
                
                <Route path="/Payroll" element={<Payroll />} />
                
                <Route path="/AuditLog" element={<AuditLog />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/BankReconciliation" element={<BankReconciliation />} />
                
                <Route path="/MobileDev" element={<MobileDev />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/ScheduledTransactions" element={<ScheduledTransactions />} />
                
                <Route path="/SubscriptionManagement" element={<SubscriptionManagement />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/Marketing" element={<Marketing />} />
                
                <Route path="/AdminPortal" element={<AdminPortal />} />
                
                <Route path="/MPesaIntegration" element={<MPesaIntegration />} />
                
                <Route path="/PeakBooksCapital" element={<PeakBooksCapital />} />
                
                <Route path="/OnlineStore" element={<OnlineStore />} />
                
                <Route path="/Orders" element={<Orders />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/Referrals" element={<Referrals />} />
                
                <Route path="/CustomerStatement" element={<CustomerStatement />} />
                
                <Route path="/CashFlowForecast" element={<CashFlowForecast />} />
                
                <Route path="/KRATaxCenter" element={<KRATaxCenter />} />
                
                <Route path="/Inventory" element={<Inventory />} />
                
                <Route path="/PartnerPortal" element={<PartnerPortal />} />
                
                <Route path="/PartnerSignup" element={<PartnerSignup />} />
                
                <Route path="/FinancialForecasting" element={<FinancialForecasting />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}