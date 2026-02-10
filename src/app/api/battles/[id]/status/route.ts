import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: battleId } = await params;

    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        agent1: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        agent2: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        winner: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        rounds: {
          orderBy: { number: 'asc' },
          select: {
            number: true,
            category: true,
            agent1Status: true,
            agent2Status: true,
            agent1Score: true,
            agent2Score: true,
            agent1AnsweredAt: true,
            agent2AnsweredAt: true,
          },
        },
      },
    });

    if (!battle) {
      return NextResponse.json(
        { error: 'Battle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: battle.id,
      status: battle.status,
      currentRound: battle.currentRound,
      agent1: battle.agent1,
      agent2: battle.agent2,
      agent1TotalScore: battle.agent1TotalScore,
      agent2TotalScore: battle.agent2TotalScore,
      winner: battle.winner,
      rounds: battle.rounds,
      startTime: battle.startTime,
      endTime: battle.endTime,
    });

  } catch (error) {
    console.error('Error fetching battle status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch battle status' },
      { status: 500 }
    );
  }
}
