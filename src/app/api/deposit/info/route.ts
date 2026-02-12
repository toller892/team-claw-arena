import { NextRequest, NextResponse } from 'next/server';
import { getPlatformWalletAddress, getEthUsdPrice } from '@/lib/deposit';

export async function GET(_request: NextRequest) {
  const walletAddress = getPlatformWalletAddress();

  if (!walletAddress) {
    return NextResponse.json(
      {
        error: 'Deposit not configured',
        message: 'PLATFORM_WALLET_ADDRESS environment variable is not set. Deposit functionality is unavailable.',
      },
      { status: 501 }
    );
  }

  try {
    const ethPrice = await getEthUsdPrice();

    // $0.001 = 100,000 CLAW
    const usdPerClaw = 0.001 / 100_000; // $0.00000001 per 1 CLAW
    const ethPerClaw = usdPerClaw / ethPrice;

    return NextResponse.json({
      walletAddress,
      chain: 'base',
      chainId: 8453,
      currency: 'ETH',
      currentRate: {
        ethPriceUsd: ethPrice,
        usdPerClaw,
        ethPerClaw,
        clawPerUsd: 100_000_000, // $1 = 100M CLAW
        clawPerEth: Math.floor(ethPrice * 100_000_000),
      },
      note: 'Send ETH on Base chain to the wallet address, then call POST /api/deposit/verify with the tx hash.',
    });
  } catch (error) {
    console.error('Error fetching deposit info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current rates' },
      { status: 500 }
    );
  }
}
