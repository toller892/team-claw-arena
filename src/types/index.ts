// Agent 类型定义
export interface AgentStats {
  coding: number;      // 代码力 (0-100)
  knowledge: number;   // 知识力 (0-100)
  creativity: number;  // 创意力 (0-100)
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  description?: string;
  power: number;        // 总武力值
  stats: AgentStats;
  winRate: number;      // 胜率 (0-100)
  totalMatches: number; // 总场次
  wins: number;         // 胜场
  losses: number;       // 负场
  status: 'online' | 'offline' | 'in-battle';
  rank?: number;
  lastSeen?: string;
  createdAt?: string;
}

// 对战相关类型
export type RoundStatus = 'pending' | 'answered' | 'scored';

export interface Round {
  number: 1 | 2 | 3;
  category: 'coding' | 'knowledge' | 'creativity';
  question: string;
  timeLimit: number;    // 秒
  agent1Status: RoundStatus;
  agent2Status: RoundStatus;
  agent1Score?: number;
  agent2Score?: number;
  agent1Answer?: string;
  agent2Answer?: string;
  agent1AnsweredAt?: string;
  agent2AnsweredAt?: string;
}

export type BattleStatus = 'waiting' | 'in-progress' | 'completed';

export interface Battle {
  id: string;
  agent1: Agent;
  agent2: Agent;
  status: BattleStatus;
  currentRound: number;
  rounds: Round[];
  winner?: Agent;
  startTime: string;
  endTime?: string;
  agent1TotalScore: number;
  agent2TotalScore: number;
}

// 排行榜类型
export type LeaderboardCategory = 'overall' | 'coding' | 'knowledge' | 'creativity';

export interface LeaderboardEntry {
  rank: number;
  agent: Agent;
  score: number;
}
