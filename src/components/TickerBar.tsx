import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Star, Radio, TrendingUp, Sparkles } from 'lucide-react';
import type { GameEvent, FavoritesState, TogglesState } from '../types';
import { isCloseLateGame } from '../gameUtils';

interface TickerBarProps {
  events: GameEvent[];
  toggles: TogglesState;
  favorites: FavoritesState;
  getTeamById: (teamId: string) => any;
  onSelectEvent: (event: GameEvent) => void;
}

export type TickerFilterMode = 'all' | 'favorites' | 'live';

const LOCAL_STORAGE_TICKER_FILTER = 'sportscal_ticker_filter';

const getDayTimestamp = (dateInput: Date | string | number): number => {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const isFavoriteEvent = (
  event: GameEvent,
  favorites: FavoritesState,
  getTeamById: (teamId: string) => any
): boolean => {
  const isLeagueFav = favorites.leagues.includes(event.league);
  const isHomeFav = favorites.teams.includes(event.homeTeam.id);
  const isAwayFav = favorites.teams.includes(event.awayTeam.id);

  let isConfFav = false;
  if (event.league === 'ncaaf' || event.league === 'ncaab') {
    const homeTeamObj = getTeamById(event.homeTeam.id);
    const awayTeamObj = getTeamById(event.awayTeam.id);
    const confs = favorites.conferences || [];
    if (homeTeamObj?.conference && confs.includes(`${event.league}-${homeTeamObj.conference}`)) {
      isConfFav = true;
    }
    if (awayTeamObj?.conference && confs.includes(`${event.league}-${awayTeamObj.conference}`)) {
      isConfFav = true;
    }
  }

  const isUfcCardFav =
    event.league === 'ufc' &&
    event.ufcFights?.some(fight =>
      fight.competitors.some(c => favorites.teams.includes(`ufc-${c.id}`))
    );

  return isLeagueFav || isHomeFav || isAwayFav || isConfFav || !!isUfcCardFav;
};

export const TickerBar: React.FC<TickerBarProps> = ({
  events,
  toggles,
  favorites,
  getTeamById,
  onSelectEvent,
}) => {
  const [filterMode, setFilterMode] = useState<TickerFilterMode>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_TICKER_FILTER);
    return (saved as TickerFilterMode) || 'all';
  });

  const [currentTimestamp, setCurrentTimestamp] = useState<number>(() => Date.now());
  const [tickerOffset, setTickerOffset] = useState(0);
  const [isDraggingTicker, setIsDraggingTicker] = useState(false);
  const dragStartRef = useRef({ pointerId: 0, clientX: 0, offset: 0 });
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_TICKER_FILTER, filterMode);
  }, [filterMode]);

  // Periodic timer to detect local day transitions (e.g. crossing midnight)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter enabled events based on leagues & team toggles
  const enabledEvents = useMemo(() => {
    return events.filter(event => {
      if (toggles.leagues[event.league] === false) return false;
      if (toggles.teams[event.homeTeam.id] === false) return false;
      if (toggles.teams[event.awayTeam.id] === false) return false;
      return true;
    });
  }, [events, toggles]);

  // Determine target day: today if games exist today; otherwise next day with games on
  const { targetDayStart, isShowingToday, nextDayWithGames } = useMemo(() => {
    const today = new Date(currentTimestamp);
    const todayStart = getDayTimestamp(today);

    let hasTodayGames = false;
    let earliestFutureDay: number | null = null;

    for (const event of enabledEvents) {
      const dayStart = getDayTimestamp(event.date);
      if (dayStart === todayStart) {
        hasTodayGames = true;
      } else if (dayStart > todayStart) {
        if (earliestFutureDay === null || dayStart < earliestFutureDay) {
          earliestFutureDay = dayStart;
        }
      }
    }

    if (hasTodayGames) {
      return {
        targetDayStart: todayStart,
        isShowingToday: true,
        nextDayWithGames: earliestFutureDay,
      };
    }

    if (earliestFutureDay !== null) {
      return {
        targetDayStart: earliestFutureDay,
        isShowingToday: false,
        nextDayWithGames: earliestFutureDay,
      };
    }

    return {
      targetDayStart: todayStart,
      isShowingToday: false,
      nextDayWithGames: null,
    };
  }, [enabledEvents, currentTimestamp]);

  // Filter games on target day matching visibility & active ticker filter
  const tickerEvents = useMemo(() => {
    const dayEvents = enabledEvents.filter(event => {
      const eventDayStart = getDayTimestamp(event.date);
      if (eventDayStart !== targetDayStart) return false;

      if (filterMode === 'live') {
        return event.status.state === 'in';
      }

      if (filterMode === 'favorites') {
        return isFavoriteEvent(event, favorites, getTeamById);
      }

      return true;
    });

    // Sort: live games first, then pre games chronologically, then post (final)
    return dayEvents.sort((a, b) => {
      const order = (st: string) => (st === 'in' ? 0 : st === 'pre' ? 1 : 2);
      const diff = order(a.status.state) - order(b.status.state);
      if (diff !== 0) return diff;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [enabledEvents, targetDayStart, filterMode, favorites, getTeamById]);

  // Counts for target day filter pills
  const counts = useMemo(() => {
    let allCount = 0;
    let favCount = 0;
    let liveCount = 0;

    enabledEvents.forEach(event => {
      const dayStart = getDayTimestamp(event.date);
      if (dayStart !== targetDayStart) return;

      allCount++;
      if (event.status.state === 'in') liveCount++;
      if (isFavoriteEvent(event, favorites, getTeamById)) {
        favCount++;
      }
    });

    return { all: allCount, favorites: favCount, live: liveCount };
  }, [enabledEvents, targetDayStart, favorites, getTeamById]);

  // Labels for header & pills
  const dateLabels = useMemo(() => {
    if (isShowingToday) {
      return {
        title: "TODAY'S TICKER",
        pillAll: 'All Today',
        badge: null,
        fullDateStr: 'Today',
      };
    }

    if (!nextDayWithGames) {
      return {
        title: "TODAY'S TICKER",
        pillAll: 'All Today',
        badge: null,
        fullDateStr: 'Today',
      };
    }

    const today = new Date(currentTimestamp);
    const todayStart = getDayTimestamp(today);
    const targetDate = new Date(targetDayStart);
    const daysDiff = Math.round((targetDayStart - todayStart) / (24 * 60 * 60 * 1000));

    const weekday = targetDate.toLocaleDateString([], { weekday: 'short' });
    const monthDay = targetDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

    let badgeText = `${weekday}, ${monthDay}`;
    let pillText = `All (${weekday})`;

    if (daysDiff === 1) {
      badgeText = `Tomorrow, ${monthDay}`;
      pillText = 'All (Tomorrow)';
    }

    return {
      title: 'NEXT UP TICKER',
      pillAll: pillText,
      badge: badgeText,
      fullDateStr: badgeText,
    };
  }, [isShowingToday, nextDayWithGames, targetDayStart, currentTimestamp]);

  // Duplicate items array to achieve continuous seamless loop
  const displayItems = useMemo(() => {
    if (tickerEvents.length === 0) return [];
    // If few items, duplicate enough times to span screen
    if (tickerEvents.length < 5) {
      return [...tickerEvents, ...tickerEvents, ...tickerEvents, ...tickerEvents];
    }
    return [...tickerEvents, ...tickerEvents];
  }, [tickerEvents]);

  // Helper to format start time in local time
  const formatTime = (isoString: string, showDay: boolean = false) => {
    const d = new Date(isoString);
    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (showDay) {
      const weekday = d.toLocaleDateString([], { weekday: 'short' });
      return `${weekday} ${timeStr}`;
    }
    return timeStr;
  };

  // Calculate dynamic animation duration based on item count to maintain constant scroll speed (px/sec)
  const tickerDuration = useMemo(() => {
    const itemCount = tickerEvents.length;
    if (itemCount === 0) return 30;
    // Constant speed of ~45px per second (~210px per item pill)
    const estimatedWidth = itemCount * 210;
    const speedPxPerSec = 45;
    return Math.max(20, Math.round(estimatedWidth / speedPxPerSec));
  }, [tickerEvents.length]);

  const handleTickerPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = { pointerId: event.pointerId, clientX: event.clientX, offset: tickerOffset };
    hasDraggedRef.current = false;
    setIsDraggingTicker(true);
  };

  const handleTickerPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingTicker || event.pointerId !== dragStartRef.current.pointerId) return;

    const distance = event.clientX - dragStartRef.current.clientX;
    if (Math.abs(distance) > 4) hasDraggedRef.current = true;
    setTickerOffset(dragStartRef.current.offset + distance);
  };

  const handleTickerPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== dragStartRef.current.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDraggingTicker(false);
  };

  return (
    <div className="ticker-wrapper">
      <div className="ticker-header-bar">
        <div className="ticker-title-group">
          <TrendingUp className="ticker-icon" size={16} />
          <span className="ticker-title">{dateLabels.title}</span>
          {dateLabels.badge && (
            <span className="ticker-badge ticker-date-badge">{dateLabels.badge}</span>
          )}
          <span className="ticker-badge">{counts.all} Games</span>
        </div>

        <div className="ticker-filter-pills">
          <button
            className={`ticker-filter-pill ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
            title={isShowingToday ? 'Show all enabled games for today' : `Show all enabled games for ${dateLabels.fullDateStr}`}
          >
            <span>{dateLabels.pillAll}</span>
            <span className="pill-count">{counts.all}</span>
          </button>
          
          <button
            className={`ticker-filter-pill ${filterMode === 'favorites' ? 'active' : ''}`}
            onClick={() => setFilterMode('favorites')}
            title="Show games matching favorited leagues or teams"
          >
            <Star size={11} className={filterMode === 'favorites' ? 'fill-star' : ''} />
            <span>Favorites</span>
            <span className="pill-count">{counts.favorites}</span>
          </button>

          <button
            className={`ticker-filter-pill ${filterMode === 'live' ? 'active' : ''}`}
            onClick={() => setFilterMode('live')}
            title="Show live games currently in progress"
          >
            <Radio size={11} className="live-pulse-icon" />
            <span>Live Only</span>
            <span className="pill-count live">{counts.live}</span>
          </button>
        </div>
      </div>

      <div
        className={`ticker-container ${isDraggingTicker ? 'is-dragging' : ''}`}
        title="Drag left or right to browse the ticker"
        onPointerDown={handleTickerPointerDown}
        onPointerMove={handleTickerPointerMove}
        onPointerUp={handleTickerPointerEnd}
        onPointerCancel={handleTickerPointerEnd}
      >
        {tickerEvents.length === 0 ? (
          <div className="ticker-empty">
            <Sparkles size={14} className="text-muted" />
            <span>
              {isShowingToday
                ? `No games today matching ticker filter (${filterMode}).`
                : nextDayWithGames
                ? `No games on ${dateLabels.fullDateStr} matching ticker filter (${filterMode}).`
                : `No upcoming games found matching ticker filter (${filterMode}).`}
            </span>
          </div>
        ) : (
          <div className="ticker-drag-layer" style={{ transform: `translateX(${tickerOffset}px)` }}>
            <div className="ticker-track" style={{ '--ticker-duration': `${tickerDuration}s` } as React.CSSProperties}>
              {displayItems.map((event, idx) => {
              const isLive = event.status.state === 'in';
              const isPost = event.status.state === 'post';
              const isCloseLate = isCloseLateGame(event);
              const broadcast = event.tvBroadcasts?.[0];

              return (
                <div
                  key={`${event.id}-${idx}`}
                  className={`ticker-item ${isLive ? 'is-live' : ''} ${isCloseLate ? 'is-close-late' : ''} ${isPost ? 'is-post' : ''}`}
                  onClick={() => {
                    if (hasDraggedRef.current) {
                      hasDraggedRef.current = false;
                      return;
                    }
                    onSelectEvent(event);
                  }}
                  style={{ '--league-accent': `var(--color-${event.league})` } as React.CSSProperties}
                >
                  <span className="ticker-item-league" style={{ backgroundColor: `var(--color-${event.league})` }}>
                    {event.league.toUpperCase()}
                  </span>

                  {/* Teams & Scores */}
                  {event.league === 'f1' ? (
                    <div className="ticker-f1-teams">
                      <div className="f1-logos-group" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <img 
                          src={event.homeTeam.logo || 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/f1.png'} 
                          alt="F1" 
                          className="ticker-team-logo f1-logo" 
                        />
                        {event.f1CountryFlag && (
                          <img 
                            src={event.f1CountryFlag} 
                            alt="Host Country" 
                            style={{ width: '18px', height: '12px', objectFit: 'cover', borderRadius: '2px' }}
                            title="Grand Prix Host Country"
                          />
                        )}
                      </div>
                      <div className="ticker-f1-details">
                        <span className="ticker-f1-title">
                          F1: {event.f1SessionType || (event.homeTeam.displayName !== 'F1' ? event.homeTeam.displayName : 'Race')}
                        </span>
                        <span className="ticker-f1-gp">
                          {event.name.split(' - ')[0].replace(' Grand Prix', ' GP')}
                        </span>
                      </div>
                      {isPost && event.homeTeam.score && (
                        <span className="ticker-f1-winner">1st: {event.homeTeam.score}</span>
                      )}
                    </div>
                  ) : (
                    <div className="ticker-item-teams">
                      <div className="ticker-team-row">
                        <img src={event.awayTeam.logo} alt="" className="ticker-team-logo" />
                        <span className={`ticker-team-name ${event.awayTeam.winner ? 'winner' : ''}`}>
                          {event.awayTeam.abbreviation}
                        </span>
                        {(isLive || isPost) && (
                          <span className={`ticker-team-score ${event.awayTeam.winner ? 'winner' : ''}`}>
                            {event.awayTeam.score}
                          </span>
                        )}
                      </div>

                      <div className="ticker-team-row">
                        <img src={event.homeTeam.logo} alt="" className="ticker-team-logo" />
                        <span className={`ticker-team-name ${event.homeTeam.winner ? 'winner' : ''}`}>
                          {event.homeTeam.abbreviation}
                        </span>
                        {(isLive || isPost) && (
                          <span className={`ticker-team-score ${event.homeTeam.winner ? 'winner' : ''}`}>
                            {event.homeTeam.score}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="ticker-item-status">
                    {isLive ? (
                      <span className="ticker-live-badge">
                        <span className="pulse-dot"></span>
                        {event.status.displayClock || event.status.detail || 'LIVE'}
                      </span>
                    ) : isPost ? (
                      <span className="ticker-post-badge">FINAL</span>
                    ) : (
                      <div className="ticker-pre-badge">
                        <span className="ticker-time">{formatTime(event.date, !isShowingToday)}</span>
                        {broadcast && <span className="ticker-channel">{broadcast}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
