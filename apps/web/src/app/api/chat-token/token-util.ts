import jwt from 'jsonwebtoken';

export interface SignTokenPayload {
  /**
   * Unique user ID. Conversation threads will be keyed by this ID.
   */
  userId: string;
  /**
   * Additional context to pass to the LLM
   */
  context?: Record<string, unknown>;
  /**
   * Token expiration time in seconds. Default is 3600 (1 hour).
   */
  expirationInSeconds?: number;
  /**
   * Ensemble Key ID from the admin dashboard
   */
  ensembleKeyId: string;
  /**
   * Ensemble Key Secret from the admin dashboard
   */
  ensembleKeySecret: string;
}

/**
 * Generate the JWT token for a specific user
 */
export const signToken = ({
  userId,
  context,
  expirationInSeconds = 3600,
  ensembleKeyId,
  ensembleKeySecret,
}: SignTokenPayload) => {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: userId,
      context,
      exp: nowInSeconds + expirationInSeconds,
      iat: nowInSeconds,
      aud: 'ensembleapp.ai',
    },
    ensembleKeySecret,
    {
      algorithm: 'HS256',
      keyid: ensembleKeyId,
    }
  );
}