import fs from 'fs';

const serverPath = 'src/server.ts';
let code = fs.readFileSync(serverPath, 'utf8');

if (!code.includes("import chatRoutes from './routes/chat.routes.js';")) {
  code = code.replace(
    "import campaignRoutes from './routes/campaign.routes.js';",
    "import campaignRoutes from './routes/campaign.routes.js';\nimport chatRoutes from './routes/chat.routes.js';"
  );
}

if (!code.includes("app.use('/api/chats', chatRoutes);")) {
  code = code.replace(
    "app.use('/api/campaigns', campaignRoutes);",
    "app.use('/api/campaigns', campaignRoutes);\napp.use('/api/chats', chatRoutes);"
  );
}

fs.writeFileSync(serverPath, code);
