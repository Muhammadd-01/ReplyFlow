import { useState, useEffect, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, Smartphone, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { whatsappApi, WhatsAppSession } from '@/api/whatsapp';
import { socket } from '@/lib/socket';
import { useAuth } from '@/store/AuthContext';

export default function WhatsAppPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newSessionName, setNewSessionName] = useState('');

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['whatsapp-sessions'],
    queryFn: whatsappApi.getSessions,
  });

  useEffect(() => {
    if (!socket) return;

    const handleStatus = (data: any) => {
      // Update sessions list in cache
      queryClient.setQueryData(['whatsapp-sessions'], (old: WhatsAppSession[] | undefined) => {
        if (!old) return old;
        return old.map(s => s.id === data.sessionId ? { ...s, status: data.status, phoneNumber: data.phoneNumber || s.phoneNumber } : s);
      });
      // Also invalidate the individual status queries so SessionCard picks it up
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status', data.sessionId] });
    };

    socket.on('whatsapp:status' as any, handleStatus);
    return () => {
      socket.off('whatsapp:status' as any, handleStatus);
    };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (name: string) => whatsappApi.createSession(name),
    onSuccess: () => {
      setNewSessionName('');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
      toast.success('Session created');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSessionName.trim()) {
      createMutation.mutate(newSessionName);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Devices</h1>
          <p className="text-gray-500 dark:text-gray-400">Connect and manage your WhatsApp accounts for sending campaigns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Add New Device</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Device Name"
                placeholder="e.g. Sales Phone, Main Support"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" isLoading={createMutation.isPending}>
                Create Device
              </Button>
            </form>
          </Card>
          
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center mb-2">
              <Smartphone className="mr-2" size={18} /> How to connect
            </h3>
            <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-2 list-decimal list-inside">
              <li>Create a new device on this page.</li>
              <li>Click "Connect" to generate a QR code.</li>
              <li>Open WhatsApp on your phone.</li>
              <li>Tap Menu (3 dots) or Settings.</li>
              <li>Select Linked Devices.</li>
              <li>Tap on "Link a Device".</li>
              <li>Point your phone to this screen to capture the code.</li>
            </ol>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading devices...</div>
          ) : sessions.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 mb-4">
                <Smartphone size={32} />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Devices Yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">Create a device on the left to connect your WhatsApp account and start sending campaigns.</p>
            </Card>
          ) : (
            sessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: WhatsAppSession }) {
  const queryClient = useQueryClient();
  // Track that user clicked Connect — enables polling immediately
  const [userClickedConnect, setUserClickedConnect] = useState(false);
  
  // Poll when user clicked connect OR when session is already in a connecting state
  const shouldPoll = userClickedConnect || session.status === 'CONNECTING' || session.status === 'QR_REQUIRED';

  const { data: statusData } = useQuery({
    queryKey: ['whatsapp-status', session.id],
    queryFn: () => whatsappApi.getSessionStatus(session.id),
    enabled: shouldPoll,
    refetchInterval: shouldPoll ? 1500 : false,
  });

  // Derive live status from polled data, fall back to session prop
  const polledStatus = statusData?.status;
  const currentStatus = polledStatus || session.status;
  const qr = statusData?.qr;

  // Once connected, stop polling
  useEffect(() => {
    if (polledStatus === 'CONNECTED') {
      setUserClickedConnect(false);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
    }
  }, [polledStatus, queryClient]);

  const startMutation = useMutation({
    mutationFn: () => whatsappApi.startSession(session.id),
    onSuccess: () => {
      toast.info('Connecting to WhatsApp...');
      setUserClickedConnect(true);
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: () => whatsappApi.disconnectSession(session.id),
    onSuccess: () => {
      toast.success('Device disconnected');
      setUserClickedConnect(false);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status', session.id] });
    }
  });

  const showQRSection = currentStatus === 'QR_REQUIRED' || (currentStatus === 'CONNECTING' && userClickedConnect);
  const showConnectingOverlay = startMutation.isPending;
  const showDisconnectingOverlay = disconnectMutation.isPending;

  return (
    <Card className={`overflow-hidden relative transition-all duration-300 ${showConnectingOverlay || showDisconnectingOverlay ? 'ring-2 ring-primary-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : ''}`}>
      
      {/* Animated Overlay — only while the mutation is in-flight */}
      {(showConnectingOverlay || showDisconnectingOverlay) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/40 dark:bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300">
           <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl animate-pulse border border-primary-500/30">
              <RefreshCw className="animate-spin text-primary-500 mb-4" size={40} />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {showDisconnectingOverlay ? 'Logging out securely...' : 'Initializing WhatsApp...'}
              </p>
              <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">
                {showDisconnectingOverlay ? 'Clearing session data...' : 'Generating your QR code, please wait...'}
              </p>
           </div>
        </div>
      )}

      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{session.sessionName}</h3>
            {currentStatus === 'CONNECTED' ? (
              <Badge variant="success">Connected</Badge>
            ) : currentStatus === 'QR_REQUIRED' ? (
              <Badge variant="warning">Scan QR Code</Badge>
            ) : currentStatus === 'CONNECTING' ? (
              <Badge variant="info">Connecting...</Badge>
            ) : (
              <Badge variant="default">Disconnected</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {currentStatus === 'CONNECTED' 
              ? `Phone: +${session.phoneNumber || ''}` 
              : 'Not connected to any phone number'}
          </p>
        </div>

        <div className="flex space-x-2">
          {currentStatus === 'DISCONNECTED' && !userClickedConnect && (
            <Button 
              onClick={() => startMutation.mutate()} 
              isLoading={startMutation.isPending}
              leftIcon={<QrCode size={18} />}
            >
              Connect
            </Button>
          )}
          {currentStatus === 'CONNECTED' && (
            <Button 
              variant="outline" 
              onClick={() => disconnectMutation.mutate()} 
              isLoading={disconnectMutation.isPending}
              leftIcon={<LogOut size={18} />}
            >
              Disconnect
            </Button>
          )}
        </div>
      </div>

      {/* QR Code section */}
      {showQRSection && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-6 flex flex-col items-center bg-gray-50 dark:bg-gray-800/30">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Link with WhatsApp</h4>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 w-64 h-64 flex items-center justify-center relative overflow-hidden group">
            {qr ? (
              <div className="flex flex-col items-center relative z-10">
                <QRCode value={qr} size={200} />
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <RefreshCw className="animate-spin mb-3" size={32} />
                <span className="text-sm">Generating QR Code...</span>
              </div>
            )}
            
            {/* Scanning line animation */}
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-500/50 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-[scan_2s_ease-in-out_infinite] z-20"></div>
          </div>
          
          <p className="text-sm text-gray-500 mt-4 text-center max-w-sm">
            Open WhatsApp on your phone → Settings → Linked Devices → Link a Device → Point your phone at this screen.
          </p>
        </div>
      )}

      {/* Connected success state */}
      {currentStatus === 'CONNECTED' && (
        <div className="border-t border-green-200 dark:border-green-900/30 p-4 bg-green-50 dark:bg-green-900/10 flex items-center gap-3">
          <CheckCircle2 className="text-green-500" size={20} />
          <p className="text-sm text-green-700 dark:text-green-400">
            WhatsApp is connected and syncing contacts & chats in the background.
          </p>
        </div>
      )}
    </Card>
  );
}