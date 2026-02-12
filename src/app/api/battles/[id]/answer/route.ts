import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth';
import { processAnswer } from '@/lib/battle-engine';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await authenticateRequest(request);
    const { id: battleId } = await params;
    const body = await request.json();
    const { round, answer } = body;

    // Validate input
    if (!round || ![1, 2, 3].includes(round)) {
      return NextResponse.json(
        { error: 'round must be 1, 2, or 3' },
        { status: 400 }
      );
    }

    if (!answer || typeof answer !== 'string') {
      return NextResponse.json(
        { error: 'answer is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if this is agent2's first answer (need to deduct wager)
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: { rounds: true, agent1: true, agent2: true },
    });

    if (!battle) {
      return NextResponse.json(
        { error: 'Battle not found' },
        { status: 404 }
      );
    }

    const isAgent2 = battle.agent2Id === agent.id;

    if (isAgent2) {
      // Check if agent2 has any previous answers in this battle
      const hasAnswered = battle.rounds.some((r) => r.agent2Answer !== null);

      if (!hasAnswered) {
        // First answer from agent2 — deduct wager
        // Re-fetch agent for fresh balance
        const freshAgent = await prisma.agent.findUnique({ where: { id: agent.id } });
        if (!freshAgent || freshAgent.balance < battle.wagerAmount) {
          return NextResponse.json(
            { error: `Insufficient balance. You have ${freshAgent?.balance ?? 0} CLAW but need ${battle.wagerAmount}` },
            { status: 400 }
          );
        }

        const newBalance = freshAgent.balance - battle.wagerAmount;
        await prisma.$transaction([
          prisma.agent.update({
            where: { id: agent.id },
            data: {
              balance: newBalance,
              totalSpent: { increment: battle.wagerAmount },
            },
          }),
          prisma.transaction.create({
            data: {
              agentId: agent.id,
              type: 'BET',
              amount: -battle.wagerAmount,
              balance: newBalance,
              battleId,
              description: `Wager for battle vs ${battle.agent1.name}`,
            },
          }),
        ]);
      }
    }

    // Process the answer
    const result = await processAnswer(battleId, agent.id, round, answer);

    return NextResponse.json({
      success: true,
      scored: result.scored,
      round: {
        number: result.round.number,
        category: result.round.category,
        agent1Status: result.round.agent1Status,
        agent2Status: result.round.agent2Status,
        agent1Score: result.round.agent1Score,
        agent2Score: result.round.agent2Score,
      },
      message: result.scored 
        ? 'Answer submitted and scored' 
        : 'Answer submitted, waiting for opponent',
    });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    if (error instanceof Error) {
      // Handle known errors
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('already')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('not part of')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
