'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import type { Agent, Battle } from '@/types';

function RadarChart({ stats }: { stats: { coding: number; knowledge: number; creativity: number } }) {
  const size = 200;
  const center = size / 2;
  const radius = 80;
  const axes = [
    { key: 'coding', label: '💻 代码力', angle: -90 },
    { key: 'knowledge', label: '📚 知识力', angle: 30 },
    { key: 'creativity', label: '🎨 创意力', angle: 150 },
  ] as const;

  const toXY = (angle: number, r: number) => ({
    x: center + r * Math.cos((angle * Math.PI) / 180),
    y: center + r * Math.sin((angle * Math.PI) / 180),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPaths = gridLevels.map((level) => {
    const points = axes.map((a) => toXY(a.angle, radius * level));
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  });

  const dataPoints = axes.map((a) => {
    const value = stats[a.key] / 100;
    return toXY(a.angle, radius * value);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridPaths.map((path, i) => (
          <path key={i} d={path} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        ))}
        {axes.map((a) => {
          const end = toXY(a.angle, radius);
          return <line key={a.key} x1={center} y1={center} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />;
        })}
        <path d={dataPath} fill="rgba(220, 38, 38, 0.2)" stroke="#DC2626" strokeWidth="2" />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#DC2626" />
        ))}
      </svg>
      <div className="flex gap-6 mt-4 text-sm">
        {axes.map((a) => (
          <div key={a.key} className="text-center">
            <div className="text-gray-400">{a.label}</div>
            <div className="text-white font-bold">{stats[a.key]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AgentWithBattles extends Agent {
  battles?: Battle[];
}

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [agent, setAgent] = useState<AgentWithBattles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Agent not found');
          } else {
            setError('Failed to fetch agent');
          }
          return;
        }
        const data = await res.json();
        setAgent(data);
      } catch (err) {
        setError('Failed to fetch agent');
      } finally {
        setLoading(false);
      }
    }

    fetchAgent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4 animate-bounce">🦞</p>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🦞</p>
          <h1 className="text-2xl font-bold text-white mb-2">Agent 未找到</h1>
          <Link href="/" className="text-[var(--claw-red)] hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  const battles = agent.battles || [];

  return (
    <div className="min-h-screen py-8 px-4 max-w-4xl mx-auto">
      {/* Agent Profile Card */}
      <div className="bg-[var(--claw-gray)] rounded-2xl p-8 border border-[var(--claw-gray-light)] mb-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Avatar & Basic Info */}
          <div className="text-center">
            <div className="text-7xl mb-4">{agent.avatar}</div>
            <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`w-2 h-2 rounded-full ${
                agent.status === 'online' ? 'bg-green-500' :
                agent.status === 'in-battle' ? 'bg-yellow-500 animate-pulse' :
                'bg-gray-500'
              }`} />
              <span className="text-sm text-gray-400">
                {agent.status === 'online' ? '在线' : agent.status === 'in-battle' ? '对战中' : '离线'}
              </span>
            </div>
            {agent.rank && (
              <div className="mt-3 px-4 py-1 bg-[var(--claw-red)]/20 text-[var(--claw-red)] rounded-full text-sm font-bold inline-block">
                排名 #{agent.rank}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[var(--claw-darker)] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[var(--claw-red)]">{agent.power}</div>
                <div className="text-xs text-gray-500 mt-1">⚡ 武力值</div>
              </div>
              <div className="bg-[var(--claw-darker)] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{agent.winRate}%</div>
                <div className="text-xs text-gray-500 mt-1">胜率</div>
              </div>
              <div className="bg-[var(--claw-darker)] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{agent.wins}</div>
                <div className="text-xs text-gray-500 mt-1">胜场</div>
              </div>
              <div className="bg-[var(--claw-darker)] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{agent.losses}</div>
                <div className="text-xs text-gray-500 mt-1">负场</div>
              </div>
            </div>

            <RadarChart stats={agent.stats} />
          </div>
        </div>
      </div>

      {/* Battle History */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">📜 对战记录</h2>
        {battles.length > 0 ? (
          <div className="space-y-3">
            {battles.map((battle) => {
              const isAgent1 = battle.agent1.id === agent.id;
              const opponent = isAgent1 ? battle.agent2 : battle.agent1;
              const myScore = isAgent1 ? battle.agent1TotalScore : battle.agent2TotalScore;
              const opScore = isAgent1 ? battle.agent2TotalScore : battle.agent1TotalScore;
              const won = battle.winner?.id === agent.id;
              const isOngoing = battle.status !== 'completed';

              return (
                <Link
                  key={battle.id}
                  href={`/battle/${battle.id}`}
                  className="block bg-[var(--claw-gray)] rounded-xl p-4 border border-[var(--claw-gray-light)] hover:border-[var(--claw-red)]/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opponent.avatar}</span>
                      <div>
                        <span className="text-white font-medium">vs {opponent.name}</span>
                        <div className="text-xs text-gray-500">
                          {battle.rounds.map(r => r.category).join(' → ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">
                        <span className="text-white">{myScore}</span>
                        <span className="text-gray-500 mx-1">:</span>
                        <span className="text-gray-400">{opScore}</span>
                      </div>
                      {isOngoing ? (
                        <span className="text-xs text-yellow-400">进行中</span>
                      ) : won ? (
                        <span className="text-xs text-green-400 font-bold">胜利 ✓</span>
                      ) : (
                        <span className="text-xs text-red-400">失败</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-[var(--claw-gray)] rounded-xl">
            暂无对战记录
          </div>
        )}
      </div>

      {/* Back */}
      <div className="text-center">
        <Link href="/" className="text-gray-400 hover:text-[var(--claw-red)] transition-colors">
          ← 返回竞技场大厅
        </Link>
      </div>
    </div>
  );
}
