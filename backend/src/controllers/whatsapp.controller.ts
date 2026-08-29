import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { asyncHandler, AppError, NotFoundError } from '../middleware/error-handler.js';
import WhatsAppSession from '../models/WhatsAppSession.js';
import { whatsappService } from '../whatsapp/service.js';

export const getSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  
  const sessions = await WhatsAppSession.find({ userId }).sort({ createdAt: -1 });

  res.json({ status: 'success', data: sessions });
});

export const createSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { sessionName } = req.body;

  if (!sessionName) {
    throw new AppError(400, 'Session name is required');
  }

  const session = await WhatsAppSession.create({
    userId,
    sessionName,
    status: 'DISCONNECTED',
  });

  res.status(201).json({ status: 'success', data: session });
});

export const startSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const session = await WhatsAppSession.findOne({ _id: id, userId });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Update DB status to connecting
  session.status = 'CONNECTING';
  await session.save();

  // Start background process
  whatsappService.startSession(id, userId).catch(console.error);

  res.json({ status: 'success', message: 'Session started connecting' });
});

export const getSessionStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const session = await WhatsAppSession.findOne({ _id: id, userId });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  const status = whatsappService.getStatus(id);
  const qr = whatsappService.getQrCode(id);

  res.json({ 
    status: 'success', 
    data: { 
      status, 
      qr, 
      session 
    } 
  });
});

export const disconnectSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const session = await WhatsAppSession.findOne({ _id: id, userId });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  await whatsappService.disconnect(id);

  res.json({ status: 'success', message: 'Session disconnected' });
});
