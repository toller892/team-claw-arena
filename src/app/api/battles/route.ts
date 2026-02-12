import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initializeBattle } from '@/lib/battle-engine';
import { authenticateRequest, AuthError } from '@/lib/auth';

// GET /api/battles - List recent battles
export async function GET() {
  try {
    const battles = await prisma.battle.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        agent1: { select: { id: true, name: true, avatar: true, power: true } },
        agent2: { select: { id: true, name: true, avatar: true, power: true } },
        winner: { select: { id: true, name: true, avatar: true } },
        rounds: {
          orderBy: { number: 'asc' },
          select: {
            number: true,
            category: true,
            agent1Status: true,
            agent2Status: true,
            agent1Score: true,
            agent2Score: true,
          },
        },
      },
    });

    return NextResponse.json(
      battles.map((b) => ({
        id: b.id,
        status: b.status,
        agent1: b.agent1,
        agent2: b.agent2,
        agent1TotalScore: b.agent1TotalScore,
        agent2TotalScore: b.agent2TotalScore,
        winner: b.winner,
        rounds: b.rounds,
        startTime: b.startTime,
        endTime: b.endTime,
      }))
    );
  } catch (error) {
    console.error('Error fetching battles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch battles' },
      { status: 500 }
    );
  }
}

// POST /api/battles - Create a new battle
export async function POST(request: NextRequest) {
  try {
    const agent = await authenticateRequest(request);
    const body = await request.json();
    const { opponentName, wagerAmount: rawWager } = body;

    if (!opponentName || typeof opponentName !== 'string') {
      return NextResponse.json(
        { error: 'opponentName is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate wager
    const wagerAmount = rawWager !== undefined ? Number(rawWager) : 10000;
    if (!Number.isInteger(wagerAmount) || wagerAmount < 1000) {
      return NextResponse.json(
        { error: 'wagerAmount must be an integer >= 1000' },
        { status: 400 }
      );
    }

    // Check challenger balance
    if (agent.balance < wagerAmount) {
      return NextResponse.json(
        { error: `Insufficient balance. You have ${agent.balance} CLAW but need ${wagerAmount}` },
        { status: 400 }
      );
    }

    // Find opponent by name
    const opponent = await prisma.agent.findUnique({
      where: { name: opponentName },
    });

    if (!opponent) {
      return NextResponse.json(
        { error: `Agent '${opponentName}' not found` },
        { status: 404 }
      );
    }

    if (opponent.id === agent.id) {
      return NextResponse.json(
        { error: 'Cannot challenge yourself' },
        { status: 400 }
      );
    }

    // Check if either agent is already in battle
    if (agent.status === 'in-battle') {
      return NextResponse.json(
        { error: 'You are already in a battle' },
        { status: 400 }
      );
    }

    if (opponent.status === 'in-battle') {
      return NextResponse.json(
        { error: `${opponentName} is already in a battle` },
        { status: 400 }
      );
    }

    // Deduct wager from challenger in a transaction
    const newBalance = agent.balance - wagerAmount;
    await prisma.$transaction([
      prisma.agent.update({
        where: { id: agent.id },
        data: {
          balance: newBalance,
          totalSpent: { increment: wagerAmount },
        },
      }),
    ]);

    // Initialize the battle (generates questions)
    const battle = await initializeBattle(agent.id, opponent.id, wagerAmount);

    // Record BET transaction for challenger
    await prisma.transaction.create({
      data: {
        agentId: agent.id,
        type: 'BET',
        amount: -wagerAmount,
        balance: newBalance,
        battleId: battle.id,
        description: `Wager for battle vs ${opponentName}`,
      },
    });

    // Return battle info with questions
    return NextResponse.json({
      id: battle.id,
      status: battle.status,
      wagerAmount: battle.wagerAmount,
      agent1: {
        id: battle.agent1.id,
        name: battle.agent1.name,
        avatar: battle.agent1.avatar,
      },
      agent2: {
        id: battle.agent2.id,
        name: battle.agent2.name,
        avatar: battle.agent2.avatar,
      },
      rounds: battle.rounds.map((r) => ({
        number: r.number,
        category: r.category,
        question: r.question,
        timeLimit: r.timeLimit,
      })),
      startTime: battle.startTime,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Error creating battle:', error);
    return NextResponse.json(
      { error: 'Failed to create battle' },
      { status: 500 }
    );
  }
}
