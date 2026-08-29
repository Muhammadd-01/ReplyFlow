import fs from 'fs';

const filePath = 'frontend/src/pages/WhatsAppPage.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// The user wants an animation when logging in and logging out.
// We can use framer-motion or just pure CSS/Tailwind animations.
// Let's replace the SessionCard component.

const newSessionCard = `function SessionCard({ session }: { session: WhatsAppSession }) {
  const queryClient = useQueryClient();
  
  const { data: statusData, refetch } = useQuery({
    queryKey: ['whatsapp-status', session.id],
    queryFn: () => whatsappApi.getSessionStatus(session.id),
    enabled: session.status === 'CONNECTING' || session.status === 'QR_REQUIRED',
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'CONNECTING' || status === 'QR_REQUIRED' ? 2000 : false;
    },
  });

  const startMutation = useMutation({
    mutationFn: () => whatsappApi.startSession(session.id),
    onSuccess: () => {
      toast.info('Connecting to WhatsApp...');
      refetch();
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: () => whatsappApi.disconnectSession(session.id),
    onSuccess: () => {
      toast.success('Device disconnected');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
    }
  });

  const currentStatus = statusData?.status || session.status;
  const qr = statusData?.qr;
  
  const isConnecting = currentStatus === 'CONNECTING' || startMutation.isPending;
  const isDisconnecting = disconnectMutation.isPending;

  return (
    <Card className={\`overflow-hidden relative transition-all duration-300 \${isConnecting || isDisconnecting ? 'ring-2 ring-primary-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : ''}\`}>
      
      {/* Animated Overlay for Connecting / Disconnecting */}
      {(isConnecting || isDisconnecting) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/40 dark:bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300">
           <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl animate-pulse border border-primary-500/30">
              <RefreshCw className="animate-spin text-primary-500 mb-4" size={40} />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {isConnecting ? 'Authenticating & Syncing WhatsApp...' : 'Logging out securely...'}
              </p>
              <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">
                {isConnecting ? 'Please wait while we establish a secure connection and sync your chats.' : 'Clearing session data...'}
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
              ? \`Phone: +\${session.phoneNumber || ''}\` 
              : 'Not connected to any phone number'}
          </p>
        </div>

        <div className="flex space-x-2">
          {currentStatus === 'DISCONNECTED' && (
            <Button 
              onClick={() => startMutation.mutate()} 
              disabled={isConnecting}
              leftIcon={<QrCode size={18} />}
            >
              Connect
            </Button>
          )}
          {currentStatus === 'CONNECTED' && (
            <Button 
              variant="outline" 
              onClick={() => disconnectMutation.mutate()} 
              disabled={isDisconnecting}
              leftIcon={<LogOut size={18} />}
            >
              Disconnect
            </Button>
          )}
        </div>
      </div>

      {currentStatus === 'QR_REQUIRED' && !isConnecting && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-6 flex flex-col items-center bg-gray-50 dark:bg-gray-800/30">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Link with WhatsApp</h4>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 w-64 h-64 flex items-center justify-center relative overflow-hidden group">
            {qr ? (
              <div className="flex flex-col items-center relative z-10">
                <QRCode value={qr} size={200} />
                <div className="absolute inset-0 bg-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <RefreshCw className="animate-spin mb-3" size={32} />
                <span className="text-sm">Generating QR Code...</span>
              </div>
            )}
            
            {/* Cool scanning line animation overlay */}
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-500/50 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-[scan_2s_ease-in-out_infinite] z-20"></div>
          </div>
          
          <p className="text-sm text-gray-500 mt-4 text-center max-w-sm">
            Open WhatsApp on your phone, tap Menu or Settings and select Linked Devices. Tap on Link a Device and point your phone at this screen.
          </p>
        </div>
      )}
    </Card>
  );
}`;

const startIndex = code.indexOf('function SessionCard({ session }: { session: WhatsAppSession }) {');
if (startIndex !== -1) {
  code = code.substring(0, startIndex) + newSessionCard;
  fs.writeFileSync(filePath, code);
}
