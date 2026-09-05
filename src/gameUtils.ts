import type { GameEvent } from './types';

const getClockSeconds = (clock?: string): number | null => {
  const match = clock?.match(/(\d+):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const getSoccerMinute = (clock?: string): number | null => {
  const match = clock?.match(/^(\d+)/);
  return match ? Number(match[1]) : null;
};

const isSoccerEvent = (event: GameEvent): boolean =>
  ['mls', 'epl', 'laliga', 'champions', 'worldcup'].includes(event.league) ||
  event.name.startsWith('[Olympics Soccer]');

const isBasketballEvent = (event: GameEvent): boolean =>
  ['nba', 'ncaab'].includes(event.league) || event.name.startsWith('[Olympics Basketball]');

export const isCloseLateGame = (event: GameEvent): boolean => {
  if (event.status.state !== 'in') return false;

  const homeScore = Number(event.homeTeam.score);
  const awayScore = Number(event.awayTeam.score);
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return false;

  const scoreMargin = Math.abs(homeScore - awayScore);
  const clock = event.status.displayClock || event.status.detail;

  if (event.league === 'nfl' || event.league === 'ncaaf') {
    const secondsRemaining = getClockSeconds(clock);
    const isLate = event.status.period !== undefined && (
      event.status.period > 4 ||
      (event.status.period === 4 && secondsRemaining !== null && secondsRemaining <= 5 * 60)
    );
    return scoreMargin <= 10 && isLate;
  }

  if (isBasketballEvent(event)) {
    const secondsRemaining = getClockSeconds(clock);
    const regulationFinalPeriod = event.league === 'ncaab' ? 2 : 4;
    const isLate = event.status.period !== undefined && (
      event.status.period > regulationFinalPeriod ||
      (event.status.period === regulationFinalPeriod && secondsRemaining !== null && secondsRemaining <= 3 * 60)
    );
    return scoreMargin <= 10 && isLate;
  }

  if (isSoccerEvent(event)) {
    const minute = getSoccerMinute(clock);
    return scoreMargin <= 1 && minute !== null && minute >= 80;
  }

  return false;
};
