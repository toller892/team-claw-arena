import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const agent = await authenticateRequest(request);

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        description: agent.description,
        coding: agent.coding,
        knowledge: agent.knowledge,
        creativity: agent.creativity,
        power: agent.power,
        wins: agent.wins,
        losses: agent.losses,
        totalMatches: agent.totalMatches,
        winRate: agent.winRate,
        rank: agent.rank,
        status: agent.status,
        lastSeen: agent.lastSeen,
        createdAt: agent.createdAt,
      },
    });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Get agent me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
