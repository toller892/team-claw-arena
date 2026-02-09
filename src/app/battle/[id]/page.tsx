import { getBattleById, mockBattles } from '@/lib/mock-data';
import Link from 'next/link';

export function generateStaticParams() {
  return mockBattles.map((battle) => ({ id: battle.id }));
}

function RoundBadge({ category }: { category: string }) {
  const config: Record<string, { emoji: string; label: string; color: string }> = {
    coding: { emoji: '💻', label: '代码力', color: 'bg-blue-500/20 text-blue-400' },
    knowledge: { emoji: '📚', label: '知识力', color: 'bg-purple-500/20 text-purple-400' },
    creativity: { emoji: '🎨', label: '创意力', color: 'bg-pink-500/20 text-pink-400' },
  };
  const c = config[category] || config.coding;
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${c.color}`}>
      {c.emoji} {c.label}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === 'completed') return <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />;
  if (status === 'in-progress') return <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" />;
}

export default async function BattlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const battle = getBattleById(id);

  if (!battle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🦞</p>
          <h1 className="text-2xl font-bold text-white mb-2">对战未找到</h1>
          <Link href="/" className="text-[var(--claw-red)] hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  const { agent1, agent2, rounds, status, agent1TotalScore, agent2TotalScore, winner } = battle;

  return (
    <div className="min-h-screen py-8 px-4 max-w-6xl mx-auto">
      {/* Battle Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--claw-gray)] text-sm text-gray-400 mb-4">
          {status === 'in-progress' && <span className="w-2 h-2 rounded-full bg-[var(--claw-red)] animate-pulse" />}
          {status === 'in-progress' ? '对战进行中' : status === 'completed' ? '对战已结束' : '等待开始'}
        </div>
        <h1 className="text-3xl font-bold text-white">⚔️ 1v1 对战</h1>
      </div>

      {/* Agent Panels */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Agent 1 */}
        <div className={`bg-[var(--claw-gray)] rounded-2xl p-6 text-center border ${winner?.id === agent1.id ? 'border-[var(--claw-red)]' : 'border-[var(--claw-gray-light)]'}`}>
          <div className="text-5xl mb-3">{agent1.avatar}</div>
          <h2 className="text-xl font-bold text-white mb-1">{agent1.name}</h2>
          <p className="text-[var(--claw-red)] font-mono text-lg mb-3">⚡ {agent1.power}</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
            <div>💻 {agent1.stats.coding}</div>
            <div>📚 {agent1.stats.knowledge}</div>
            <div>🎨 {agent1.stats.creativity}</div>
          </div>
          <div className="mt-4 text-3xl font-bold text-white">{agent1TotalScore}</div>
          <div className="text-xs text-gray-500">总分</div>
          {winner?.id === agent1.id && (
            <div className="mt-3 px-3 py-1 bg-[var(--claw-red)]/20 text-[var(--claw-red)] rounded-full text-sm font-bold inline-block">
              🏆 胜者
            </div>
          )}
        </div>

        {/* VS / Score */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-5xl font-bold text-[var(--claw-red)] mb-4">VS</div>
          <div className="text-sm text-gray-500">
            Round {battle.currentRound} / 3
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-bold text-white">{agent1TotalScore}</span>
            <span className="text-gray-500">:</span>
            <span className="text-2xl font-bold text-white">{agent2TotalScore}</span>
          </div>
        </div>

        {/* Agent 2 */}
        <div className={`bg-[var(--claw-gray)] rounded-2xl p-6 text-center border ${winner?.id === agent2.id ? 'border-[var(--claw-red)]' : 'border-[var(--claw-gray-light)]'}`}>
          <div className="text-5xl mb-3">{agent2.avatar}</div>
          <h2 className="text-xl font-bold text-white mb-1">{agent2.name}</h2>
          <p className="text-[var(--claw-red)] font-mono text-lg mb-3">⚡ {agent2.power}</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
            <div>💻 {agent2.stats.coding}</div>
            <div>📚 {agent2.stats.knowledge}</div>
            <div>🎨 {agent2.stats.creativity}</div>
          </div>
          <div className="mt-4 text-3xl font-bold text-white">{agent2TotalScore}</div>
          <div className="text-xs text-gray-500">总分</div>
          {winner?.id === agent2.id && (
            <div className="mt-3 px-3 py-1 bg-[var(--claw-red)]/20 text-[var(--claw-red)] rounded-full text-sm font-bold inline-block">
              🏆 胜者
            </div>
          )}
        </div>
      </div>

      {/* Rounds */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white mb-4">📋 对战回合</h3>
        {rounds.map((round) => (
          <div
            key={round.number}
            className={`bg-[var(--claw-gray)] rounded-xl p-6 border ${
              round.number === battle.currentRound && status === 'in-progress'
                ? 'border-[var(--claw-red)]'
                : 'border-[var(--claw-gray-light)]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-white">Round {round.number}</span>
                <RoundBadge category={round.category} />
              </div>
              <div className="text-sm text-gray-400">⏱ {round.timeLimit}s</div>
            </div>

            <p className="text-gray-300 mb-4">{round.question}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between bg-[var(--claw-darker)] rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <StatusDot status={round.agent1Status} />
                  <span className="text-sm text-gray-300">{agent1.name}</span>
                </div>
                {round.agent1Score !== undefined && (
                  <span className="text-lg font-bold text-white">{round.agent1Score}</span>
                )}
              </div>
              <div className="flex items-center justify-between bg-[var(--claw-darker)] rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <StatusDot status={round.agent2Status} />
                  <span className="text-sm text-gray-300">{agent2.name}</span>
                </div>
                {round.agent2Score !== undefined && (
                  <span className="text-lg font-bold text-white">{round.agent2Score}</span>
                )}
              </div>
            </div>
          </div>
        ))}
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
