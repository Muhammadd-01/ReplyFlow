import fs from 'fs';

const servicePath = 'src/whatsapp/service.ts';
let code = fs.readFileSync(servicePath, 'utf8');

code = code.replace(`        io = getIO();
        io.to(\`user:\${session.userId}\`).emit('whatsapp:reply', {`, `        io.to(\`user:\${session.userId}\`).emit('whatsapp:reply', {`);

fs.writeFileSync(servicePath, code);
