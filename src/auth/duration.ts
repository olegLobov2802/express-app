const DURATION_PATTERN = /^(\d+)([smhdw])$/i;

const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
};

export function parseDurationToSeconds(duration: string): number {
  const trimmed = duration.trim();

  const match = trimmed.match(DURATION_PATTERN);

  if (match) {
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    return value * UNIT_SECONDS[unit];
  }

  const seconds = Number(trimmed);

  if (Number.isInteger(seconds) && seconds > 0) {
    return seconds;
  }

  throw new Error(`Invalid duration: ${duration}`);
}

export function addDurationToDate(duration: string, from = new Date()): Date {
  const seconds = parseDurationToSeconds(duration);
  return new Date(from.getTime() + seconds * 1000);
}
