'use client';

import { useRef, useState } from 'react';

// Global widget types (loaded via script tag)
interface EmbeddableChatWidgetConfig {
  api: string;
  containerId?: string;
  headers?: Record<string, string>;
  threadId?: string;
  title?: string;
  introMessage?: string;
  inputPlaceholder?: string;
}

declare global {
  interface Window {
    chatWidgetConfig: EmbeddableChatWidgetConfig;
    ChatWidget?: {
      init: (config: EmbeddableChatWidgetConfig) => Promise<void>;
      destroy: () => void;
      hide: () => void;
      show: () => void;
      updateConfig: (config: Partial<EmbeddableChatWidgetConfig>) => void;
    };
  }
}

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const configRef = useRef<typeof window.chatWidgetConfig | null>(null);

  const loadWidget = () =>
    new Promise<void>((resolve, reject) => {
      // TODO: on CDN with versioning
      const widgetURL = '/widget/widget.global.js';
      
      if (window.ChatWidget || document.querySelector(`script[src="${widgetURL}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = widgetURL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load chat widget'));
      document.head.appendChild(script);
    });

  const openChat = async () => {
    try {
      await loadWidget();

      let currentToken = token;
      if (!currentToken) {
        // point to your Server endpoint here. JSON response should be { "token": "abcd..."}
        currentToken = await fetch('http://<customer-server>/chat-token', { method: 'POST' })
          .then((r) => r.json().then(data => data.token))
          .catch((err) => {
            console.error('Failed to fetch chat token', err);
            throw err;
          });
        setToken(currentToken);
      }

      if (!configRef.current) {
        configRef.current = {
          api: 'https://<ensemble-server>',
          headers: {
            Authorization: `Bearer ${currentToken}`,
            threadid: 'session123',
            agentid: 'agent456',
          },
          threadId: 'session123',
          title: 'Support Agent',
          // specify the container for the chat widget
          containerId: 'chat-widget-container',
        };
      }

      setIsChatOpen(true);

      // Wait for DOM element to be available before initializing widget
      const initWidget = () => {
        const container = document.getElementById('chat-widget-container');
        if (container) {
          if (!hasInitialized && configRef.current) {
            window.chatWidgetConfig = configRef.current;
            window.ChatWidget?.init?.(configRef.current);
            setHasInitialized(true);
          } else if (window.ChatWidget) {
            window.ChatWidget.show();
          }
        } else {
          // Container not ready yet, try again in next frame
          setTimeout(initWidget, 10);
        }
      };
      setTimeout(initWidget, 0);
    } catch (error) {
      console.error('Failed to open chat widget', error);
    }
  };

  const closeChat = () => {
    if (window.ChatWidget) {
      window.ChatWidget.hide();
    }
    setIsChatOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome to ACME</h1>
        <p className="text-lg text-center text-gray-600">Click the chat bubble to get started</p>
      </div>

      <button
        onClick={() => isChatOpen ? closeChat() : openChat()}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <svg
          className="w-6 h-6"
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

      <div className={`fixed bottom-24 right-6 ${isChatOpen ? 'block' : 'hidden'}`}>
        {isChatOpen && (
          <button
            onClick={closeChat}
            className="absolute -top-3 -right-3 w-8 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center z-10"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        {/* Container for the chat widget. Its ID should be specified in the config */}
        <div
          id="chat-widget-container"
          className="w-96 h-[28rem] bg-white rounded-lg shadow-xl overflow-hidden"
        />
      </div>
    </div>
  );
}
