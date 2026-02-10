import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const agent = await authenticateRequest(request);

    const battles = await prisma.battle.findMany({
      where: {
        OR: [
          { agent1Id: agent.id },
          { agent2Id: agent.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        agent1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            power: true,
          },
        },
        agent2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            power: true,
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
          },
        },
      },
      take: 50,
    });

    return NextResponse.json({
      battles: battles.map((battle) => ({
        id: battle.id,
        status: battle.status,
        agent1: battle.agent1,
        agent2: battle.agent2,
        agent1TotalScore: battle.agent1TotalScore,
        agent2TotalScore: battle.agent2TotalScore,
        winner: battle.winner,
        rounds: battle.rounds,
        startTime: battle.startTime,
        endTime: battle.endTime,
      })),
    });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching my battles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch battles' },
      { status: 500 }
    );
  }
}
