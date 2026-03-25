import { Response } from 'express';

export const sseClients = new Map<number, Set<Response>>();

export function broadcastDonation(campaignId: number, donation: object) {
  const clients = sseClients.get(campaignId);
  if (!clients || clients.size === 0) return;
  const payload = `data: ${JSON.stringify(donation)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}
