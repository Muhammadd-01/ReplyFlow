import { Outlet, Navigate } from 'react-router';
import { useAuth } from '@/store/AuthContext';
import { Zap } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 dark:bg-[#0b1121] px-4 relative overflow-hidden text-gray-100">
      {/* Cool background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-500/30 rounded-full blur-3xl mix-blend-screen animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent-500/30 rounded-full blur-3xl mix-blend-screen animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-pink-500 p-4 shadow-lg shadow-primary-500/30">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            ReplyFlow
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">Excel-to-WhatsApp Messaging Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-gray-200/50 dark:border-gray-700/50 dark:bg-gray-900/80 dark:shadow-none">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
