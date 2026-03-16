'use client';
import { useEffect, useState } from 'react';
import { createWidget, type EmbeddableChatWidgetConfig } from '@ensembleapp/client-sdk';
import { useFetchToken } from '@/hooks/useFetchToken';
import { getCustomVendorCardsWidget } from '../../../components/widgets/VendorCards';

const sdkVersion = process.env.NEXT_PUBLIC_SDK_VERSION ?? 'latest';
const widgetURL = `https://cdn.jsdelivr.net/npm/@ensembleapp/client-sdk@${sdkVersion}/dist/widget/widget.global.js`;

interface ChatPopupProps {
  threadId: string;
  dataContext?: EmbeddableChatWidgetConfig['dataContext'];
  onError?: (error: string | null) => void;
}

export function ChatPopup({ threadId, dataContext, onError }: ChatPopupProps) {
  const { token, fetchToken } = useFetchToken((err) => onError?.(err));
  const [hasInitialized, setHasInitialized] = useState(false);

  const loadWidget = () =>
    new Promise<void>((resolve, reject) => {
      if (window.ChatWidget) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = widgetURL;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load chat widget'));
      document.head.appendChild(script);
    });

  useEffect(() => {
    if (hasInitialized) return;

    const init = async () => {
      await loadWidget();
      const currentToken = token ?? (await fetchToken());

      await window.ChatWidget!.init({
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
          render: ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => (
            <button
              type="button"
              onClick={toggle}
              className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center"
              aria-label={isOpen ? 'Close chat' : 'Open chat'}
              aria-expanded={isOpen}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        onAuthError: fetchToken,
        widgets: window.ChatWidget!.getVendorCardsWidget(false),
        // custom widgets running in your React root
        // widgets: [
        //   getCustomVendorCardsWidget(false),
        // ],
        popupSize: { width: '800px' },
      });

      setHasInitialized(true);
    };

    init();

    return () => {
      window.ChatWidget?.destroy();
    };
  }, []);

  return null;
}

export function useChatPopup() {
  return {
    show: () => window.ChatWidget?.show(),
  };
}
