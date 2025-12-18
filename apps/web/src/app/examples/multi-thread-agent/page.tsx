'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { EmbeddableChatWidgetConfig } from '@ensembleapp/client-sdk';
import { Menu, Plus } from "lucide-react";
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

type Thread = { id: string; title: string; summary?: string };

const initialThreads: Thread[] = [
  { id: `demo-${Date.now()}-1`, title: 'Team standup summary', summary: 'Summarize daily notes into action items.' },
  { id: `demo-${Date.now()}-2`, title: 'Bug triage helper', summary: 'Categorize and prioritize new issues.' },
  { id: `demo-${Date.now()}-3`, title: 'Docs drafting', summary: 'Rewrite specs into concise docs.' },
];

function MultiThreadAgentExample() {
  const { getIdToken } = useAuth();
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [selectedThreadId, setSelectedThreadId] = useState<string>(initialThreads[0].id);
  const [token, setToken] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const configRef = useRef<EmbeddableChatWidgetConfig | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? threads[0],
    [threads, selectedThreadId],
  );

  const tokenEndpoint = process.env.NEXT_PUBLIC_TOKEN_ENDPOINT || '/api/chat-token';

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

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch token');
    }

    const data = await response.json();
    const newToken = data.token;
    setToken(newToken);
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

  const initChat = async () => {
    if (hasInitialized) return;

    try {
      await loadWidget();

      const currentToken = token ?? (await fetchToken());
      if (!selectedThread) return;

      if (!configRef.current) {
        configRef.current = {
          api: {
            baseUrl: 'https://service.ensembleapp.ai',
            token: currentToken!,
          },
          threadId: selectedThread.id,
          agentExecutionId: process.env.NEXT_PUBLIC_AGENT_EXECUTION_ID ?? '',
          onAuthError: handleAuthError,
          introMessage: 'Hello! How can I assist you today?',
          widgets: [],
          anchor: { enabled: false },
          containerId: 'chat-widget-container',
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
    if (!configRef.current || !selectedThread) {
      return;
    }

    configRef.current.threadId = selectedThread.id;

    if (hasInitialized) {
      window.ChatWidget?.updateConfig?.({
        threadId: selectedThread.id,
      });
    }
  }, [selectedThread, hasInitialized]);

  const addThread = () => {
    const count = threads.length + 1;
    const newThread: Thread = {
      id: `thread-${Date.now()}`,
      title: `New thread ${count}`,
      summary: 'Fresh conversation ready to start.',
    };
    setThreads((prev) => [newThread, ...prev]);
    setSelectedThreadId(newThread.id);
  };

  const handleSectionClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isSidebarOpen) return;
    if (sidebarRef.current && sidebarRef.current.contains(event.target as Node)) return;
    setIsSidebarOpen(false);
  };

  return (
    <div className="h-screen bg-slate-50 overflow-hidden">
      <div className="relative mx-auto flex h-full min-h-0 max-w-6xl flex-col gap-6 px-6 py-8 overflow-hidden">
        <header className="flex flex-col gap-2 flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Link href="/" className="hover:text-slate-700">HOME</Link>
            <span className="mx-1">{'>'}</span>
            EXAMPLE
          </p>
        </header>
        <section className="relative flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center text-slate-700 transition hover:text-slate-500"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  aria-label="Toggle thread list"
                >
                  <Menu className={`h-5 w-5 transition-transform duration-200 ${isSidebarOpen ? 'rotate-90' : ''}`} />
                </button>
                <h2 className="text-xl font-semibold text-slate-900">{selectedThread?.title}</h2>
              </div>
            </div>
          </div>
          <div
            className="relative flex-1 min-h-0 min-w-0"
            onClick={handleSectionClick}
          >
            <aside
              ref={sidebarRef}
              className={`absolute inset-y-0 left-0 z-30 flex h-full min-h-0 w-[280px] flex-col rounded-r-2xl border border-slate-200 bg-white p-4 shadow-xl transition-transform duration-200 ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-[320px]'
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
            <button
              type="button"
              onClick={addThread}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-transparent px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              <span>New</span>
            </button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {threads.map((thread) => {
                  const isActive = thread.id === selectedThread?.id;
                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => {
                        setSelectedThreadId(thread.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        isActive
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-[3px] rounded-full ${isActive ? 'bg-blue-600' : 'bg-transparent'} self-stretch`}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{thread.title}</div>
                          {thread.summary ? (
                            <div className="mt-1 text-xs text-slate-600 line-clamp-1">{thread.summary}</div>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div
              id="chat-widget-container"
              className="h-full w-full"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default function MultiThreadAgentExampleWrapper() {
  return (
    <ProtectedRoute>
      <MultiThreadAgentExample />
    </ProtectedRoute>
  );
}
