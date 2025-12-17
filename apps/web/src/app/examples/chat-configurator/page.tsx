'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { EmbeddableChatWidgetConfig } from '@ensembleapp/client-sdk';
import Link from 'next/link';

type Mode = 'popup' | 'embedded';

type ConfigState = {
  mode: Mode;
  title: string;
  threadId: string;
  agentExecutionId: string;
  introMessage: string;
  inputPlaceholder: string;
  primaryColor: string;
  headerTextColor: string;
};

const DEFAULT_AGENT_EXECUTION_ID = '8AZviohTgTscP2rOQGkh';

export default function ChatConfiguratorExample() {
  const [token, setToken] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [configState, setConfigState] = useState<ConfigState>({
    mode: 'popup',
    title: 'Configurable Agent',
    threadId: 'config-thread',
    agentExecutionId: DEFAULT_AGENT_EXECUTION_ID,
    introMessage: 'Hi there! How can I assist you today?',
    inputPlaceholder: 'Ask me anything…',
    primaryColor: '#2563eb',
    headerTextColor: '#111827',
  });
  const configRef = useRef<EmbeddableChatWidgetConfig | null>(null);
  const lastModeRef = useRef<Mode>('popup');

  const tokenEndpoint = process.env.NEXT_PUBLIC_TOKEN_ENDPOINT;

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

    const newToken = await fetch(tokenEndpoint, { method: 'POST' }).then((r) =>
      r.json().then((data) => data.token),
    );
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

  const buildConfig = (currentToken: string): EmbeddableChatWidgetConfig => {
    const isEmbedded = configState.mode === 'embedded';
    const baseConfig: EmbeddableChatWidgetConfig = {
      api: {
        baseUrl: 'https://service.ensembleapp.ai',
        token: currentToken,
      },
      threadId: configState.threadId,
      agentExecutionId: configState.agentExecutionId,
      title: configState.title,
      introMessage: configState.introMessage,
      inputPlaceholder: configState.inputPlaceholder,
      styles: {
        primaryColor: configState.primaryColor,
        headerTextColor: configState.headerTextColor,
      },
      onAuthError: handleAuthError,
      anchor: isEmbedded
        ? { enabled: false }
        : { enabled: true },
      containerId: isEmbedded ? 'configurator-container' : undefined,
      popupSize: {
        width: '800px',
      },
    };
    return baseConfig;
  };

  const initChat = async () => {
    if (hasInitialized) return;

    try {
      await loadWidget();
      const currentToken = token ?? (await fetchToken());
      const config = buildConfig(currentToken);
      configRef.current = config;
      window.chatWidgetConfig = config;
      await window.ChatWidget?.init?.(config);
      setHasInitialized(true);
    } catch (error) {
      console.error('Failed to initialize chat widget', error);
    }
  };

  useEffect(() => {
    void initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update config without full reload for non-structural changes
  useEffect(() => {
    if (!hasInitialized || !configRef.current) return;

    try {
      const partialConfig = buildConfig(configRef.current.api.token);
      configRef.current = { ...configRef.current, ...partialConfig };

      // Try updateConfig first, fallback to manual property updates
      if (window.ChatWidget?.updateConfig) {
        window.ChatWidget.updateConfig(partialConfig);
      } else if (window.ChatWidget) {
        // Manual update of specific properties if updateConfig doesn't exist
        Object.assign(window.ChatWidget, partialConfig);
      }
    } catch (err) {
      console.warn('Failed to update widget config', err);
    }
  }, [hasInitialized, configState.title, configState.threadId, configState.agentExecutionId, configState.introMessage, configState.inputPlaceholder, configState.primaryColor, configState.headerTextColor, buildConfig]);

  // Full reload only when switching modes (popup/embedded)
  useEffect(() => {
    if (!hasInitialized) return;
    if (lastModeRef.current === configState.mode) return; // No mode change

    const reloadForMode = async () => {
      try {
        const currentToken = configRef.current?.api.token ?? token ?? (await fetchToken());
        if (configState.mode === 'embedded' && !document.getElementById('configurator-container')) {
          // Wait for the embedded container to exist before initializing.
          return;
        }

        // Try to properly destroy first, then force cleanup if needed
        if (window.ChatWidget?.destroy) {
          try {
            // window.ChatWidget.destroy();
            console.log('Widget destroyed successfully');
          } catch (err) {
            console.warn('Destroy failed, forcing cleanup:', err?.message || err);
            // Force cleanup without calling destroy() to avoid DOM issues
            delete window.ChatWidget;
          }
        } else if (window.ChatWidget) {
          delete window.ChatWidget;
        }

        // Clean up any remaining DOM elements more aggressively
        const container = document.getElementById('configurator-container');
        if (container) {
          container.innerHTML = '';
        }

        // Remove all possible widget-related DOM nodes
        const selectors = [
          '[data-chat-widget]',
          '.chat-widget-overlay',
          '.chat-widget-popup',
          '.chat-widget-container',
          '.chat-widget-anchor',
          '[id*="chat"]',
          '[class*="chat-widget"]'
        ];

        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(node => {
            try {
              node.remove();
              console.log(`Removed node: ${selector}`);
            } catch (e) {
              console.warn(`Failed to remove node ${selector}:`, e);
            }
          });
        });

        // Longer delay to ensure cleanup completes
        await new Promise(resolve => setTimeout(resolve, 300));

        // Reload the widget
        await loadWidget();
        console.log('Widget script reloaded');

        const freshConfig = buildConfig(currentToken);
        console.log('Fresh config for mode:', configState.mode, freshConfig);

        configRef.current = freshConfig;
        window.chatWidgetConfig = freshConfig;

        if (window.ChatWidget && typeof window.ChatWidget.init === 'function') {
          await window.ChatWidget.init(freshConfig);
          console.log('Widget initialized successfully in', configState.mode, 'mode');
        } else {
          console.error('ChatWidget.init not available');
        }
        lastModeRef.current = configState.mode;
      } catch (err) {
        console.error('Failed to reload chat widget for mode change', err);
      }
    };

    void reloadForMode();
  }, [configState.mode, hasInitialized, buildConfig, fetchToken, token]);

  const handleChange = <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => {
    setConfigState((prev) => ({ ...prev, [key]: value }));
  };

  const formRows = useMemo(
    () => [
      {
        label: 'Thread Id',
        input: (
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            value={configState.threadId}
            onChange={(e) => handleChange('threadId', e.target.value)}
          />
        ),
      },
      {
        label: 'Agent Execution Id',
        input: (
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            value={configState.agentExecutionId}
            onChange={(e) => handleChange('agentExecutionId', e.target.value)}
          />
        ),
      },
      {
        label: 'Mode',
        input: (
          <div>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              value={configState.mode}
              onChange={(e) => handleChange('mode', e.target.value as Mode)}
              disabled={configState.mode === 'embedded'}
            >
              <option value="popup">Popup</option>
              <option value="embedded">Embedded</option>
            </select>
            {configState.mode === 'embedded' && (
              <p className="mt-1 text-xs text-slate-500">
                Reload browser to reset mode
              </p>
            )}
          </div>
        ),
      },
      {
        label: 'Title',
        input: (
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            value={configState.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        ),
      },
      {
        label: 'Intro Message',
        input: (
          <div>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              value={configState.introMessage}
              rows={2}
              onChange={(e) => handleChange('introMessage', e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
                applicable only for new conversations
            </p>
          </div>
        ),
      },
      {
        label: 'Input Placeholder',
        input: (
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            value={configState.inputPlaceholder}
            onChange={(e) => handleChange('inputPlaceholder', e.target.value)}
          />
        ),
      },
      {
        label: 'Primary Color',
        input: (
          <input
            type="color"
            className="h-10 w-16 rounded border border-slate-200"
            value={configState.primaryColor}
            onChange={(e) => handleChange('primaryColor', e.target.value)}
          />
        ),
      },
      {
        label: 'Header Text Color',
        input: (
          <input
            type="color"
            className="h-10 w-16 rounded border border-slate-200"
            value={configState.headerTextColor}
            onChange={(e) => handleChange('headerTextColor', e.target.value)}
          />
        ),
      },
    ],
    [configState],
  );

  return (
    <div className="h-screen bg-slate-50 overflow-hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 h-full">
        <header className="flex flex-col gap-2 flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Link href="/" className="hover:text-slate-700">HOME</Link>
            <span className="mx-1">{'>'}</span>
            EXAMPLE
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Chat Configurator</h1>
          <p className="text-sm text-slate-600">
            Adjust the EmbeddableChatWidgetConfig controls and see the chat update instantly.
          </p>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row flex-1 min-h-0">
          <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-[280px] flex flex-col">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 p-4 pb-0">Configuration</h2>
            <div className="flex-1 overflow-y-auto p-4 pt-0">
              <div className="space-y-3">
                {formRows.map((row) => (
                  <label key={row.label} className="block text-sm">
                    <span className="text-slate-700">{row.label}</span>
                    <div className="mt-1">{row.input}</div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col lg:min-h-0">
            {configState.mode === 'popup' && (
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live preview</p>
              </div>
            )}
            <div className="relative flex-1 flex overflow-hidden">
              {configState.mode === 'embedded' ? (
                <div id="configurator-container" className="absolute inset-0 w-full h-full" />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-6 text-md text-slate-600">
                  Please use the chat bubble in popup mode
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
