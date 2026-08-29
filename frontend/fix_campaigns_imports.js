import fs from 'fs';

const filePath = 'src/pages/CampaignsPage.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  "import { getCampaigns, startCampaign, pauseCampaign, stopCampaign, deleteCampaign, updateCampaign } from '../api/campaigns';",
  "import { campaignsApi } from '../api/campaigns';"
);

code = code.replace(
  "import { Button } from '../components/ui/Button';",
  "import Button from '../components/ui/Button';"
);
code = code.replace(
  "import { Input } from '../components/ui/Input';",
  "import Input from '../components/ui/Input';"
);
code = code.replace(
  "import { Badge } from '../components/ui/Badge';",
  "import Badge from '../components/ui/Badge';"
);

code = code.replace("queryFn: () => getCampaigns({ page: 1, limit: 100 }),", "queryFn: () => campaignsApi.getCampaigns(1, 100),");
code = code.replace("mutationFn: startCampaign,", "mutationFn: campaignsApi.startCampaign,");
code = code.replace("mutationFn: pauseCampaign,", "mutationFn: campaignsApi.pauseCampaign,");
code = code.replace("mutationFn: stopCampaign,", "mutationFn: campaignsApi.stopCampaign,");
code = code.replace("mutationFn: deleteCampaign,", "mutationFn: campaignsApi.deleteCampaign,");
code = code.replace("mutationFn: ({ id, data }: { id: string, data: any }) => updateCampaign(id, data),", "mutationFn: ({ id, data }: { id: string, data: any }) => campaignsApi.updateCampaign(id, data),");
code = code.replace("const handleSaveEdit = (e: React.FormEvent) => {", "const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {");
code = code.replace("import EmptyState from '../components/ui/EmptyState';", "import EmptyState from '../components/ui/EmptyState';\nimport type React from 'react';");


fs.writeFileSync(filePath, code);
