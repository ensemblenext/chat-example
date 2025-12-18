import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { adminAuth } from '@/lib/firebase/admin';

const AUDIENCE = 'ensembleapp.ai';

export async function POST(request: NextRequest) {
  try {
    // Extract Firebase token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const firebaseToken = authHeader.substring(7); // Remove 'Bearer '

    // Validate Firebase JWT
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(firebaseToken);
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid or expired Firebase token' },
        { status: 401 }
      );
    }

    // Extract user info from Firebase token
    const userId = decodedToken.uid;
    const email = decodedToken.email || '';
    const displayName = decodedToken.name || email.split('@')[0];

    // Validate email domain - only allow @wellthy.com or @ensembleui.com
    const allowedDomains = ['wellthy.com', 'ensembleui.com'];
    const emailDomain = email.split('@')[1]?.toLowerCase();

    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      return NextResponse.json(
        { error: 'Access denied. Only @wellthy.com or @ensembleui.com email addresses are allowed.' },
        { status: 403 }
      );
    }

    // Get Ensemble secrets
    const keyId = process.env.ENSEMBLE_KEY_ID;
    const keySecret = process.env.ENSEMBLE_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'ENSEMBLE_KEY_ID/ENSEMBLE_KEY_SECRET not set' },
        { status: 500 }
      );
    }

    // Generate Ensemble token with user info
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const ensembleToken = jwt.sign(
      {
        sub: userId,
        email: email,
        name: displayName,
        exp: nowInSeconds + 60 * 60, // 1 hour
        iat: nowInSeconds,
        aud: AUDIENCE,
      },
      keySecret,
      {
        algorithm: 'HS256',
        keyid: keyId,
      }
    );

    return NextResponse.json({
      token: ensembleToken,
      user: { uid: userId, email, displayName }
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
