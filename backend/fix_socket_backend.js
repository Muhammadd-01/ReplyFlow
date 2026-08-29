import fs from 'fs';

const socketPath = 'src/socket/index.ts';
let code = fs.readFileSync(socketPath, 'utf8');

if (!code.includes("'whatsapp:new_message':")) {
  code = code.replace(
    "'whatsapp:contacts_synced': (data: any) => void;",
    "'whatsapp:contacts_synced': (data: any) => void;\n  'whatsapp:new_message': (data: any) => void;"
  );
}

fs.writeFileSync(socketPath, code);
