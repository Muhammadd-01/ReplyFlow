import fs from 'fs';

const routerPath = 'src/router.tsx';
let routerCode = fs.readFileSync(routerPath, 'utf8');

if (!routerCode.includes("import { ChatsPage } from './pages/ChatsPage';")) {
  routerCode = routerCode.replace(
    "import { ContactsPage } from './pages/ContactsPage';",
    "import { ContactsPage } from './pages/ContactsPage';\nimport { ChatsPage } from './pages/ChatsPage';"
  );
}

if (!routerCode.includes("<Route path=\"chats\" element={<ChatsPage />} />")) {
  routerCode = routerCode.replace(
    "<Route path=\"contacts\" element={<ContactsPage />} />",
    "<Route path=\"contacts\" element={<ContactsPage />} />\n          <Route path=\"chats\" element={<ChatsPage />} />"
  );
}
fs.writeFileSync(routerPath, routerCode);

const sidebarPath = 'src/components/layouts/Sidebar.tsx';
let sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

if (!sidebarCode.includes("to: '/dashboard/chats'")) {
  sidebarCode = sidebarCode.replace(
    "const navItems = [",
    `const navItems = [
  { icon: MessageSquare, label: 'Chats', to: '/dashboard/chats' },`
  );
}
fs.writeFileSync(sidebarPath, sidebarCode);

