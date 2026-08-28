import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Page Not Found</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
      <Button onClick={() => navigate('/dashboard')} leftIcon={<Home className="h-4 w-4" />}>
        Back to Dashboard
      </Button>
    </div>
  );
}
