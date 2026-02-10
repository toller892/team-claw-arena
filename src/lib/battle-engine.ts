import { prisma } from './prisma';
import { callLLM, LLMConfig } from './llm';
import { Battle, Round, Agent } from '@prisma/client';

type RoundCategory = 'coding' | 'knowledge' | 'creativity';

const JUDGE_SYSTEM_PROMPT = `You are an impartial judge for an AI agent battle arena called "Claw Arena".
Your role is to evaluate AI agent responses fairly and objectively.
You must be strict but fair in your scoring.
Always provide scores as integers between 0 and 100.`;

const QUESTION_PROMPTS: Record<RoundCategory, string> = {
  coding: `Generate a challenging coding question for an AI agent battle.
The question should test algorithmic thinking, code implementation, or system design.
Keep the question concise (2-3 sentences max).
Output ONLY the question, nothing else.`,

  knowledge: `Generate a knowledge-based question for an AI agent battle.
The question should test understanding of computer science, AI/ML, software engineering, or technology concepts.
Keep the question concise (2-3 sentences max).
Output ONLY the question, nothing else.`,

  creativity: `Generate a creative challenge question for an AI agent battle.
The question should test creative problem-solving, innovative thinking, or novel application design.
Keep the question concise (2-3 sentences max).
Output ONLY the question, nothing else.`,
};

const SCORING_PROMPT = `Score the following response to the question on a scale of 0-100.
Consider:
- Correctness and accuracy (40%)
- Completeness and depth (30%)
- Clarity and organization (20%)
- Creativity and insight (10%)

Question: {question}

Response: {response}

Output ONLY a single integer score between 0 and 100, nothing else.`;

export interface BattleWithRelations extends Battle {
  agent1: Agent;
  agent2: Agent;
  rounds: Round[];
}

// Get judge LLM config - uses environment variables for the judge
function getJudgeConfig(): LLMConfig {
  const provider = process.env.JUDGE_PROVIDER || 'openai';
  const model = process.env.JUDGE_MODEL || 'gpt-4o-mini';
  const apiKey = process.env.JUDGE_API_KEY || '';

  if (!apiKey) {
    throw new Error('JUDGE_API_KEY environment variable is not set');
  }

  return {
    provider: provider as 'openai' | 'anthropic' | 'custom',
    model,
    apiKey, // Judge API key is not encrypted (stored in env)
    apiBaseUrl: process.env.JUDGE_API_BASE_URL,
  };
}

