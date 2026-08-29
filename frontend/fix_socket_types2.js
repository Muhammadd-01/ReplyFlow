import fs from 'fs';

const socketPath = 'src/lib/socket.ts';
let code = fs.readFileSync(socketPath, 'utf8');

code = code.replace(
  "'export:ready': (data: { exportId: string; campaignId: string }) => void;",
  "'export:ready': (data: { exportId: string; campaignId: string }) => void;\n  'whatsapp:new_message': (data: any) => void;\n  'whatsapp:contacts_synced': (data: any) => void;\n  'whatsapp:reply': (data: any) => void;"
);

fs.writeFileSync(socketPath, code);
