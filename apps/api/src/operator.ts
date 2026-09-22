import { createHmac, timingSafeEqual } from "node:crypto";

export class OperatorError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function resolveOperator(authorization: string | undefined, bodyActor: string, token: string, name: string): string {
  if (!token) {
    if (!bodyActor.trim()) throw new OperatorError(400, "Actor is required.");
    return bodyActor.trim();
  }
  const presented = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  if (!presented || !same(presented, token)) throw new OperatorError(401, "Operator token is required.");
  return name;
}

export function signAudit(token: string, event: { at: string; actor: string; action: string; subjectKind: string; subjectId: string }): string {
  return createHmac("sha256", token).update([event.at, event.actor, event.action, event.subjectKind, event.subjectId].join("\n")).digest("hex");
}

function same(presented: string, token: string): boolean {
  const left = Buffer.from(presented);
  const right = Buffer.from(token);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
