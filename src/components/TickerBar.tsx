import React, { useState, useEffect, useMemo } from 'react';
import { Star, Radio, TrendingUp, Sparkles } from 'lucide-react';
import type { GameEvent, FavoritesState, TogglesState } from '../types';

interface TickerBarProps {
  events: GameEvent[];
  toggles: TogglesState;
  favorites: FavoritesState;
  getTeamById: (teamId: string) => any;
  onSelectEvent: (event: GameEvent) => void;
}

export type TickerFilterMode = 'all' | 'favorites' | 'live';

const LOCAL_STORAGE_TICKER_FILTER = 'sportscal_ticker_filter';

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

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_TICKER_FILTER, filterMode);
  }, [filterMode]);

  // Filter today's games matching visibility & active ticker filter
  const tickerEvents = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    return events.filter(event => {
      // 1. Exclude games from blocked/hidden leagues
      if (toggles.leagues[event.league] === false) return false;

      // 2. Exclude games from blocked teams
      if (toggles.teams[event.homeTeam.id] === false) return false;
      if (toggles.teams[event.awayTeam.id] === false) return false;

      // 3. Must be scheduled for Today
      const localDate = new Date(event.date);
      const eventDateStr = `${localDate.getFullYear()}-${localDate.getMonth()}-${localDate.getDate()}`;
      if (eventDateStr !== todayStr) return false;

      // 4. Apply Ticker Filter Mode
      if (filterMode === 'live') {
        return event.status.state === 'in';
      }

      if (filterMode === 'favorites') {
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

        const isUfcCardFav = event.league === 'ufc' && event.ufcFights?.some(fight =>
          fight.competitors.some(c => favorites.teams.includes(`ufc-${c.id}`))
        );

        return isLeagueFav || isHomeFav || isAwayFav || isConfFav || isUfcCardFav;
      }

      return true;
    });
  }, [events, toggles, favorites, filterMode, getTeamById]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    let allCount = 0;
    let favCount = 0;
    let liveCount = 0;

    events.forEach(event => {
      if (toggles.leagues[event.league] === false) return;
      if (toggles.teams[event.homeTeam.id] === false) return;
      if (toggles.teams[event.awayTeam.id] === false) return;

      const localDate = new Date(event.date);
      const eventDateStr = `${localDate.getFullYear()}-${localDate.getMonth()}-${localDate.getDate()}`;
      if (eventDateStr !== todayStr) return;

      allCount++;
      if (event.status.state === 'in') liveCount++;

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

      const isUfcFav = event.league === 'ufc' && event.ufcFights?.some(fight =>
        fight.competitors.some(c => favorites.teams.includes(`ufc-${c.id}`))
      );

      if (isLeagueFav || isHomeFav || isAwayFav || isConfFav || isUfcFav) {
        favCount++;
      }
    });

    return { all: allCount, favorites: favCount, live: liveCount };
  }, [events, toggles, favorites, getTeamById]);

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
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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

  return (
    <div className="ticker-wrapper">
      <div className="ticker-header-bar">
        <div className="ticker-title-group">
          <TrendingUp className="ticker-icon" size={16} />
          <span className="ticker-title">TODAY'S TICKER</span>
          <span className="ticker-badge">{counts.all} Games</span>
        </div>

        <div className="ticker-filter-pills">
          <button
            className={`ticker-filter-pill ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
            title="Show all enabled games for today"
          >
            <span>All Today</span>
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

      <div className="ticker-container" title="Hover to pause ticker scroll">
        {tickerEvents.length === 0 ? (
          <div className="ticker-empty">
            <Sparkles size={14} className="text-muted" />
            <span>No games today matching ticker filter ({filterMode}).</span>
          </div>
        ) : (
          <div className="ticker-track" style={{ '--ticker-duration': `${tickerDuration}s` } as React.CSSProperties}>
            {displayItems.map((event, idx) => {
              const isLive = event.status.state === 'in';
              const isPost = event.status.state === 'post';
              const broadcast = event.tvBroadcasts?.[0];

              return (
                <div
                  key={`${event.id}-${idx}`}
                  className={`ticker-item ${isLive ? 'is-live' : ''} ${isPost ? 'is-post' : ''}`}
                  onClick={() => onSelectEvent(event)}
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
                        <span className="ticker-time">{formatTime(event.date)}</span>
                        {broadcast && <span className="ticker-channel">{broadcast}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
