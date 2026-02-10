import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initializeBattle } from '@/lib/battle-engine';

// GET /api/battles - List all battles
export async function GET() {
  try {
    const battles = await prisma.battle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        agent1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            power: true,
            coding: true,
            knowledge: true,
            creativity: true,
            winRate: true,
            totalMatches: true,
            wins: true,
            losses: true,
            status: true,
            rank: true,
          },
        },
        agent2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            power: true,
            coding: true,
            knowledge: true,
            creativity: true,
            winRate: true,
            totalMatches: true,
            wins: true,
            losses: true,
            status: true,
            rank: true,
          },
        },
        winner: {
          select: { id: true, name: true, avatar: true },
        },
        rounds: {
          orderBy: { number: 'asc' },
          select: {
            number: true,
            category: true,
            question: true,
            timeLimit: true,
            agent1Status: true,
            agent2Status: true,
            agent1Score: true,
            agent2Score: true,
          },
        },
      },
      take: 50,
    });

    // Format battles to match frontend types
    const formattedBattles = battles.map((battle) => ({
      id: battle.id,
      agent1: {
        ...battle.agent1,
        stats: {
          coding: battle.agent1.coding,
          knowledge: battle.agent1.knowledge,
          creativity: battle.agent1.creativity,
        },
      },
      agent2: {
        ...battle.agent2,
        stats: {
          coding: battle.agent2.coding,
          knowledge: battle.agent2.knowledge,
          creativity: battle.agent2.creativity,
        },
      },
      status: battle.status,
      currentRound: battle.currentRound,
      rounds: battle.rounds,
      winner: battle.winner,
      startTime: battle.startTime.toISOString(),
      endTime: battle.endTime?.toISOString(),
      agent1TotalScore: battle.agent1TotalScore,
      agent2TotalScore: battle.agent2TotalScore,
    }));

    return NextResponse.json(formattedBattles);
  } catch (error) {
    console.error('Error fetching battles:', error);
    return NextResponse.json({ error: 'Failed to fetch battles' }, { status: 500 });
  }
}

// POST /api/battles - Create a new battle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent1Id, agent2Id } = body;

    if (!agent1Id || !agent2Id) {
      return NextResponse.json(
        { error: 'Missing required fields: agent1Id, agent2Id' },
        { status: 400 }
      );
    }

    if (agent1Id === agent2Id) {
      return NextResponse.json(
        { error: 'An agent cannot battle itself' },
        { status: 400 }
      );
    }

    // Check if both agents exist
    const [agent1, agent2] = await Promise.all([
      prisma.agent.findUnique({ where: { id: agent1Id } }),
      prisma.agent.findUnique({ where: { id: agent2Id } }),
    ]);

    if (!agent1 || !agent2) {
      return NextResponse.json({ error: 'One or both agents not found' }, { status: 404 });
    }

    // Check if either agent is already in battle
    if (agent1.status === 'in-battle' || agent2.status === 'in-battle') {
      return NextResponse.json(
        { error: 'One or both agents are already in a battle' },
        { status: 400 }
      );
    }

    // Initialize the battle
    const battle = await initializeBattle(agent1Id, agent2Id);

    return NextResponse.json({ id: battle.id, status: battle.status }, { status: 201 });
  } catch (error) {
    console.error('Error creating battle:', error);
    return NextResponse.json({ error: 'Failed to create battle' }, { status: 500 });
  }
}
