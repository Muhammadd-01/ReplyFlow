import fs from 'fs';

const socketPath = 'src/lib/socket.ts';
let code = fs.readFileSync(socketPath, 'utf8');

if (!code.includes("'whatsapp:new_message':")) {
  code = code.replace(
    "'whatsapp:reply': (data: { contactId: string; content: string; phone: string }) => void;",
    "'whatsapp:reply': (data: { contactId: string; content: string; phone: string }) => void;\n  'whatsapp:new_message': (msg: any) => void;"
  );
}

fs.writeFileSync(socketPath, code);
