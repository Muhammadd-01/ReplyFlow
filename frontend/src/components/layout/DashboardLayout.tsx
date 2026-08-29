import { useState } from 'react';
import { Outlet, Navigate } from 'react-router';
import { useAuth } from '@/store/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Spinner from '@/components/ui/Spinner';

export default function DashboardLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-900 dark:bg-[#0b1121] relative overflow-hidden text-gray-100">
      {/* Background blobs for cool effect */}
      <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-primary-500/20 rounded-full blur-3xl mix-blend-screen animate-blob pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-accent-500/20 rounded-full blur-3xl mix-blend-screen animate-blob animation-delay-2000 pointer-events-none"></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden relative z-10 backdrop-blur-[2px]">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
