import { createBrowserRouter, Navigate } from 'react-router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import WhatsAppPage from '@/pages/WhatsAppPage';
import ContactsPage from '@/pages/ContactsPage';
import ImportPage from '@/pages/ImportPage';
import CampaignsPage from '@/pages/CampaignsPage';
import NewCampaignPage from '@/pages/NewCampaignPage';
import CampaignDetailPage from '@/pages/CampaignDetailPage';
import InboxPage from '@/pages/InboxPage';
import ConversationPage from '@/pages/ConversationPage';
import ExportsPage from '@/pages/ExportsPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <DashboardLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/whatsapp', element: <WhatsAppPage /> },
      { path: '/contacts', element: <ContactsPage /> },
      { path: '/import', element: <ImportPage /> },
      { path: '/campaigns', element: <CampaignsPage /> },
      { path: '/campaigns/new', element: <NewCampaignPage /> },
      { path: '/campaigns/:id', element: <CampaignDetailPage /> },
      { path: '/inbox', element: <InboxPage /> },
      { path: '/conversations/:id', element: <ConversationPage /> },
      { path: '/exports', element: <ExportsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
