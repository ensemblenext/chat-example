'use client';
import { useEffect, useState } from 'react';
import { useFetchToken } from '@/hooks/useFetchToken';

const sdkVersion = process.env.NEXT_PUBLIC_SDK_VERSION ?? 'latest';
const widgetURL = `https://cdn.jsdelivr.net/npm/@ensembleapp/client-sdk@${sdkVersion}/dist/widget/widget.global.js`;

interface ChatPanelProps {
  threadId: string;
  onError?: (error: string | null) => void;
}

const CONTAINER_ID = 'chat-container';

export function ChatPanel({ threadId, onError }: ChatPanelProps) {
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
        initialUserMessage: 'Hello World',
        inputPlaceholder: 'Type your message here...',
        containerId: CONTAINER_ID,
        onAuthError: fetchToken,
        widgets: window.ChatWidget!.getVendorCardsWidget(false),
      });

      setHasInitialized(true);
    };

    init();

    return () => {
      window.ChatWidget?.destroy();
    };
  }, []);

  return <div id={CONTAINER_ID} className="flex-1 overflow-hidden" />;
}
