import fs from 'fs';
import path from 'path';

const servicePath = path.join(__dirname, 'src/whatsapp/service.ts');
let code = fs.readFileSync(servicePath, 'utf8');

// Add imports
if (!code.includes("import Chat from '../models/Chat.js';")) {
  code = code.replace(
    "import Reply from '../models/Reply.js';",
    "import Reply from '../models/Reply.js';\nimport Chat from '../models/Chat.js';\nimport ChatMessage from '../models/ChatMessage.js';"
  );
}

// Ensure proper exports/imports
fs.writeFileSync(servicePath, code);
