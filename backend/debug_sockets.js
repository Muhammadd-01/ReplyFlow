import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import WhatsAppSession from './src/models/WhatsAppSession.js';

async function test() {
  await mongoose.connect(process.env.DATABASE_URL);
  
  const sessions = await WhatsAppSession.find({});
  console.log("All WhatsApp Sessions in DB:");
  for (const s of sessions) {
    console.log(`- ID: ${s._id}, Name: ${s.sessionName}, Status: ${s.status}, User: ${s.userId}`);
  }
  
  process.exit(0);
}
test();
