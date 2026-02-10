import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth';
import { processAnswer } from '@/lib/battle-engine';

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
