import { NextRequest, NextResponse } from 'next/server';
import { getPlatformWalletAddress, getEthUsdPrice } from '@/lib/deposit';

export async function GET(_request: NextRequest) {
  const walletAddress = getPlatformWalletAddress();

  try {
    const ethPrice = await getEthUsdPrice();

    return NextResponse.json({
      walletAddress,
      chain: 'base',
      chainId: 8453,
      rateInfo: '$0.001 = 100,000 CLAW',
      currency: 'ETH',
      ethPriceUsd: ethPrice,
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
