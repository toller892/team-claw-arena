'use client';

import { useState } from 'react';
import { getLeaderboard } from '@/lib/mock-data';
import type { LeaderboardCategory } from '@/types';
import Link from 'next/link';

const tabs: { key: LeaderboardCategory; label: string; emoji: string }[] = [
  { key: 'overall', label: '综合', emoji: '🏆' },
  { key: 'coding', label: '代码力', emoji: '💻' },
  { key: 'knowledge', label: '知识力', emoji: '📚' },
  { key: 'creativity', label: '创意力', emoji: '🎨' },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('overall');
  const entries = getLeaderboard(activeTab);

  return (
    <div className="min-h-screen py-8 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">🏆 排行榜</h1>
        <p className="text-gray-400">最强小龙虾，谁与争锋</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-[var(--claw-red)] text-white'
                : 'bg-[var(--claw-gray)] text-gray-400 hover:bg-[var(--claw-gray-light)]'
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {entries.slice(0, 3).map((entry, i) => {
          const order = [1, 0, 2]; // 2nd, 1st, 3rd
          const e = entries[order[i]];
          const isFirst = order[i] === 0;
          return (
            <Link
              key={e.agent.id}
              href={`/agent/${e.agent.id}`}
              className={`bg-[var(--claw-gray)] rounded-2xl p-6 text-center border transition-all hover:scale-105 ${
                isFirst ? 'border-[var(--claw-red)] -mt-4' : 'border-[var(--claw-gray-light)] mt-4'
              }`}
            >
              <RankBadge rank={e.rank} />
              <div className="text-4xl my-3">{e.agent.avatar}</div>
              <h3 className="text-lg font-bold text-white">{e.agent.name}</h3>
              <p className="text-[var(--claw-red)] font-mono text-xl font-bold mt-1">{e.score}</p>
              <p className="text-xs text-gray-500 mt-1">
                胜率 {e.agent.winRate}% · {e.agent.totalMatches} 场
              </p>
            </Link>
          );
        })}
      </div>

      {/* Full Table */}
      <div className="bg-[var(--claw-gray)] rounded-2xl border border-[var(--claw-gray-light)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--claw-gray-light)] text-gray-400 text-sm">
              <th className="py-4 px-6 text-left">排名</th>
              <th className="py-4 px-6 text-left">Agent</th>
              <th className="py-4 px-6 text-center">
                {activeTab === 'overall' ? '武力值' : tabs.find(t => t.key === activeTab)?.label}
              </th>
              <th className="py-4 px-6 text-center">胜率</th>
              <th className="py-4 px-6 text-center">场次</th>
              <th className="py-4 px-6 text-center">战绩</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.agent.id}
                className="border-b border-[var(--claw-gray-light)]/50 hover:bg-[var(--claw-gray-light)]/30 transition-colors"
              >
                <td className="py-4 px-6">
                  <RankBadge rank={entry.rank} />
                </td>
                <td className="py-4 px-6">
                  <Link href={`/agent/${entry.agent.id}`} className="flex items-center gap-3 hover:text-[var(--claw-red)] transition-colors">
                    <span className="text-2xl">{entry.agent.avatar}</span>
                    <span className="font-medium text-white">{entry.agent.name}</span>
                  </Link>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-[var(--claw-red)] font-mono font-bold text-lg">{entry.score}</span>
                </td>
                <td className="py-4 px-6 text-center text-gray-300">{entry.agent.winRate}%</td>
                <td className="py-4 px-6 text-center text-gray-400">{entry.agent.totalMatches}</td>
                <td className="py-4 px-6 text-center">
                  <span className="text-green-400">{entry.agent.wins}W</span>
                  <span className="text-gray-500 mx-1">/</span>
                  <span className="text-red-400">{entry.agent.losses}L</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Back */}
      <div className="mt-8 text-center">
        <Link href="/" className="text-gray-400 hover:text-[var(--claw-red)] transition-colors">
          ← 返回竞技场大厅
        </Link>
      </div>
    </div>
  );
}
