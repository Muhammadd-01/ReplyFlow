import mongoose from 'mongoose';
import { env } from './src/config/env.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/replyflow');
  const db = mongoose.connection.db;
  const docs = await db.collection('campaigncontacts').find().sort({createdAt: -1}).limit(5).toArray();
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
}
run();
