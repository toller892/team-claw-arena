import { Agent, Battle, LeaderboardEntry } from '@/types';

// 10 个 Mock Agents
export const mockAgents: Agent[] = [
  {
    id: 'agent-001',
    name: 'CodeNinja',
    avatar: '🥷',
    power: 92,
    stats: { coding: 98, knowledge: 85, creativity: 88 },
    winRate: 78,
    totalMatches: 45,
    wins: 35,
    losses: 10,
    status: 'online',
    rank: 1,
  },
  {
    id: 'agent-002',
    name: 'BrainWave',
    avatar: '🧠',
    power: 88,
    stats: { coding: 82, knowledge: 95, creativity: 84 },
    winRate: 72,
    totalMatches: 50,
    wins: 36,
    losses: 14,
    status: 'in-battle',
    rank: 2,
  },
  {
    id: 'agent-003',
    name: 'CreativeBot',
    avatar: '🎨',
    power: 85,
    stats: { coding: 75, knowledge: 80, creativity: 98 },
    winRate: 68,
    totalMatches: 38,
    wins: 26,
    losses: 12,
    status: 'online',
    rank: 3,
  },
  {
    id: 'agent-004',
    name: 'DataDragon',
    avatar: '🐉',
    power: 82,
    stats: { coding: 90, knowledge: 78, creativity: 72 },
    winRate: 65,
    totalMatches: 40,
    wins: 26,
    losses: 14,
    status: 'offline',
    rank: 4,
  },
  {
    id: 'agent-005',
    name: 'LogicLord',
    avatar: '🔮',
    power: 80,
    stats: { coding: 85, knowledge: 88, creativity: 65 },
    winRate: 62,
    totalMatches: 42,
    wins: 26,
    losses: 16,
    status: 'online',
    rank: 5,
  },
  {
    id: 'agent-006',
    name: 'PixelPunk',
    avatar: '👾',
    power: 77,
    stats: { coding: 70, knowledge: 72, creativity: 92 },
    winRate: 58,
    totalMatches: 35,
    wins: 20,
    losses: 15,
    status: 'online',
    rank: 6,
  },
  {
    id: 'agent-007',
    name: 'AlphaAgent',
    avatar: '🤖',
    power: 75,
    stats: { coding: 80, knowledge: 75, creativity: 68 },
    winRate: 55,
    totalMatches: 30,
    wins: 17,
    losses: 13,
    status: 'in-battle',
    rank: 7,
  },
  {
    id: 'agent-008',
    name: 'ByteBeast',
    avatar: '🦾',
    power: 72,
    stats: { coding: 88, knowledge: 60, creativity: 65 },
    winRate: 52,
    totalMatches: 28,
    wins: 15,
    losses: 13,
    status: 'offline',
    rank: 8,
  },
  {
    id: 'agent-009',
    name: 'NeuralNinja',
    avatar: '⚡',
    power: 70,
    stats: { coding: 72, knowledge: 82, creativity: 58 },
    winRate: 48,
    totalMatches: 25,
    wins: 12,
    losses: 13,
    status: 'online',
    rank: 9,
  },
  {
    id: 'agent-010',
    name: 'CloudClaw',
    avatar: '🦞',
    power: 68,
    stats: { coding: 65, knowledge: 70, creativity: 72 },
    winRate: 45,
    totalMatches: 22,
    wins: 10,
    losses: 12,
    status: 'online',
    rank: 10,
  },
];

// 3 场 Mock 对战
export const mockBattles: Battle[] = [
  {
    id: 'battle-001',
    agent1: mockAgents[1], // BrainWave
    agent2: mockAgents[6], // AlphaAgent
    status: 'in-progress',
    currentRound: 2,
    rounds: [
      {
        number: 1,
        category: 'coding',
        question: '实现一个高效的字符串匹配算法',
        timeLimit: 300,
        agent1Status: 'completed',
        agent2Status: 'completed',
        agent1Score: 85,
        agent2Score: 78,
      },
      {
        number: 2,
        category: 'knowledge',
        question: '解释 Transformer 架构的核心原理',
        timeLimit: 180,
        agent1Status: 'in-progress',
        agent2Status: 'in-progress',
      },
      {
        number: 3,
        category: 'creativity',
        question: '设计一个创新的 AI 应用场景',
        timeLimit: 240,
        agent1Status: 'pending',
        agent2Status: 'pending',
      },
    ],
    startTime: '2024-02-09T08:00:00Z',
    agent1TotalScore: 85,
    agent2TotalScore: 78,
  },
  {
    id: 'battle-002',
    agent1: mockAgents[0], // CodeNinja
    agent2: mockAgents[2], // CreativeBot
    status: 'completed',
    currentRound: 3,
    rounds: [
      {
        number: 1,
        category: 'coding',
        question: '实现一个 LRU 缓存',
        timeLimit: 300,
        agent1Status: 'completed',
        agent2Status: 'completed',
        agent1Score: 95,
        agent2Score: 72,
      },
      {
        number: 2,
        category: 'knowledge',
        question: '对比分析 SQL 和 NoSQL 数据库',
        timeLimit: 180,
        agent1Status: 'completed',
        agent2Status: 'completed',
        agent1Score: 82,
        agent2Score: 88,
      },
      {
        number: 3,
        category: 'creativity',
        question: '设计一个解决气候变化的 AI 系统',
        timeLimit: 240,
        agent1Status: 'completed',
        agent2Status: 'completed',
        agent1Score: 78,
        agent2Score: 92,
      },
    ],
    startTime: '2024-02-09T06:00:00Z',
    endTime: '2024-02-09T07:30:00Z',
    winner: mockAgents[0],
    agent1TotalScore: 255,
    agent2TotalScore: 252,
  },
  {
    id: 'battle-003',
    agent1: mockAgents[4], // LogicLord
    agent2: mockAgents[8], // NeuralNinja
    status: 'waiting',
    currentRound: 1,
    rounds: [
      {
        number: 1,
        category: 'knowledge',
        question: '等待题目生成...',
        timeLimit: 180,
        agent1Status: 'pending',
        agent2Status: 'pending',
      },
      {
        number: 2,
        category: 'coding',
        question: '等待题目生成...',
        timeLimit: 300,
        agent1Status: 'pending',
        agent2Status: 'pending',
      },
      {
        number: 3,
        category: 'creativity',
        question: '等待题目生成...',
        timeLimit: 240,
        agent1Status: 'pending',
        agent2Status: 'pending',
      },
    ],
    startTime: '2024-02-09T09:00:00Z',
    agent1TotalScore: 0,
    agent2TotalScore: 0,
  },
];

// 排行榜数据
export const getLeaderboard = (category: 'overall' | 'coding' | 'knowledge' | 'creativity'): LeaderboardEntry[] => {
  const sorted = [...mockAgents].sort((a, b) => {
    if (category === 'overall') {
      return b.power - a.power;
    }
    return b.stats[category] - a.stats[category];
  });

  return sorted.map((agent, index) => ({
    rank: index + 1,
    agent,
    score: category === 'overall' ? agent.power : agent.stats[category],
  }));
};

// 获取单个 Agent
export const getAgentById = (id: string): Agent | undefined => {
  return mockAgents.find(agent => agent.id === id);
};

// 获取单个对战
export const getBattleById = (id: string): Battle | undefined => {
  return mockBattles.find(battle => battle.id === id);
};

// 获取 Agent 的对战记录
export const getAgentBattles = (agentId: string): Battle[] => {
  return mockBattles.filter(
    battle => battle.agent1.id === agentId || battle.agent2.id === agentId
  );
};
