'use client';
import { useEffect, useRef, useState } from 'react';
import type { EmbeddableChatWidgetConfig } from '@ensembleapp/client-sdk';
import { customChatWidgets } from '@/components/widgets/chat-widgets';
import { useAuth } from '@/contexts/AuthContext';
import { fetchChatToken } from '@/lib/api-utils';

interface ChatPanelProps {
  threadId: string;
  onError?: (error: string | null) => void;
}

const CONTAINER_ID = 'chat-container';

export function ChatPanel({ threadId, onError }: ChatPanelProps) {
  const { getIdToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const configRef = useRef<EmbeddableChatWidgetConfig | null>(null);

  const tokenEndpoint = process.env.NEXT_PUBLIC_TOKEN_ENDPOINT || '/api/chat-token';

  const fetchToken = async (): Promise<string> => {
    if (!tokenEndpoint) {
      throw new Error('Token endpoint is not configured.');
    }

    const firebaseToken = await getIdToken();
    if (!firebaseToken) {
      throw new Error('Not authenticated');
    }

    const { token: newToken, error: fetchError } = await fetchChatToken(tokenEndpoint, firebaseToken);

    if (fetchError) {
      onError?.(fetchError);
      throw new Error(fetchError);
    }

    setToken(newToken);
    onError?.(null);
    return newToken;
  };

  const handleAuthError = async (): Promise<string | null> => {
    try {
      return await fetchToken();
    } catch (err) {
      console.error('Failed to refresh chat token', err);
      return null;
    }
  };

  const loadWidget = () =>
    new Promise<void>((resolve, reject) => {
      const sdkVersion = process.env.NEXT_PUBLIC_SDK_VERSION ?? 'latest';
      const widgetURL = `https://cdn.jsdelivr.net/npm/@ensembleapp/client-sdk@${sdkVersion}/dist/widget/widget.global.js`;

      if (window.ChatWidget || document.querySelector(`script[src="${widgetURL}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = widgetURL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load chat widget'));
      document.head.appendChild(script);
    });

  const initChat = async () => {
    if (hasInitialized) return;

    try {
      await loadWidget();
      const currentToken = token ?? (await fetchToken());

      if (!configRef.current) {
        configRef.current = {
          api: {
            baseUrl: process.env.NEXT_PUBLIC_CHAT_BASE_URL!,
            token: currentToken!,
          },
          threadId,
          agentId: process.env.NEXT_PUBLIC_AGENT_ID ?? '',
          initialUserMessage: 'Hello World',
          inputPlaceholder: 'Type your message here...',
          containerId: CONTAINER_ID,
          onAuthError: handleAuthError,
          widgets: customChatWidgets,
        };
      }

      if (!hasInitialized && configRef.current) {
        window.chatWidgetConfig = configRef.current;
        await window.ChatWidget?.init?.(configRef.current);
        setHasInitialized(true);
      }
    } catch (error) {
      console.error('Failed to initialize chat widget', error);
    }
  };

  useEffect(() => {
    void initChat();
    return () => {
      try {
        window.ChatWidget?.destroy?.();
      } catch (err) {
        console.error('Failed to destroy chat widget on unmount', err);
      }
    };
  }, []);

  return <div id={CONTAINER_ID} className="flex-1 overflow-hidden" />;
}
