'use client';
import { useEffect, useRef, useState } from 'react';
import type { EmbeddableChatWidgetConfig } from '@ensembleapp/client-sdk';
import { customChatWidgets } from '@/components/widgets/chat-widgets';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBanner } from '@/components/ErrorBanner';
import { fetchChatToken } from '@/lib/api-utils';

/**
 * Simple example of using the chat widget as a pop up
 */
function AcmeExamplePage() {
  const { getIdToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataContext, setDataContext] = useState<EmbeddableChatWidgetConfig['dataContext']>({
    name: 'ACME Corp',
    location: '123 Main St, Springfield',
  });
  const configRef = useRef<EmbeddableChatWidgetConfig | null>(null);

  useEffect(() => {
    if (window.chatWidgetConfig?.dataContext) {
      setDataContext(window.chatWidgetConfig.dataContext);
    }
  }, []);

  const tokenEndpoint = process.env.NEXT_PUBLIC_TOKEN_ENDPOINT || '/api/chat-token';

  // load widget from URL
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

  const fetchToken = async (): Promise<string> => {
    if (!tokenEndpoint) {
      throw new Error('Token endpoint is not configured (set NEXT_PUBLIC_TOKEN_ENDPOINT).');
    }

    const firebaseToken = await getIdToken();
    if (!firebaseToken) {
      throw new Error('Not authenticated');
    }

    const { token: newToken, error: fetchError } = await fetchChatToken(tokenEndpoint, firebaseToken);

    if (fetchError) {
      setError(fetchError);
      throw new Error(fetchError);
    }

    setToken(newToken);
    setError(null);
    return newToken;
  };

  const handleAuthError = async () => {
    try {
      const newToken = await fetchToken();
      if (!configRef.current) {
        throw new Error('Chat widget config is not initialized.');
      }
      configRef.current.api.token = newToken;
      window.ChatWidget?.updateConfig?.({
        api: { ...configRef.current.api, token: newToken },
      });
      return newToken;
    } catch (err) {
      console.error('Failed to refresh chat token', err);
    }
  };

  // initialize chat widget
  const initChat = async () => {
    if (hasInitialized) {
      return;
    }

    try {
      await loadWidget();

      const currentToken = token ?? (await fetchToken());

      if (!configRef.current) {
        configRef.current = {
          api: {
            baseUrl: process.env.NEXT_PUBLIC_CHAT_BASE_URL!,
            token: currentToken!,
          },
          threadId: `acme-example`,
          agentId: process.env.NEXT_PUBLIC_AGENT_ID ?? '',
          title: 'Support Agent',
          introMessage: 'Hello! How can I assist you today?',
          inputPlaceholder: 'Type your message here...',
          anchor: {
            enabled: true,
            initiallyOpen: false,
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
          // specify the container for the chat widget
          // containerId is not needed for the popup version
          containerId: undefined,
          popupSize: {
            width: '800px',
          }
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
    // We intentionally run init once on mount; dependencies would cause re-init churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // remove the chat widget on navigating away. Don't do this if you want the chat to persist across pages
  useEffect(() => {
    return () => {
      try {
        window.ChatWidget?.destroy?.();
      } catch (err) {
        console.error('Failed to destroy chat widget on unmount', err);
      }
    };
  }, []);

  useEffect(() => {
    if (!configRef.current) {
      return;
    }

    configRef.current.dataContext = dataContext;

    if (hasInitialized) {
      window.ChatWidget?.updateConfig?.({ dataContext });
    }
  }, [dataContext, hasInitialized]);

  const showChat = async () => {
    await initChat();
    window.ChatWidget?.show?.();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {/* Static Content Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-6">
            <Link href="/" className="hover:text-slate-700">HOME</Link>
            <span className="mx-1">{'>'}</span>
            EXAMPLE
          </p>
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
              onClick={showChat}
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
    </div>
  );
}

export default function AcmeExamplePageWrapper() {
  return (
    <ProtectedRoute>
      <AcmeExamplePage />
    </ProtectedRoute>
  );
}
