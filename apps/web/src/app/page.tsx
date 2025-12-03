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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Static Content Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-blue-600 mb-6">
            Welcome to ACME
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Transform your business with our cutting-edge solutions. Experience the power of innovation with ACME&apos;s comprehensive platform.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-4 text-blue-400">Lightning Fast</h3>
            <p className="text-gray-600">
              Experience blazing-fast performance with our optimized infrastructure. Get results in milliseconds.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-4 text-green-400">Reliable & Secure</h3>
            <p className="text-gray-600">
              Built with enterprise-grade security and 99.9% uptime guarantee. Your data is safe with us.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-4 text-purple-400">Easy to Use</h3>
            <p className="text-gray-600">
              Intuitive interface designed for everyone. No technical expertise required.
            </p>
          </div>
        </div>

        <div className="text-center bg-white rounded-2xl p-12 shadow-lg">
          <h2 className="text-3xl font-bold mb-4 text-blue-600">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6">Click the chat bubble to connect with our support team</p>
          <div className="flex justify-center">
            <button
              onClick={openChat}
              className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors cursor-pointer"
            >
              <span>Chat with us</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => isChatOpen ? closeChat() : openChat()}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center"
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
