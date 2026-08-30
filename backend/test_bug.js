import mongoose from 'mongoose';
import Campaign from './src/models/Campaign.js';
import CampaignContact from './src/models/CampaignContact.js';
import Contact from './src/models/Contact.js';
import User from './src/models/User.js';
import WhatsAppSession from './src/models/WhatsAppSession.js';

// We can't easily mock the DB connection without connecting, let's just inspect the logic.
