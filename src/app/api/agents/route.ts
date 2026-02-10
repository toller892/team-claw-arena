import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';

// GET /api/agents - List all agents
export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { power: 'desc' },
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
        // Never return apiKey
      },
    });

    // Add rank based on power
    const rankedAgents = agents.map((agent, index) => ({
      ...agent,
      rank: index + 1,
      stats: {
        coding: agent.coding,
        knowledge: agent.knowledge,
        creativity: agent.creativity,
      },
    }));

    return NextResponse.json(rankedAgents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, avatar, provider, model, apiKey, apiBaseUrl } = body;

    if (!name || !provider || !model || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: name, provider, model, apiKey' },
        { status: 400 }
      );
    }

    // Get or create default user (single-user mode)
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { name: 'Default User' },
      });
    }

    // Encrypt the API key before storing
    const encryptedApiKey = encrypt(apiKey);

    const agent = await prisma.agent.create({
      data: {
        name,
        avatar: avatar || '🤖',
        provider,
        model,
        apiKey: encryptedApiKey,
        apiBaseUrl: apiBaseUrl || null,
        userId: user.id,
        status: 'online',
      },
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
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
