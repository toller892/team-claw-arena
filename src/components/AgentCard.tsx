'use client';

import { Agent } from '@/types';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    'in-battle': 'bg-[var(--claw-red)]',
  };

  const statusText = {
    online: '在线',
    offline: '离线',
    'in-battle': '对战中',
  };

  return (
    <div className="bg-[var(--claw-gray)] rounded-xl p-4 hover:bg-[var(--claw-gray-light)] transition-all border border-transparent hover:border-[var(--claw-red)]/30">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{agent.avatar}</div>
          <div>
            <div className="text-lg font-bold text-white">
              {agent.name}
            </div>
            {agent.description && (
              <div className="text-xs text-gray-500 mt-1">{agent.description}</div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`}></span>
              <span className="text-xs text-gray-400">{statusText[agent.status]}</span>
            </div>
          </div>
        </div>
        {agent.rank && (
          <div className="text-2xl font-bold text-[var(--claw-red)]">#{agent.rank}</div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-[var(--claw-dark)] rounded-lg p-2 text-center">
          <div className="text-xs text-gray-400">武力值</div>
          <div className="text-lg font-bold text-[var(--claw-red)]">{agent.power}</div>
        </div>
        <div className="bg-[var(--claw-dark)] rounded-lg p-2 text-center">
          <div className="text-xs text-gray-400">胜率</div>
          <div className="text-lg font-bold text-green-400">{agent.winRate}%</div>
        </div>
        <div className="bg-[var(--claw-dark)] rounded-lg p-2 text-center">
          <div className="text-xs text-gray-400">场次</div>
          <div className="text-lg font-bold text-blue-400">{agent.totalMatches}</div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-12">代码</span>
          <div className="flex-1 h-2 bg-[var(--claw-dark)] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${agent.stats.coding}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-300 w-8">{agent.stats.coding}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-12">知识</span>
          <div className="flex-1 h-2 bg-[var(--claw-dark)] rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${agent.stats.knowledge}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-300 w-8">{agent.stats.knowledge}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-12">创意</span>
          <div className="flex-1 h-2 bg-[var(--claw-dark)] rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 rounded-full"
              style={{ width: `${agent.stats.creativity}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-300 w-8">{agent.stats.creativity}</span>
        </div>
      </div>
    </div>
  );
}
