'use client';
import { useState } from 'react';
import type { EmbeddableChatWidgetConfig } from '@ensembleapp/client-sdk';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBanner } from '@/components/ErrorBanner';
import { ChatPopup, useChatPopup } from './ChatPopup';

/**
 * Simple example of using the chat widget as a pop up
 */
function AcmeExamplePage() {
  const [error, setError] = useState<string | null>(null);
  const [dataContext] = useState<EmbeddableChatWidgetConfig['dataContext']>({
    name: 'ACME Corp',
    location: '123 Main St, Springfield',
  });
  const { show: showChat } = useChatPopup();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      <ChatPopup
        threadId="acme-example"
        dataContext={dataContext}
        onError={setError}
      />

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
