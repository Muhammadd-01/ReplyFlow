import fs from 'fs';

const sidebarPath = 'src/components/layout/Sidebar.tsx';
let sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

if (!sidebarCode.includes("to: '/dashboard/chats'")) {
  sidebarCode = sidebarCode.replace(
    "const navItems = [",
    `const navItems = [
  { icon: MessageSquare, label: 'Chats', to: '/dashboard/chats' },`
  );
}
fs.writeFileSync(sidebarPath, sidebarCode);
