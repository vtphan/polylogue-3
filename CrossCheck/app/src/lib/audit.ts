import { prisma } from "./db";
import type { Prisma } from "@/generated/prisma/client";

export async function logAudit(opts: {
  actorId: string;
  action: string;
  targetId?: string;
  targetType?: string;
  payload?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: opts.actorId,
      action: opts.action,
      targetId: opts.targetId,
      targetType: opts.targetType,
      payload: opts.payload ?? {},
    },
  });
}
