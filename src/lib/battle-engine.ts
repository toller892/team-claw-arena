import { prisma } from './prisma';
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
async function callJudgeLLM(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<string> {
  const provider = process.env.JUDGE_PROVIDER || 'openai';
  const model = process.env.JUDGE_MODEL || 'gpt-4o-mini';
  const apiKey = process.env.JUDGE_API_KEY || '';

  if (!apiKey) {
    throw new Error('JUDGE_API_KEY environment variable is not set');
  }

  const OpenAI = (await import('openai')).default;
  const Anthropic = (await import('@anthropic-ai/sdk')).default;

  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey });
    const systemMessage = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const response = await client.messages.create({
      model,
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
      apiKey,
      baseURL: process.env.JUDGE_API_BASE_URL || undefined,
    });

    const response = await client.chat.completions.create({
      model,
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

/**
 * Process an answer submission
 * If both agents have answered the current round, trigger scoring
 */
export async function processAnswer(
  battleId: string,
  agentId: string,
  roundNumber: number,
  answer: string
): Promise<{ scored: boolean; round: Round }> {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: { rounds: true },
  });

  if (!battle) {
    throw new Error('Battle not found');
  }

  if (battle.status === 'completed') {
    throw new Error('Battle already completed');
  }

  const round = battle.rounds.find((r) => r.number === roundNumber);
  if (!round) {
    throw new Error(`Round ${roundNumber} not found`);
  }

  // Check if this agent is part of the battle
  const isAgent1 = battle.agent1Id === agentId;
  const isAgent2 = battle.agent2Id === agentId;

  if (!isAgent1 && !isAgent2) {
    throw new Error('Agent not part of this battle');
  }

  // Check if agent already answered
  if (isAgent1 && round.agent1Answer) {
    throw new Error('Agent already answered this round');
  }
  if (isAgent2 && round.agent2Answer) {
    throw new Error('Agent already answered this round');
  }

  // Update round with answer
  const updateData: any = {};
  if (isAgent1) {
    updateData.agent1Answer = answer;
    updateData.agent1AnsweredAt = new Date();
    updateData.agent1Status = 'answered';
  } else {
    updateData.agent2Answer = answer;
    updateData.agent2AnsweredAt = new Date();
    updateData.agent2Status = 'answered';
  }

  const updatedRound = await prisma.round.update({
    where: { id: round.id },
    data: updateData,
  });

  // Check if both agents have answered
  const bothAnswered = 
    (isAgent1 ? answer : round.agent1Answer) && 
    (isAgent2 ? answer : round.agent2Answer);

  if (bothAnswered) {
    // Score both answers
    const [agent1Score, agent2Score] = await Promise.all([
      scoreResponse(round.question, isAgent1 ? answer : round.agent1Answer!),
      scoreResponse(round.question, isAgent2 ? answer : round.agent2Answer!),
    ]);

    // Update round with scores
    const scoredRound = await prisma.round.update({
      where: { id: round.id },
      data: {
        agent1Score,
        agent2Score,
        agent1Status: 'scored',
        agent2Status: 'scored',
      },
    });

    // Update battle total scores
    const newAgent1Total = battle.agent1TotalScore + agent1Score;
    const newAgent2Total = battle.agent2TotalScore + agent2Score;

    await prisma.battle.update({
      where: { id: battleId },
      data: {
        agent1TotalScore: newAgent1Total,
        agent2TotalScore: newAgent2Total,
      },
    });

    // Check if all rounds are complete
    const allRoundsScored = battle.rounds.every((r) => 
      r.number === roundNumber || (r.agent1Score !== null && r.agent2Score !== null)
    );

    if (allRoundsScored) {
      await finalizeBattle(battleId);
    }

    return { scored: true, round: scoredRound };
  }

  return { scored: false, round: updatedRound };
}

/**
 * Finalize battle - determine winner, update stats, and settle wagers
 */
export async function finalizeBattle(battleId: string): Promise<BattleWithRelations> {
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

  // Determine winner
  const winnerId = battle.agent1TotalScore > battle.agent2TotalScore ? battle.agent1Id :
                   battle.agent2TotalScore > battle.agent1TotalScore ? battle.agent2Id : null;

  const totalWager = battle.wagerAmount * 2;
  const fee = Math.floor(totalWager * 0.05);

  // Settle wagers atomically
  await prisma.$transaction(async (tx) => {
    if (winnerId) {
      // Winner gets totalWager minus platform fee
      const winnings = totalWager - fee;
      const loserId = winnerId === battle.agent1Id ? battle.agent2Id : battle.agent1Id;

      const winner = await tx.agent.update({
        where: { id: winnerId },
        data: {
          balance: { increment: winnings },
          totalEarned: { increment: winnings },
        },
      });

      await tx.transaction.create({
        data: {
          agentId: winnerId,
          type: 'WIN',
          amount: winnings,
          balance: winner.balance,
          battleId,
          description: `Won battle (wager: ${battle.wagerAmount}, fee: ${fee})`,
        },
      });

      // Update battle with platform fee
      await tx.battle.update({
        where: { id: battleId },
        data: {
          status: 'completed',
          winnerId,
          platformFee: fee,
          endTime: new Date(),
        },
      });
    } else {
      // Draw - refund both agents
      const agent1 = await tx.agent.update({
        where: { id: battle.agent1Id },
        data: {
          balance: { increment: battle.wagerAmount },
          totalSpent: { decrement: battle.wagerAmount },
        },
      });

      await tx.transaction.create({
        data: {
          agentId: battle.agent1Id,
          type: 'REFUND',
          amount: battle.wagerAmount,
          balance: agent1.balance,
          battleId,
          description: 'Draw - wager refunded',
        },
      });

      const agent2 = await tx.agent.update({
        where: { id: battle.agent2Id },
        data: {
          balance: { increment: battle.wagerAmount },
          totalSpent: { decrement: battle.wagerAmount },
        },
      });

      await tx.transaction.create({
        data: {
          agentId: battle.agent2Id,
          type: 'REFUND',
          amount: battle.wagerAmount,
          balance: agent2.balance,
          battleId,
          description: 'Draw - wager refunded',
        },
      });

      await tx.battle.update({
        where: { id: battleId },
        data: {
          status: 'completed',
          winnerId: null,
          platformFee: 0,
          endTime: new Date(),
        },
      });
    }
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

/**
 * Initialize a new battle with 3 rounds and generated questions
 */
export async function initializeBattle(agent1Id: string, agent2Id: string, wagerAmount: number = 10000): Promise<BattleWithRelations> {
  // Generate questions for all 3 rounds
  const categories: RoundCategory[] = ['coding', 'knowledge', 'creativity'];
  const questions = await Promise.all(
    categories.map((category) => generateQuestion(category))
  );

  // Create battle with 3 rounds
  const battle = await prisma.battle.create({
    data: {
      agent1Id,
      agent2Id,
      status: 'waiting',
      wagerAmount,
      rounds: {
        create: [
          { 
            number: 1, 
            category: 'coding', 
            question: questions[0],
            timeLimit: 300 
          },
          { 
            number: 2, 
            category: 'knowledge', 
            question: questions[1],
            timeLimit: 180 
          },
          { 
            number: 3, 
            category: 'creativity', 
            question: questions[2],
            timeLimit: 240 
          },
        ],
      },
    },
    include: { agent1: true, agent2: true, rounds: true },
  });

  // Update agents status to in-battle
  await prisma.agent.updateMany({
    where: { id: { in: [agent1Id, agent2Id] } },
    data: { status: 'in-battle' },
  });

  return battle;
}
