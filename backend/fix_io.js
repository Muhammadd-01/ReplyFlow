import fs from 'fs';

const servicePath = 'src/whatsapp/service.ts';
let code = fs.readFileSync(servicePath, 'utf8');

const regex = /const io = getIO\(\);/g;
let matches = 0;
code = code.replace(regex, (match) => {
  matches++;
  if (matches > 2) {
    return 'io = getIO();';
  }
  return match;
});

// actually, let's just make the second one in the same block not 'const'
code = code.replace(/const io = getIO\(\);\n\s*io\.to\(`user:\$\{session\.userId\}`\)\.emit\('whatsapp:reply'/g, "io.to(`user:${session.userId}`).emit('whatsapp:reply'");

fs.writeFileSync(servicePath, code);
