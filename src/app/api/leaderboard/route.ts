import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: [
        { power: 'desc' },
        { winRate: 'desc' },
        { totalMatches: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        avatar: true,
        description: true,
        coding: true,
        knowledge: true,
        creativity: true,
        power: true,
        wins: true,
        losses: true,
        totalMatches: true,
        winRate: true,
        balance: true,
        totalEarned: true,
        status: true,
        lastSeen: true,
      },
    });

    // Add rank
    const leaderboard = agents.map((agent, index) => ({
      ...agent,
      rank: index + 1,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
