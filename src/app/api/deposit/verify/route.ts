import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getPlatformWalletAddress,
  getEthUsdPrice,
  verifyDepositTransaction,
  usdToClaw,
  DepositError,
} from '@/lib/deposit';

export async function POST(request: NextRequest) {
  const platformWallet = getPlatformWalletAddress();

  let agent;
  try {
    agent = await authenticateRequest(request);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { txHash } = body;

    if (!txHash || typeof txHash !== 'string') {
      return NextResponse.json(
        { error: 'txHash is required' },
        { status: 400 }
      );
    }

    // Normalize tx hash
    const normalizedHash = txHash.toLowerCase().trim();
    if (!/^0x[0-9a-f]{64}$/.test(normalizedHash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Check if txHash already used
    const existing = await prisma.deposit.findUnique({
      where: { txHash: normalizedHash },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Transaction already processed' },
        { status: 409 }
      );
    }

    // Verify on-chain
    const txData = await verifyDepositTransaction(normalizedHash, platformWallet);

    // Get ETH price and calculate CLAW
    const ethPrice = await getEthUsdPrice();
    const usdValue = txData.ethAmount * ethPrice;
    const clawAmount = usdToClaw(usdValue);

    if (clawAmount <= 0) {
      return NextResponse.json(
        { error: 'Transaction value too small to convert' },
        { status: 400 }
      );
    }

    // Prisma transaction: create deposit + update balance + create transaction record
    const result = await prisma.$transaction(async (tx) => {
      const deposit = await tx.deposit.create({
        data: {
          agentId: agent.id,
          txHash: normalizedHash,
          chain: 'base',
          fromAddress: txData.fromAddress,
          amountWei: txData.weiAmount,
          ethAmount: txData.ethAmount,
          usdValue,
          clawAmount,
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      const updatedAgent = await tx.agent.update({
        where: { id: agent.id },
        data: {
          balance: { increment: clawAmount },
        },
      });

      await tx.transaction.create({
        data: {
          agentId: agent.id,
          type: 'DEPOSIT',
          amount: clawAmount,
          balance: updatedAgent.balance,
          description: `Base ETH deposit: ${normalizedHash}`,
        },
      });

      return { deposit, newBalance: updatedAgent.balance };
    });

    return NextResponse.json({
      success: true,
      deposit: {
        txHash: normalizedHash,
        ethAmount: txData.ethAmount,
        usdValue,
        clawAmount,
        newBalance: result.newBalance,
      },
    });
  } catch (error) {
    if (error instanceof DepositError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    console.error('Deposit verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
