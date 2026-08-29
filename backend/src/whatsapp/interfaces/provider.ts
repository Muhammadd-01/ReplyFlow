export interface WhatsAppProvider {
  initialize(sessionId: string, onUpdate: (status: any) => void): Promise<void>;
  sendMessage(sessionId: string, to: string, content: string): Promise<string | undefined>;
  sendTyping(sessionId: string, to: string): Promise<void>;
  disconnect(sessionId: string): Promise<void>;
  getQrCode(sessionId: string): string | null;
  getStatus(sessionId: string): string;
}
