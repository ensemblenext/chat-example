import { NextRequest, NextResponse } from 'next/server';

import { adminAuth } from '@/lib/firebase/admin';
import { signToken } from './token-util';

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

    // enforce domain restrictions if configured
    const allowedDomains = process.env.ALLOWED_DOMAINS;
    const emailDomain = email.split('@')[1]?.toLowerCase();

    if (!emailDomain || (allowedDomains && !allowedDomains.split(',').map(d => d.trim()).includes(emailDomain))) {
      return NextResponse.json(
        { error: 'Access denied.' },
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

    // Generate Ensemble token with util
    const jwtToken = signToken({
      // unique user ID (conversation threads will be keyed by this ID)
      userId,
      // additional context to pass to the LLM. Must a key/value pairs
      context: {

      },
      ensembleKeyId: keyId,
      ensembleKeySecret: keySecret,
    });

    return NextResponse.json({
      token: jwtToken,
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
