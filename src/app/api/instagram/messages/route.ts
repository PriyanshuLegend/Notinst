import { NextRequest, NextResponse } from 'next/server';
import {
  getStoredInstagramSession,
  InstagramClient,
} from '@/lib/instagram';
import type { Message } from '@/lib/types';

export async function POST(request: NextRequest) {
  const session = await getStoredInstagramSession();
  if (!session) {
    // In mock mode, allow optimistic mock message sending
    try {
      const body = await request.json();
      const mockMsg: Message = {
        id: `mock-msg-${Date.now()}`,
        conversationId: body.conversationId || 'conv1',
        senderId: 'me',
        text: body.text,
        createdAt: new Date().toISOString(),
        status: 'sent',
      };
      return NextResponse.json({ success: true, message: mockMsg, source: 'mock' });
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
  }

  try {
    const body = await request.json();
    const { recipientId, conversationId, text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
    }

    const client = new InstagramClient(session.accessToken);
    let sentResult: { recipient_id: string; message_id: string };

    try {
      sentResult = await client.sendMessage(recipientId || conversationId, text.trim());
    } catch (apiErr: unknown) {
      const errMsg = apiErr instanceof Error ? apiErr.message : String(apiErr);

      // Analyze common Meta messaging policy errors
      let friendlyError = errMsg;
      if (errMsg.includes('24') || errMsg.includes('window') || errMsg.includes('outside')) {
        friendlyError =
          'Meta 24-Hour Policy Window: You can only reply within 24 hours of the user’s last message to your professional account.';
      } else if (errMsg.includes('permission') || errMsg.includes('OAuth')) {
        friendlyError =
          'Messenger API permission error: Ensure instagram_business_manage_messages is approved on your Meta App.';
      } else if (errMsg.includes('recipient')) {
        friendlyError =
          'Recipient ID must be a valid Instagram-scoped user ID (IGSID) with prior interaction.';
      }

      return NextResponse.json(
        {
          error: friendlyError,
          rawError: errMsg,
          policyRestricted: true,
        },
        { status: 403 }
      );
    }

    const newMessage: Message = {
      id: sentResult.message_id,
      conversationId: conversationId || sentResult.recipient_id,
      senderId: session.userId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    return NextResponse.json({ success: true, message: newMessage, source: 'instagram' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
