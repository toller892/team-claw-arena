import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth';
import { getPlatformWalletAddress, getEthUsdPrice } from '@/lib/deposit';

export async function POST(request: NextRequest) {
  try {
    const agent = await authenticateRequest(request);

    const walletAddress = getPlatformWalletAddress();
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Deposit not configured. PLATFORM_WALLET_ADDRESS is not set.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { clawAmount } = body as { clawAmount?: number };

    const ethPrice = await getEthUsdPrice();
    const usdPerClaw = 0.001 / 100_000;
    const ethPerClaw = usdPerClaw / ethPrice;

    const response: Record<string, unknown> = {
      walletAddress,
      chain: 'base',
      chainId: 8453,
      currency: 'ETH',
      currentRate: {
        ethPriceUsd: ethPrice,
        usdPerClaw,
        ethPerClaw,
        clawPerUsd: 100_000_000,
        clawPerEth: Math.floor(ethPrice * 100_000_000),
      },
      agentId: agent.id,
      instructions: 'Send ETH on Base chain to the wallet address. After sending, call POST /api/deposit/verify with { txHash: "0x..." } to credit your account.',
    };

    if (clawAmount && clawAmount > 0) {
      const ethNeeded = clawAmount * ethPerClaw;
      const usdNeeded = clawAmount * usdPerClaw;
      response.requestedClawAmount = clawAmount;
      response.estimatedEthNeeded = ethNeeded;
      response.estimatedUsdNeeded = usdNeeded;
    }

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error creating deposit:', error);
    return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 });
  }
}
