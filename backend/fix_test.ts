import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import CampaignContact from './src/models/CampaignContact.js';
import Campaign from './src/models/Campaign.js';
import WhatsAppSession from './src/models/WhatsAppSession.js';

async function test() {
  await mongoose.connect(process.env.DATABASE_URL);
  
  const sessions = await WhatsAppSession.find();
  console.log("Sessions:", sessions);
  
  const campaigns = await Campaign.find();
  console.log("Campaigns:", campaigns);

  const ccs = await CampaignContact.find();
  console.log("CampaignContacts:", ccs);
  
  process.exit(0);
}
test();
