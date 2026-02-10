import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { Agent } from '@prisma/client';

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Extract and validate Bearer token from request
 * Updates agent's lastSeen timestamp
 */
export async function authenticateRequest(request: NextRequest): Promise<Agent> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    throw new AuthError('Missing Authorization header', 401);
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AuthError('Invalid Authorization header format. Expected: Bearer <token>', 401);
  }

  const token = parts[1];
  
  if (!token) {
    throw new AuthError('Missing token', 401);
  }

  // Find agent by token
  const agent = await prisma.agent.findUnique({
    where: { token },
  });

  if (!agent) {
    throw new AuthError('Invalid token', 401);
  }

  // Update lastSeen timestamp
  await prisma.agent.update({
    where: { id: agent.id },
    data: { lastSeen: new Date() },
  });

  return agent;
}

/**
 * Optional authentication - returns agent if token is valid, null otherwise
 */
export async function optionalAuth(request: NextRequest): Promise<Agent | null> {
  try {
    return await authenticateRequest(request);
  } catch {
    return null;
  }
}
