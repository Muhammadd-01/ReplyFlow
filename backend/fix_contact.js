import fs from 'fs';

const servicePath = 'src/whatsapp/service.ts';
let code = fs.readFileSync(servicePath, 'utf8');

code = code.replace(`        const contact = await Contact.findOne({
          userId: session.userId,
          normalizedPhoneNumber: normalizedPhone
        });
        if (!contact) continue;`, '');

code = code.replace(`        io = getIO();
        io.to(\`user:\${session.userId}\`).emit('whatsapp:new_message', chatMsg);`, `        const io = getIO();
        io.to(\`user:\${session.userId}\`).emit('whatsapp:new_message', chatMsg);`);

fs.writeFileSync(servicePath, code);
