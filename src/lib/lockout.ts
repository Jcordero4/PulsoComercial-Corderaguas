export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

export function isLocked(lockedUntil: Date | null | undefined, now: Date = new Date()): boolean {
  return !!lockedUntil && lockedUntil.getTime() > now.getTime();
}

/** Estado tras un intento fallido: al llegar al máximo se bloquea y el contador vuelve a cero. */
export function afterFailedLogin(
  failedLogins: number,
  now: Date = new Date(),
): { failedLogins: number; lockedUntil: Date | null } {
  const next = failedLogins + 1;
  if (next >= MAX_FAILED_LOGINS) {
    return { failedLogins: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) };
  }
  return { failedLogins: next, lockedUntil: null };
}
