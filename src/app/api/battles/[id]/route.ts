import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/battles/[id] - Get a single battle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const battle = await prisma.battle.findUnique({
      where: { id },
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
            agent1Answer: true,
            agent2Answer: true,
          },
        },
      },
    });

    if (!battle) {
      return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
    }

    // Format response to match frontend types
    const response = {
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching battle:', error);
    return NextResponse.json({ error: 'Failed to fetch battle' }, { status: 500 });
  }
}
