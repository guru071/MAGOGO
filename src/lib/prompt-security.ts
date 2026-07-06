import { db } from '@/lib/db';
import type { User } from '@prisma/client';

type PromptAccessUser = Pick<User, 'id' | 'role'> | Partial<User> | null | undefined;

type PromptAccessFields = {
  id: string;
  sellerId?: string | null;
  isFree?: boolean | null;
  price?: number | null;
  status?: string | null;
  promptText?: string | null;
};

function isAdmin(user: PromptAccessUser): boolean {
  return user?.role === 'ADMIN';
}

function isSellerOwner(prompt: PromptAccessFields, user: PromptAccessUser): boolean {
  return Boolean(user?.id && prompt.sellerId && prompt.sellerId === user.id);
}

export function canViewPromptMetadata(prompt: PromptAccessFields, user: PromptAccessUser): boolean {
  return prompt.status === 'APPROVED' || isAdmin(user) || isSellerOwner(prompt, user);
}

async function getPurchasedPromptIds(prompts: PromptAccessFields[], user: PromptAccessUser) {
  if (!user?.id || isAdmin(user)) return new Map<string, string>();

  const promptIds = prompts
    .filter(prompt => !isSellerOwner(prompt, user))
    .map(prompt => prompt.id);

  if (promptIds.length === 0) return new Map<string, string>();

  const orders = await db.order.findMany({
    where: {
      buyerId: user.id,
      promptId: { in: [...new Set(promptIds)] },
      status: 'COMPLETED',
    },
    select: { promptId: true, id: true },
  });

  const map = new Map<string, string>();
  for (const o of orders) {
    map.set(o.promptId, o.id);
  }
  return map;
}

export async function sanitizePromptsForUser<T extends PromptAccessFields>(
  prompts: T[],
  user: PromptAccessUser,
): Promise<Array<T & { hasAccess: boolean; isPromptLocked: boolean; accessReason: string | null; purchasedOrderId?: string | null }>> {
  const purchasedPromptMap = await getPurchasedPromptIds(prompts, user);

  return prompts.map(prompt => {
    const isPurchased = purchasedPromptMap.has(prompt.id);
    const accessReason =
      isAdmin(user) ? 'ADMIN'
      : isSellerOwner(prompt, user) ? 'OWNER'
      : isPurchased ? 'PURCHASED'
      : null;

    const hasAccess = Boolean(accessReason);

    return {
      ...prompt,
      promptText: hasAccess ? (prompt.promptText ?? null) : null,
      hasAccess,
      isPromptLocked: !hasAccess,
      accessReason,
      purchasedOrderId: isPurchased ? purchasedPromptMap.get(prompt.id) : null
    };
  });
}

export async function sanitizePromptForUser<T extends PromptAccessFields>(
  prompt: T,
  user: PromptAccessUser,
) {
  const [sanitized] = await sanitizePromptsForUser([prompt], user);
  return sanitized;
}
