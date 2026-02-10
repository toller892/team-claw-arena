import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runBattle } from '@/lib/battle-engine';

// POST /api/battles/[id]/run - Run a battle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if battle exists
    const battle = await prisma.battle.findUnique({
      where: { id },
    });

    if (!battle) {
      return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
    }

    if (battle.status === 'completed') {
      return NextResponse.json({ error: 'Battle already completed' }, { status: 400 });
    }

    if (battle.status === 'in-progress') {
      return NextResponse.json({ error: 'Battle already in progress' }, { status: 400 });
    }

    // Run the battle asynchronously
    // We don't await here to return immediately
    runBattle(id).catch((error) => {
      console.error('Battle execution error:', error);
    });

    return NextResponse.json({
      message: 'Battle started',
      battleId: id,
      status: 'in-progress'
    });
  } catch (error) {
    console.error('Error starting battle:', error);
    return NextResponse.json({ error: 'Failed to start battle' }, { status: 500 });
  }
}
