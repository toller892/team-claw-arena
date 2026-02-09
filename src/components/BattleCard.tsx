import Link from 'next/link';
import { Battle } from '@/types';

interface BattleCardProps {
  battle: Battle;
}

export default function BattleCard({ battle }: BattleCardProps) {
  const statusConfig = {
    waiting: { text: '等待中', color: 'bg-yellow-500', pulse: false },
    'in-progress': { text: '对战中', color: 'bg-[var(--claw-red)]', pulse: true },
    completed: { text: '已结束', color: 'bg-gray-500', pulse: false },
  };

  const config = statusConfig[battle.status];

  return (
    <Link href={`/battle/${battle.id}`}>
      <div className="bg-[var(--claw-gray)] rounded-xl p-4 hover:bg-[var(--claw-gray-light)] transition-all border border-transparent hover:border-[var(--claw-red)]/30 cursor-pointer">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`}></span>
            <span className="text-sm text-gray-400">{config.text}</span>
          </div>
          {battle.status === 'in-progress' && (
            <span className="text-sm text-[var(--claw-red)] font-medium">
              Round {battle.currentRound}/3
            </span>
          )}
        </div>

        {/* Battle Arena */}
        <div className="flex items-center justify-between">
          {/* Agent 1 */}
          <div className="flex-1 text-center">
            <div className="text-3xl mb-2">{battle.agent1.avatar}</div>
            <div className="font-bold text-white truncate px-2">{battle.agent1.name}</div>
            <div className="text-sm text-[var(--claw-red)]">⚡ {battle.agent1.power}</div>
          </div>

          {/* VS / Score */}
          <div className="px-4">
            {battle.status === 'completed' ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {battle.agent1TotalScore} : {battle.agent2TotalScore}
                </div>
                <div className="text-xs text-gray-400 mt-1">最终比分</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--claw-red)]">VS</div>
                {battle.status === 'in-progress' && (
                  <div className="text-sm text-gray-400 mt-1">
                    {battle.agent1TotalScore} : {battle.agent2TotalScore}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Agent 2 */}
          <div className="flex-1 text-center">
            <div className="text-3xl mb-2">{battle.agent2.avatar}</div>
            <div className="font-bold text-white truncate px-2">{battle.agent2.name}</div>
            <div className="text-sm text-[var(--claw-red)]">⚡ {battle.agent2.power}</div>
          </div>
        </div>

        {/* Winner Badge */}
        {battle.status === 'completed' && battle.winner && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--claw-red)]/20 rounded-full">
              <span className="text-lg">🏆</span>
              <span className="text-sm text-[var(--claw-red)] font-medium">
                {battle.winner.name} 获胜
              </span>
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
