/**
 * Token fetching hook for the chat widget.
 *
 * NOTE: This is example code. Replace with your own authentication flow
 * to fetch a chat token from your backend.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useFetchToken(onError?: (error: string) => void) {
  const { getIdToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const tokenEndpoint = process.env.NEXT_PUBLIC_TOKEN_ENDPOINT || '/api/chat-token';

  const fetchToken = useCallback(async (): Promise<string> => {
    const firebaseToken = await getIdToken();
    if (!firebaseToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const data = await response.json();
        errorMessage = data.error || errorMessage;
      } catch {}
      onError?.(errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    setToken(data.token);
    return data.token;
  }, [getIdToken, tokenEndpoint, onError]);

  return { token, fetchToken };
}
