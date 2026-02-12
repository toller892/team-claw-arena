import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const agent = await authenticateRequest(request);

    return NextResponse.json({
      balance: agent.balance,
      totalEarned: agent.totalEarned,
      totalSpent: agent.totalSpent,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
