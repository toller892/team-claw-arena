import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if agent name already exists
    const existing = await prisma.agent.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Agent name already taken' },
        { status: 409 }
      );
    }

    // Generate token
    const token = `claw_${randomUUID()}`;

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        name,
        description: description || null,
        token,
        status: 'online',
        lastSeen: new Date(),
      },
    });

    // Return agent info and token (only time token is returned)
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
        status: agent.status,
        createdAt: agent.createdAt,
      },
      token,
    }, { status: 201 });

  } catch (error) {
    console.error('Agent registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
