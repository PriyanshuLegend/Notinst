import { NextRequest, NextResponse } from 'next/server';
import {
  getStoredInstagramSession,
  InstagramClient,
  apiCache,
} from '@/lib/instagram';

export async function POST(request: NextRequest) {
  const session = await getStoredInstagramSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Instagram account is not connected. Connect your Professional account in Settings.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { mediaType = 'IMAGE', mediaUrl, caption } = body;

    if (!mediaUrl || typeof mediaUrl !== 'string' || !mediaUrl.trim()) {
      return NextResponse.json(
        { error: 'A media URL is required to publish.' },
        { status: 400 }
      );
    }

    const trimmedUrl = mediaUrl.trim();

    // Validate that the URL is a publicly accessible HTTPS/HTTP URL
    // Meta requires its servers to be able to reach and download the media file directly
    const isLocalhost =
      trimmedUrl.includes('localhost') ||
      trimmedUrl.includes('127.0.0.1') ||
      trimmedUrl.startsWith('data:') ||
      trimmedUrl.startsWith('blob:') ||
      trimmedUrl.startsWith('file:');

    if (isLocalhost) {
      return NextResponse.json(
        {
          error:
            'Meta Content Publishing Requirement: Meta’s servers must download media directly from a publicly accessible internet URL. Local files, blob URLs, and localhost cannot be fetched by Instagram. Please host your image/video on a public CDN, Cloudinary, AWS S3, or Imgur, and provide that URL.',
          isPublicUrlRequired: true,
        },
        { status: 400 }
      );
    }

    const client = new InstagramClient(session.accessToken);
    const userId = session.userId;

    // Step 1: Create media container
    const isVideo = mediaType === 'VIDEO' || mediaType === 'REELS';
    const containerParams = {
      caption: caption || '',
      mediaType: isVideo ? (mediaType === 'REELS' ? ('REELS' as const) : ('VIDEO' as const)) : ('IMAGE' as const),
      imageUrl: !isVideo ? trimmedUrl : undefined,
      videoUrl: isVideo ? trimmedUrl : undefined,
    };

    const containerRes = await client.createMediaContainer(userId, containerParams);
    const containerId = containerRes.id;

    // If video/reel, wait briefly for Meta container processing
    if (isVideo) {
      let isReady = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        try {
          const status = await client.getContainerStatus(containerId);
          if (status.status_code === 'FINISHED') {
            isReady = true;
            break;
          } else if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
            throw new Error(`Media processing failed on Meta side: ${status.status || status.status_code}`);
          }
        } catch {
          // continue polling
        }
      }
      if (!isReady) {
        console.warn(`[Publish] Video container ${containerId} not confirmed FINISHED; attempting publish.`);
      }
    }

    // Step 2: Publish the media container
    const publishRes = await client.publishMedia(userId, containerId);

    // Invalidate profile and feed caches so the new post appears immediately
    apiCache.delete(`profile_full_${session.userId}`);
    apiCache.delete(`feed_latest_${session.userId}`);

    return NextResponse.json({
      success: true,
      mediaId: publishRes.id,
      containerId,
      message: 'Post successfully published to Instagram via official Content Publishing API!',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
