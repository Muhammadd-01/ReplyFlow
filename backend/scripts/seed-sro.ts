import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../src/models/User.js';
import Campaign from '../src/models/Campaign.js';
import Contact from '../src/models/Contact.js';
import WhatsAppSession from '../src/models/WhatsAppSession.js';

async function seed() {
  await mongoose.connect('mongodb://127.0.0.1:27017/replyflow');
  
  const user = await User.findOne();
  if (!user) {
    console.log('No user found.');
    process.exit(1);
  }
  const userId = user._id;

  // Find or create a default session just to satisfy the schema requirement
  let session = await WhatsAppSession.findOne({ userId });
  if (!session) {
    session = await WhatsAppSession.create({
      userId,
      sessionName: 'Default SRO Device',
      status: 'DISCONNECTED'
    });
  }

  const count = await Contact.countDocuments({ userId });
  if (count === 0) {
    await Contact.insertMany([
      { userId, name: 'John Doe (Student)', phoneNumber: '923001234567', normalizedPhoneNumber: '+923001234567', source: 'MANUAL' },
      { userId, name: 'Jane Smith (Parent)', phoneNumber: '923009876543', normalizedPhoneNumber: '+923009876543', source: 'MANUAL' },
      { userId, name: 'Ali Khan (Student)', phoneNumber: '923331112233', normalizedPhoneNumber: '+923331112233', source: 'MANUAL' }
    ]);
    console.log('Added dummy SRO contacts.');
  }

  // Clear existing default campaigns just in case it failed midway
  await Campaign.deleteMany({ userId, name: { $regex: 'Template' } });

  await Campaign.insertMany([
    {
      userId,
      whatsappSessionId: session._id,
      name: 'Fee Defaulter Reminder (Template)',
      description: 'Send gentle reminders to students/parents about pending tuition fees.',
      messageTemplate: 'Dear {{name}}, this is a gentle reminder from the Student Relations Office that your tuition fee for the current semester is due. Please clear your dues at your earliest convenience to avoid late charges. Reply to this message if you have any questions!',
      status: 'DRAFT',
      totalRecipients: 0,
      sentCount: 0,
      failedCount: 0,
      repliedCount: 0
    },
    {
      userId,
      whatsappSessionId: session._id,
      name: 'Upcoming Orientation/Event (Template)',
      description: 'Notify students about upcoming campus events or orientation days.',
      messageTemplate: 'Hello {{name}}! We are excited to invite you to the upcoming Campus Orientation this Friday at 10:00 AM in the Main Auditorium. Attendance is mandatory for all new students. See you there!',
      status: 'DRAFT',
      totalRecipients: 0,
      sentCount: 0,
      failedCount: 0,
      repliedCount: 0
    },
    {
      userId,
      whatsappSessionId: session._id,
      name: 'Low Attendance Warning (Template)',
      description: 'Warn students who are falling below the minimum attendance threshold.',
      messageTemplate: 'Dear {{name}}, the SRO office has noticed that your attendance has fallen below the required 75% threshold. Please meet your department coordinator immediately to discuss this matter, otherwise you may not be allowed to sit in the final exams.',
      status: 'DRAFT',
      totalRecipients: 0,
      sentCount: 0,
      failedCount: 0,
      repliedCount: 0
    }
  ]);
  console.log('Added default SRO campaigns.');

  process.exit(0);
}

seed().catch(console.error);
