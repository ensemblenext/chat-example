'use client';
import { useEffect, useRef, useState } from 'react';
import type { EmbeddableChatWidgetConfig } from '@ensembleapp/client-sdk';
import { customChatWidgets } from '@/components/widgets/chat-widgets';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBanner } from '@/components/ErrorBanner';
import { fetchChatToken } from '@/lib/api-utils';

function DashboardExamplePage() {
  const { getIdToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          threadId: `dashboard-example`,
          agentId: process.env.NEXT_PUBLIC_AGENT_ID ?? '',
          initialUserMessage: 'Hello World',
          inputPlaceholder: 'Type your message here...',
          anchor: { enabled: false },
          containerId: 'chat-container',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      try {
        window.ChatWidget?.destroy?.();
      } catch (err) {
        console.error('Failed to destroy chat widget on unmount', err);
      }
    };
  }, []);

  // Mock data
  const stats = [
    { label: 'Total Revenue', value: '$124,592', change: '+12.5%', positive: true },
    { label: 'Active Users', value: '8,429', change: '+8.2%', positive: true },
    { label: 'Conversion Rate', value: '3.24%', change: '-0.4%', positive: false },
    { label: 'Avg. Order Value', value: '$89.50', change: '+5.1%', positive: true },
  ];

  const recentOrders = [
    { id: '#12847', customer: 'Sarah Johnson', amount: '$245.00', status: 'Completed', date: 'Feb 26' },
    { id: '#12846', customer: 'Michael Chen', amount: '$189.50', status: 'Processing', date: 'Feb 26' },
    { id: '#12845', customer: 'Emma Wilson', amount: '$312.00', status: 'Completed', date: 'Feb 25' },
    { id: '#12844', customer: 'James Brown', amount: '$156.75', status: 'Shipped', date: 'Feb 25' },
    { id: '#12843', customer: 'Lisa Anderson', amount: '$428.00', status: 'Completed', date: 'Feb 24' },
  ];

  const topProducts = [
    { name: 'Premium Headphones', sales: 234, revenue: '$23,400' },
    { name: 'Wireless Keyboard', sales: 187, revenue: '$14,960' },
    { name: 'USB-C Hub', sales: 156, revenue: '$7,800' },
    { name: 'Monitor Stand', sales: 143, revenue: '$8,580' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {/* Main Dashboard Content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            <Link href="/" className="hover:text-slate-700">HOME</Link>
            <span className="mx-1">{'>'}</span>
            DASHBOARD EXAMPLE
          </p>
          <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
          <p className="text-slate-500 text-sm">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm">
              <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className={`text-sm mt-1 ${stat.positive ? 'text-green-600' : 'text-red-500'}`}>
                {stat.change} from last month
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Chart Placeholder */}
          <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Revenue Overview</h2>
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {[65, 45, 75, 50, 80, 60, 90, 70, 85, 55, 95, 75].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-slate-400">
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Top Products</h2>
            <div className="space-y-4">
              {topProducts.map((product, i) => (
                <div key={product.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                    <p className="text-xs text-slate-400">{product.sales} sales</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{product.revenue}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Orders</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b">
                <th className="pb-3 font-medium">Order ID</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-3 text-sm font-medium text-slate-800">{order.id}</td>
                  <td className="py-3 text-sm text-slate-600">{order.customer}</td>
                  <td className="py-3 text-sm font-medium text-slate-800">{order.amount}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-slate-500">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chat Side Panel */}
      <div className="w-[400px] bg-white border-l border-slate-200 flex flex-col">
        <div id="chat-container" className="flex-1 overflow-hidden" />
      </div>
    </div>
  );
}

export default function DashboardExamplePageWrapper() {
  return (
    <ProtectedRoute>
      <DashboardExamplePage />
    </ProtectedRoute>
  );
}