// Override decrypt for judge (uses plain env var)
async function callJudgeLLM(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<string> {
  const config = getJudgeConfig();

  // For judge, we use the API key directly without decryption
  const OpenAI = (await import('openai')).default;
  const Anthropic = (await import('@anthropic-ai/sdk')).default;

  if (config.provider === 'anthropic') {
    const client = new Anthropic({ apiKey: config.apiKey });
    const systemMessage = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const response = await client.messages.create({
      model: config.model,
      max_tokens: 1024,
      temperature: 0.3,
      system: systemMessage?.content,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textContent = response.content.find((c) => c.type === 'text');
    return textContent?.text || '';
  } else {
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiBaseUrl || undefined,
    });

    const response = await client.chat.completions.create({
      model: config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: 1024,
      temperature: 0.3,
    });

    return response.choices[0].message?.content || '';
  }
}

export async function generateQuestion(category: RoundCategory): Promise<string> {
  const response = await callJudgeLLM([
    { role: 'system', content: JUDGE_SYSTEM_PROMPT },
    { role: 'user', content: QUESTION_PROMPTS[category] },
  ]);

  return response.trim();
}

export async function scoreResponse(question: string, response: string): Promise<number> {
  const prompt = SCORING_PROMPT
    .replace('{question}', question)
    .replace('{response}', response);

  const scoreText = await callJudgeLLM([
    { role: 'system', content: JUDGE_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ]);

  const score = parseInt(scoreText.trim(), 10);
  if (isNaN(score) || score < 0 || score > 100) {
    return 50; // Default score if parsing fails
  }
  return score;
}

export async function getAgentResponse(agent: Agent, question: string): Promise<string> {
  const config: LLMConfig = {
    provider: agent.provider as 'openai' | 'anthropic' | 'custom',
    model: agent.model,
    apiKey: agent.apiKey,
    apiBaseUrl: agent.apiBaseUrl,
  };

  const response = await callLLM(config, [
    { role: 'system', content: `You are ${agent.name}, an AI agent competing in Claw Arena. Answer the following challenge question to the best of your ability. Be concise but thorough.` },
    { role: 'user', content: question },
  ], {
    maxTokens: 2048,
    temperature: 0.7,
  });

  return response.content;
}

export async function runBattle(battleId: string): Promise<BattleWithRelations> {
  // Get battle with relations
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: { agent1: true, agent2: true, rounds: true },
  });

  if (!battle) {
    throw new Error('Battle not found');
  }

  if (battle.status === 'completed') {
    return battle;
  }

  // Update battle status to in-progress
  await prisma.battle.update({
    where: { id: battleId },
    data: { status: 'in-progress' },
  });

  // Update agents status to in-battle
  await prisma.agent.updateMany({
    where: { id: { in: [battle.agent1Id, battle.agent2Id] } },
    data: { status: 'in-battle' },
  });

  const categories: RoundCategory[] = ['coding', 'knowledge', 'creativity'];
  let agent1Total = 0;
  let agent2Total = 0;

  // Run each round
  for (let i = 0; i < 3; i++) {
    const roundNumber = i + 1;
    const category = categories[i];

    // Update current round
    await prisma.battle.update({
      where: { id: battleId },
      data: { currentRound: roundNumber },
    });

    // Generate question
    const question = await generateQuestion(category);

    // Create or update round
    let round = battle.rounds.find((r) => r.number === roundNumber);
    if (round) {
      await prisma.round.update({
        where: { id: round.id },
        data: {
          question,
          category,
          agent1Status: 'in-progress',
          agent2Status: 'in-progress',
        },
      });
    } else {
      round = await prisma.round.create({
        data: {
          number: roundNumber,
          category,
          question,
          timeLimit: category === 'coding' ? 300 : category === 'creativity' ? 240 : 180,
          battleId,
          agent1Status: 'in-progress',
          agent2Status: 'in-progress',
        },
      });
    }

    // Get agent responses in parallel
    const [agent1Answer, agent2Answer] = await Promise.all([
      getAgentResponse(battle.agent1, question),
      getAgentResponse(battle.agent2, question),
    ]);

    // Score responses in parallel
    const [agent1Score, agent2Score] = await Promise.all([
      scoreResponse(question, agent1Answer),
      scoreResponse(question, agent2Answer),
    ]);

    agent1Total += agent1Score;
    agent2Total += agent2Score;

    // Update round with results
    await prisma.round.update({
      where: { id: round.id },
      data: {
        agent1Answer,
        agent2Answer,
        agent1Score,
        agent2Score,
        agent1Status: 'completed',
        agent2Status: 'completed',
      },
    });

    // Update battle scores
    await prisma.battle.update({
      where: { id: battleId },
      data: {
        agent1TotalScore: agent1Total,
        agent2TotalScore: agent2Total,
      },
    });
  }

  // Determine winner
  const winnerId = agent1Total > agent2Total ? battle.agent1Id :
                   agent2Total > agent1Total ? battle.agent2Id : null;

  // Update battle as completed
  await prisma.battle.update({
    where: { id: battleId },
    data: {
      status: 'completed',
      winnerId,
      endTime: new Date(),
    },
  });

  // Update agent stats
  await updateAgentStats(battle.agent1Id, winnerId === battle.agent1Id);
  await updateAgentStats(battle.agent2Id, winnerId === battle.agent2Id);

  // Set agents back to online
  await prisma.agent.updateMany({
    where: { id: { in: [battle.agent1Id, battle.agent2Id] } },
    data: { status: 'online' },
  });

  // Return updated battle
  return prisma.battle.findUnique({
    where: { id: battleId },
    include: { agent1: true, agent2: true, rounds: true },
  }) as Promise<BattleWithRelations>;
}

async function updateAgentStats(agentId: string, won: boolean): Promise<void> {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return;

  const newWins = won ? agent.wins + 1 : agent.wins;
  const newLosses = won ? agent.losses : agent.losses + 1;
  const newTotalMatches = agent.totalMatches + 1;
  const newWinRate = (newWins / newTotalMatches) * 100;

  // Calculate new power based on win rate and stats
  const avgStats = (agent.coding + agent.knowledge + agent.creativity) / 3;
  const newPower = Math.round(avgStats * 0.6 + newWinRate * 0.4);

  await prisma.agent.update({
    where: { id: agentId },
    data: {
      wins: newWins,
      losses: newLosses,
      totalMatches: newTotalMatches,
      winRate: Math.round(newWinRate * 100) / 100,
      power: newPower,
    },
  });
}

export async function initializeBattle(agent1Id: string, agent2Id: string): Promise<Battle> {
  // Create battle with 3 empty rounds
  const battle = await prisma.battle.create({
    data: {
      agent1Id,
      agent2Id,
      status: 'waiting',
      rounds: {
        create: [
          { number: 1, category: 'coding', timeLimit: 300 },
          { number: 2, category: 'knowledge', timeLimit: 180 },
          { number: 3, category: 'creativity', timeLimit: 240 },
        ],
      },
    },
    include: { agent1: true, agent2: true, rounds: true },
  });

  return battle;
}
