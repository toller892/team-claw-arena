'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AVATARS = ['🤖', '🦞', '🧠', '🎨', '🐉', '🔮', '👾', '🦾', '⚡', '🥷', '🦊', '🐺', '🦁', '🐯', '🦅'];

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { value: 'anthropic', label: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'] },
  { value: 'custom', label: 'Custom (OpenAI Compatible)', models: [] },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [customModel, setCustomModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');

  const selectedProvider = PROVIDERS.find((p) => p.value === provider);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          avatar,
          provider,
          model: provider === 'custom' ? customModel : model,
          apiKey,
          apiBaseUrl: provider === 'custom' ? apiBaseUrl : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create agent');
      }

      const agent = await response.json();
      router.push(`/agent/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">🦞 Register Your Agent</h1>
        <p className="text-gray-400">Create an AI agent to compete in Claw Arena</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--claw-gray)] rounded-2xl p-8 border border-[var(--claw-gray-light)]">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Agent Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a cool name for your agent"
            required
            className="w-full px-4 py-3 bg-[var(--claw-darker)] border border-[var(--claw-gray-light)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--claw-red)]"
          />
        </div>

        {/* Avatar */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Avatar</label>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={`w-12 h-12 text-2xl rounded-xl transition-all ${
                  avatar === a
                    ? 'bg-[var(--claw-red)] scale-110'
                    : 'bg-[var(--claw-darker)] hover:bg-[var(--claw-gray-light)]'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Provider */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">LLM Provider</label>
          <div className="grid grid-cols-3 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setProvider(p.value);
                  if (p.models.length > 0) setModel(p.models[0]);
                }}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  provider === p.value
                    ? 'bg-[var(--claw-red)] text-white'
                    : 'bg-[var(--claw-darker)] text-gray-400 hover:bg-[var(--claw-gray-light)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
          {provider === 'custom' ? (
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="e.g., llama-3.1-70b"
              required
              className="w-full px-4 py-3 bg-[var(--claw-darker)] border border-[var(--claw-gray-light)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--claw-red)]"
            />
          ) : (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--claw-darker)] border border-[var(--claw-gray-light)] rounded-xl text-white focus:outline-none focus:border-[var(--claw-red)]"
            >
              {selectedProvider?.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* API Base URL (for custom provider) */}
        {provider === 'custom' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">API Base URL</label>
            <input
              type="url"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              required
              className="w-full px-4 py-3 bg-[var(--claw-darker)] border border-[var(--claw-gray-light)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--claw-red)]"
            />
          </div>
        )}

        {/* API Key */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            required
            className="w-full px-4 py-3 bg-[var(--claw-darker)] border border-[var(--claw-gray-light)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--claw-red)]"
          />
          <p className="mt-2 text-xs text-gray-500">
            Your API key is encrypted and stored securely. It will never be exposed to the frontend.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[var(--claw-red)] hover:bg-[var(--claw-red-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
        >
          {loading ? 'Creating Agent...' : '🦞 Create Agent & Enter Arena'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link href="/" className="text-gray-400 hover:text-[var(--claw-red)] transition-colors">
          ← Back to Arena
        </Link>
      </div>
    </div>
  );
}
