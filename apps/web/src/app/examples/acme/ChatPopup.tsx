'use client';
import { useEffect, useRef, useState } from 'react';
import type { EmbeddableChatWidgetConfig } from '@ensembleapp/client-sdk';
import { customChatWidgets } from '@/components/widgets/chat-widgets';
import { useFetchToken } from '@/hooks/useFetchToken';

interface ChatPopupProps {
  threadId: string;
  dataContext?: EmbeddableChatWidgetConfig['dataContext'];
  onError?: (error: string | null) => void;
}

export function ChatPopup({ threadId, dataContext, onError }: ChatPopupProps) {
  // NOTE: Replace useFetchToken with your own authentication flow
  const { token, fetchToken } = useFetchToken((err) => onError?.(err));
  
  const [hasInitialized, setHasInitialized] = useState(false);
  const configRef = useRef<EmbeddableChatWidgetConfig | null>(null);

  /**
   * Re-fetch the token when 401 Unauthorized error.
   * The widget will automatically retry the failed request once
   */
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
          title: 'Support Agent',
          initialUserMessage: 'Hello world',
          initialAssistantMessage: 'Hello! How can I assist you today?',
          inputPlaceholder: 'Type your message here...',
          anchor: {
            enabled: true,
            initiallyOpen: true,
            render: ({ isOpen, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center"
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
                aria-expanded={isOpen}
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>
            ),
          },
          dataContext,
          onAuthError: handleAuthError,
          widgets: customChatWidgets,
          containerId: undefined,
          popupSize: {
            width: '800px',
          },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!configRef.current || !dataContext) return;

    configRef.current.dataContext = dataContext;

    if (hasInitialized) {
      window.ChatWidget?.updateConfig?.({ dataContext });
    }
  }, [dataContext, hasInitialized]);

  return null;
}

export function useChatPopup() {
  const show = async () => {
    window.ChatWidget?.show?.();
  };

  return { show };
}
