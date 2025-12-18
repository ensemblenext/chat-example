/**
 * Extract error message from API response
 */
export async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.error || 'An error occurred';
  } catch {
    return 'An error occurred';
  }
}

/**
 * Fetch Ensemble chat token from API with Firebase authentication
 */
export async function fetchChatToken(
  tokenEndpoint: string,
  firebaseToken: string
): Promise<{ token: string; error?: string }> {
  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorMessage = await getErrorMessage(response);
      return { token: '', error: errorMessage };
    }

    const data = await response.json();
    return { token: data.token };
  } catch (err) {
    return {
      token: '',
      error: err instanceof Error ? err.message : 'Failed to fetch token'
    };
  }
}
