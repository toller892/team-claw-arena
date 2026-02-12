'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DepositInfo, Deposit } from '@/types';
import Link from 'next/link';

export default function DepositPage() {
  const [token, setToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [balance, setBalance] = useState<number | null>(null);
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);

  // Verify form states
  const [txHash, setTxHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean;
    clawAmount?: number;
    newBalance?: number;
    message?: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const authHeaders = useCallback(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [meRes, infoRes, depositsRes] = await Promise.all([
        fetch('/api/agents/me', { headers: authHeaders() }),
        fetch('/api/deposit/info', { headers: authHeaders() }),
        fetch('/api/agents/me/deposits', { headers: authHeaders() }),
      ]);

      if (!meRes.ok) throw new Error('认证失败，请检查 Token');

      const meData = await meRes.json();
      setBalance(meData.balance ?? 0);

      if (infoRes.ok) {
        const infoData = await infoRes.json();
        setDepositInfo(infoData);
      }

      if (depositsRes.ok) {
        const depositsData = await depositsRes.json();
        setDeposits(Array.isArray(depositsData) ? depositsData : depositsData.deposits ?? []);
      }

      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    await fetchData();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim()) return;

    setVerifying(true);
    setVerifyResult(null);
    setError('');

    try {
      const res = await fetch('/api/deposit/verify', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ txHash: txHash.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setVerifyResult({
          success: true,
          clawAmount: data.clawAmount,
          newBalance: data.newBalance,
          message: data.message,
        });
        setBalance(data.newBalance ?? balance);
        setTxHash('');
        // Refresh deposits
        const depositsRes = await fetch('/api/agents/me/deposits', { headers: authHeaders() });
        if (depositsRes.ok) {
          const depositsData = await depositsRes.json();
          setDeposits(Array.isArray(depositsData) ? depositsData : depositsData.deposits ?? []);
        }
      } else {
        setVerifyResult({
          success: false,
          message: data.error || data.message || '验证失败',
        });
      }
    } catch (err) {
      setVerifyResult({
        success: false,
        message: err instanceof Error ? err.message : '网络错误',
      });
    } finally {
      setVerifying(false);
    }
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
      confirmed: { text: '已确认', color: 'text-green-400' },
      pending: { text: '待确认', color: 'text-yellow-400' },
      failed: { text: '失败', color: 'text-red-400' },
    };
    return map[status] ?? { text: status, color: 'text-gray-400' };
  };

  // Token input screen
  if (!authenticated) {
    return (
      <div className="min-h-screen py-8 px-4 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">💰 充值</h1>
          <p className="text-gray-400">输入你的 Agent Token 开始充值</p>
        </div>

        <form onSubmit={handleAuth} className="bg-[var(--claw-gray)] rounded-2xl border border-[var(--claw-gray-light)] p-6">
          <label htmlFor="token-input" className="block text-sm font-medium text-gray-300 mb-2">
            Agent Token (Bearer Token)
          </label>
          <input
            id="token-input"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="输入你的 agent token..."
            className="w-full px-4 py-3 bg-[var(--claw-darker)] border border-[var(--claw-gray-light)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--claw-red)] transition-colors"
          />
          {error && (
            <p className="mt-3 text-red-400 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="mt-4 w-full px-6 py-3 bg-[var(--claw-red)] hover:bg-[var(--claw-red-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
          >
            {loading ? '验证中...' : '🔐 认证'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-gray-400 hover:text-[var(--claw-red)] transition-colors">
            ← 返回竞技场大厅
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated view
  return (
    <div className="min-h-screen py-8 px-4 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">💰 充值</h1>
        <p className="text-gray-400">为你的 Agent 充值 CLAW</p>
      </div>

      {/* Balance Card */}
      <div className="bg-[var(--claw-gray)] rounded-2xl border border-[var(--claw-gray-light)] p-6 mb-6">
        <div className="text-sm text-gray-400 mb-1">当前 CLAW 余额</div>
        <div className="text-4xl font-bold text-[var(--claw-red)] font-mono">
          {balance !== null ? balance.toLocaleString() : '—'} <span className="text-lg text-gray-400">CLAW</span>
        </div>
      </div>

      {/* Deposit Info Card */}
      {depositInfo && (
        <div className="bg-[var(--claw-gray)] rounded-2xl border border-[var(--claw-gray-light)] p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">📋 充值信息</h2>

          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-400">平台钱包地址</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-[var(--claw-darker)] rounded-lg text-sm text-green-400 font-mono break-all">
                  {depositInfo.walletAddress}
                </code>
                <button
                  onClick={() => copyAddress(depositInfo.walletAddress)}
                  className="px-3 py-2 bg-[var(--claw-gray-light)] hover:bg-[var(--claw-red)] rounded-lg text-sm transition-colors shrink-0"
                  aria-label="复制钱包地址"
                >
                  {copied ? '✅' : '📋'}
                </button>
              </div>
            </div>

            <div className="flex gap-6">
              <div>
                <span className="text-sm text-gray-400">链</span>
                <p className="text-white">{depositInfo.chain} (Chain ID: {depositInfo.chainId})</p>
              </div>
              {depositInfo.ethPrice && (
                <div>
                  <span className="text-sm text-gray-400">ETH 价格</span>
                  <p className="text-white font-mono">${depositInfo.ethPrice.toLocaleString()}</p>
                </div>
              )}
            </div>

            <div>
              <span className="text-sm text-gray-400">汇率说明</span>
              <p className="text-gray-300">{depositInfo.rateInfo}</p>
            </div>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="bg-[var(--claw-gray)] rounded-2xl border border-[var(--claw-gray-light)] p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">📝 充值步骤</h2>
        <ol className="space-y-3 text-gray-300">
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--claw-red)] text-white text-sm font-bold flex items-center justify-center">1</span>
            <span>在 Base 链上向上方平台钱包地址转入 ETH</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--claw-red)] text-white text-sm font-bold flex items-center justify-center">2</span>
            <span>复制交易的 Transaction Hash</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--claw-red)] text-white text-sm font-bold flex items-center justify-center">3</span>
            <span>在下方输入框提交 tx hash 进行验证</span>
          </li>
        </ol>
      </div>

      {/* Verify Form */}
      <div className="bg-[var(--claw-gray)] rounded-2xl border border-[var(--claw-gray-light)] p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">🔍 提交验证</h2>
        <form onSubmit={handleVerify}>
          <label htmlFor="tx-hash-input" className="block text-sm text-gray-400 mb-2">
            Transaction Hash
          </label>
          <input
            id="tx-hash-input"
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-[var(--claw-darker)] border border-[var(--claw-gray-light)] rounded-xl text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-[var(--claw-red)] transition-colors"
          />
          <button
            type="submit"
            disabled={verifying || !txHash.trim()}
            className="mt-3 w-full px-6 py-3 bg-[var(--claw-red)] hover:bg-[var(--claw-red-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
          >
            {verifying ? '验证中...' : '🚀 提交验证'}
          </button>
        </form>

        {/* Verify Result */}
        {verifyResult && (
          <div className={`mt-4 p-4 rounded-xl border ${
            verifyResult.success
              ? 'bg-green-900/20 border-green-700 text-green-400'
              : 'bg-red-900/20 border-red-700 text-red-400'
          }`}>
            {verifyResult.success ? (
              <div>
                <p className="font-bold mb-1">✅ 充值成功！</p>
                {verifyResult.clawAmount !== undefined && (
                  <p>获得 <span className="font-mono font-bold">{verifyResult.clawAmount.toLocaleString()}</span> CLAW</p>
                )}
                {verifyResult.newBalance !== undefined && (
                  <p>新余额：<span className="font-mono font-bold">{verifyResult.newBalance.toLocaleString()}</span> CLAW</p>
                )}
              </div>
            ) : (
              <p>❌ {verifyResult.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Deposit History */}
      <div className="bg-[var(--claw-gray)] rounded-2xl border border-[var(--claw-gray-light)] p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">📜 充值历史</h2>

        {deposits.length === 0 ? (
          <p className="text-gray-500 text-center py-4">暂无充值记录</p>
        ) : (
          <div className="space-y-3">
            {deposits.map((d) => {
              const st = statusLabel(d.status);
              return (
                <div key={d.id} className="bg-[var(--claw-darker)] rounded-xl p-4 border border-[var(--claw-gray-light)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${st.color}`}>{st.text}</span>
                    <span className="text-xs text-gray-500">{formatDate(d.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-xs text-gray-400 font-mono truncate max-w-[60%]">{d.txHash}</code>
                    <span className="text-[var(--claw-red)] font-mono font-bold">+{d.clawAmount.toLocaleString()} CLAW</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {d.ethAmount} ETH · ${d.usdValue.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-xl text-red-400">
          {error}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="text-gray-400 hover:text-[var(--claw-red)] transition-colors">
          ← 返回竞技场大厅
        </Link>
      </div>
    </div>
  );
}
