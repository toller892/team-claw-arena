const BASE_RPC_URL = 'https://mainnet.base.org';
const COINGECKO_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';

// $0.001 = 100,000 CLAW
const USD_PER_CLAW_UNIT = 0.001;
const CLAW_PER_USD_UNIT = 100_000;

const PLATFORM_WALLET_ADDRESS = '0xcCb53AE339af6bB80bC446C86aA4E17Adf1D2498';

export function getPlatformWalletAddress(): string {
  return PLATFORM_WALLET_ADDRESS;
}

interface TransactionData {
  hash: string;
  from: string;
  to: string | null;
  value: string; // hex wei
  blockNumber: string | null;
}

interface TransactionReceipt {
  status: string; // "0x1" = success
  blockNumber: string;
}

/**
 * Fetch transaction details via Base RPC eth_getTransactionByHash
 */
export async function getTransaction(txHash: string): Promise<TransactionData | null> {
  const res = await fetch(BASE_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionByHash',
      params: [txHash],
    }),
  });
  const json = await res.json();
  return json.result || null;
}

/**
 * Fetch transaction receipt via Base RPC eth_getTransactionReceipt
 */
export async function getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
  const res = await fetch(BASE_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    }),
  });
  const json = await res.json();
  return json.result || null;
}

/**
 * Get current block number
 */
export async function getBlockNumber(): Promise<bigint> {
  const res = await fetch(BASE_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_blockNumber',
      params: [],
    }),
  });
  const json = await res.json();
  return BigInt(json.result);
}

/**
 * Fetch ETH/USD price from CoinGecko
 */
export async function getEthUsdPrice(): Promise<number> {
  const res = await fetch(COINGECKO_PRICE_URL);
  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status}`);
  }
  const json = await res.json();
  const price = json?.ethereum?.usd;
  if (typeof price !== 'number' || price <= 0) {
    throw new Error('Invalid ETH price from CoinGecko');
  }
  return price;
}

/**
 * Convert wei (hex string) to ETH (float)
 */
export function weiToEth(weiHex: string): { wei: bigint; eth: number } {
  const wei = BigInt(weiHex);
  // Convert to ETH: divide by 10^18
  const eth = Number(wei) / 1e18;
  return { wei, eth };
}

/**
 * Calculate CLAW amount from USD value
 * $0.001 = 100,000 CLAW → $1 = 100,000,000 CLAW
 */
export function usdToClaw(usdValue: number): number {
  return Math.floor((usdValue / USD_PER_CLAW_UNIT) * CLAW_PER_USD_UNIT);
}

/**
 * Verify a deposit transaction on Base chain.
 * Returns parsed data if valid, throws on any issue.
 */
export async function verifyDepositTransaction(txHash: string, platformWallet: string) {
  // Fetch tx and receipt in parallel
  const [tx, receipt, currentBlock] = await Promise.all([
    getTransaction(txHash),
    getTransactionReceipt(txHash),
    getBlockNumber(),
  ]);

  if (!tx) {
    throw new DepositError('Transaction not found on Base chain');
  }

  if (!receipt) {
    throw new DepositError('Transaction not yet confirmed (no receipt). Try again shortly.');
  }

  // Check success
  if (receipt.status !== '0x1') {
    throw new DepositError('Transaction failed on-chain (reverted)');
  }

  // Check recipient is platform wallet
  if (!tx.to || tx.to.toLowerCase() !== platformWallet.toLowerCase()) {
    throw new DepositError('Transaction recipient is not the platform wallet');
  }

  // Check at least 1 confirmation
  const txBlock = BigInt(receipt.blockNumber);
  const confirmations = currentBlock - txBlock;
  if (confirmations < BigInt(1)) {
    throw new DepositError('Transaction needs at least 1 confirmation. Try again shortly.');
  }

  // Parse value
  const { wei, eth } = weiToEth(tx.value);

  if (wei === BigInt(0)) {
    throw new DepositError('Transaction has zero ETH value');
  }

  return {
    fromAddress: tx.from,
    weiAmount: wei.toString(),
    ethAmount: eth,
    confirmations: Number(confirmations),
  };
}

export class DepositError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DepositError';
  }
}
