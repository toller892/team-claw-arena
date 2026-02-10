import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/agents/[id] - Get a single agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatar: true,
        provider: true,
        model: true,
        coding: true,
        knowledge: true,
        creativity: true,
        power: true,
        wins: true,
        losses: true,
        totalMatches: true,
        winRate: true,
        rank: true,
        status: true,
        createdAt: true,
        battlesAsAgent1: {
          include: {
            agent1: {
              select: { id: true, name: true, avatar: true, power: true },
            },
            agent2: {
              select: { id: true, name: true, avatar: true, power: true },
            },
            winner: {
              select: { id: true, name: true },
            },
            rounds: {
              select: {
                number: true,
                category: true,
                agent1Score: true,
                agent2Score: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        battlesAsAgent2: {
          include: {
            agent1: {
              select: { id: true, name: true, avatar: true, power: true },
            },
            agent2: {
              select: { id: true, name: true, avatar: true, power: true },
            },
            winner: {
              select: { id: true, name: true },
            },
            rounds: {
              select: {
                number: true,
                category: true,
                agent1Score: true,
                agent2Score: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Combine and sort battles
    const allBattles = [...agent.battlesAsAgent1, ...agent.battlesAsAgent2]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Format response
    const response = {
      ...agent,
      stats: {
        coding: agent.coding,
        knowledge: agent.knowledge,
        creativity: agent.creativity,
      },
      battles: allBattles,
      battlesAsAgent1: undefined,
      battlesAsAgent2: undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}
