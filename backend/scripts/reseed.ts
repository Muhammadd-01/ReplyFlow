import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../src/models/User.js';
import Campaign from '../src/models/Campaign.js';
import Contact from '../src/models/Contact.js';
import WhatsAppSession from '../src/models/WhatsAppSession.js';

async function reseed() {
  await mongoose.connect('mongodb://127.0.0.1:27017/replyflow');
  
  const user = await User.findOne();
  if (!user) {
    console.log('No user found.');
    process.exit(1);
  }
  const userId = user._id;

  // Remove all MANUAL/dummy contacts
  const res = await Contact.deleteMany({ userId, source: 'MANUAL' });
  console.log(`Removed ${res.deletedCount} dummy contacts.`);

  // Find or create session
  let session = await WhatsAppSession.findOne({ userId });
  if (!session) {
    session = await WhatsAppSession.create({
      userId,
      sessionName: 'Default SRO Device',
      status: 'DISCONNECTED'
    });
  }

  // Clear existing draft campaigns
  await Campaign.deleteMany({ userId, status: 'DRAFT' });

  // Extensive list of SRO campaigns
  const sroCampaigns = [
    {
      userId,
      whatsappSessionId: session._id,
      name: '1. Fee Defaulter Reminder',
      description: 'Send gentle reminders to students/parents about pending tuition fees.',
      messageTemplate: 'Dear {{name}}, this is a gentle reminder from the Student Relations Office that your tuition fee for the current semester is due. Please clear your dues at your earliest convenience to avoid late charges. Reply to this message if you have any questions!',
      status: 'DRAFT'
    },
    {
      userId,
      whatsappSessionId: session._id,
      name: '2. Exam Schedule Announcement',
      description: 'Notify students about the upcoming Midterm or Final exam schedule.',
      messageTemplate: 'Hello {{name}}, the schedule for the upcoming Final Examinations has been published. Please check your student portal to download your date sheet. Best of luck with your preparations!',
      status: 'DRAFT'
    },
    {
      userId,
      whatsappSessionId: session._id,
      name: '3. Low Attendance Warning',
      description: 'Warn students who are falling below the minimum attendance threshold.',
      messageTemplate: 'Dear {{name}}, the SRO office has noticed that your attendance has fallen below the required 75% threshold. Please meet your department coordinator immediately to discuss this matter, otherwise you may not be allowed to sit in the final exams.',
      status: 'DRAFT'
    },
    {
      userId,
      whatsappSessionId: session._id,
      name: '4. Parent-Teacher Meeting (PTM)',
      description: 'Invite parents to the annual Parent-Teacher Meeting.',
      messageTemplate: 'Dear Parent/Guardian of {{name}}, we would like to invite you to our annual Parent-Teacher Meeting scheduled for this Saturday between 10 AM and 2 PM. Your participation is highly valued to discuss the academic progress of your child.',
      status: 'DRAFT'
    },
    {
      userId,
      whatsappSessionId: session._id,
      name: '5. Campus Event/Orientation Invitation',
      description: 'Notify students about upcoming campus events or orientation days.',
      messageTemplate: 'Hello {{name}}! We are excited to invite you to the upcoming Campus Orientation this Friday at 10:00 AM in the Main Auditorium. Attendance is highly encouraged for all students. See you there!',
      status: 'DRAFT'
    },
    {
      userId,
      whatsappSessionId: session._id,
      name: '6. Document Submission Reminder',
      description: 'Remind newly admitted students to submit pending enrollment documents.',
      messageTemplate: 'Dear {{name}}, congratulations on your admission! We noticed that some of your enrollment documents are still pending. Please submit your previous transcripts and ID copies to the Admissions Office by this Friday to finalize your enrollment.',
      status: 'DRAFT'
    },
    {
      userId,
      whatsappSessionId: session._id,
      name: '7. Feedback/Survey Request',
      description: 'Request students to fill out a course evaluation or campus facility survey.',
      messageTemplate: 'Hi {{name}}, your feedback matters! Please take 2 minutes to fill out the Campus Facilities Survey sent to your email. Help us improve the student experience for everyone. Let us know if you face any issues accessing the link.',
      status: 'DRAFT'
    },
    {
      userId,
      whatsappSessionId: session._id,
      name: '8. Disciplinary Notice',
      description: 'Send notices regarding disciplinary issues or code of conduct violations.',
      messageTemplate: 'Dear {{name}}, this message is from the Disciplinary Committee. You are requested to visit the Student Relations Office tomorrow at 11:00 AM regarding a recent code of conduct report. Please ensure your timely presence.',
      status: 'DRAFT'
    }
  ];

  await Campaign.insertMany(sroCampaigns);
  console.log(`Added ${sroCampaigns.length} SRO campaign templates.`);

  process.exit(0);
}

reseed().catch(console.error);
