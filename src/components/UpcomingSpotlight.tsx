import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Star, Tv, MoveVertical, Flame, Calendar } from 'lucide-react';
import type { GameEvent, FavoritesState, TogglesState } from '../types';
import { isCloseLateGame } from '../gameUtils';

interface UpcomingSpotlightProps {
  events: GameEvent[];
  toggles: TogglesState;
  favorites: FavoritesState;
  getTeamById: (teamId: string) => any;
  onSelectEvent: (event: GameEvent) => void;
  position: 'header' | 'feed';
  onTogglePosition: () => void;
}

interface SpotlightItem {
  event: GameEvent;
  favoriteLabel?: string;
  extraCount: number; // additional upcoming matches for this team/league
  isCloseGame?: boolean;
}

export const UpcomingSpotlight: React.FC<UpcomingSpotlightProps> = ({
  events,
  toggles,
  favorites,
  getTeamById,
  onSelectEvent,
  position,
  onTogglePosition,
}) => {
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now());

  // Live ticking clock for countdown updates
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute the 3 spotlight items adhering to the 1-per-favorite cap
  const spotlightItems = useMemo<SpotlightItem[]>(() => {
    // 1. Get all upcoming or live matches from ENABLED leagues & teams
    const validEvents = events.filter(event => {
      if (toggles.leagues[event.league] === false) return false;
      if (toggles.teams[event.homeTeam.id] === false) return false;
      if (toggles.teams[event.awayTeam.id] === false) return false;

      // Completed games are not upcoming
      if (event.status.completed || event.status.state === 'post') return false;

      // Start time must be now or in the future (or live right now)
      const eventTime = new Date(event.date).getTime();
      return eventTime >= Date.now() - 3 * 3600 * 1000; // Allow recently started live games
    });

    // Sort chronologically by start date
    validEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pickedItems: SpotlightItem[] = [];
    const usedEntityKeys = new Set<string>(); // Tracks unique teams/leagues already picked
    const usedEventIds = new Set<string>();

    // 2. Identify favorite entities (teams, leagues, conferences)
    const favoriteTeams = favorites.teams || [];
    const favoriteLeagues = favorites.leagues || [];
    const favoriteConferences = favorites.conferences || [];

    // Helper to get favorite label for an event
    const getFavoriteReason = (event: GameEvent): { entityKey: string; label: string } | null => {
      // Check Home Team
      if (favoriteTeams.includes(event.homeTeam.id)) {
        return { entityKey: `team-${event.homeTeam.id}`, label: event.homeTeam.displayName };
      }
      // Check Away Team
      if (favoriteTeams.includes(event.awayTeam.id)) {
        return { entityKey: `team-${event.awayTeam.id}`, label: event.awayTeam.displayName };
      }
      // Check League
      if (favoriteLeagues.includes(event.league)) {
        return { entityKey: `league-${event.league}`, label: `${event.league.toUpperCase()} League` };
      }
      // Check Conferences
      if (event.league === 'ncaaf' || event.league === 'ncaab') {
        const homeObj = getTeamById(event.homeTeam.id);
        const awayObj = getTeamById(event.awayTeam.id);
        if (homeObj?.conference && favoriteConferences.includes(`${event.league}-${homeObj.conference}`)) {
          return { entityKey: `conf-${event.league}-${homeObj.conference}`, label: `${homeObj.conference} Conference` };
        }
        if (awayObj?.conference && favoriteConferences.includes(`${event.league}-${awayObj.conference}`)) {
          return { entityKey: `conf-${event.league}-${awayObj.conference}`, label: `${awayObj.conference} Conference` };
        }
      }
      // Check UFC
      if (event.league === 'ufc' && event.ufcFights) {
        for (const fight of event.ufcFights) {
          for (const c of fight.competitors) {
            const ufcId = `ufc-${c.id}`;
            if (favoriteTeams.includes(ufcId)) {
              return { entityKey: `team-${ufcId}`, label: c.displayName };
            }
          }
        }
      }

      return null;
    };

    // Close late games take the top spotlight slots before upcoming matches.
    // They are selected from validEvents, so hidden leagues and teams stay hidden.
    for (const event of validEvents) {
      if (pickedItems.length >= 3 || !isCloseLateGame(event)) continue;

      const favInfo = getFavoriteReason(event);
      const homeKey = `team-${event.homeTeam.id}`;
      const awayKey = `team-${event.awayTeam.id}`;
      const leagueKey = `league-${event.league}`;

      usedEventIds.add(event.id);
      usedEntityKeys.add(homeKey);
      usedEntityKeys.add(awayKey);
      usedEntityKeys.add(leagueKey);
      if (favInfo) usedEntityKeys.add(favInfo.entityKey);

      pickedItems.push({
        event,
        favoriteLabel: favInfo?.label,
        extraCount: 0,
        isCloseGame: true,
      });
    }

    // Pick 1 game per favorite entity
    for (const event of validEvents) {
      if (pickedItems.length >= 3) break;

      const favInfo = getFavoriteReason(event);
      if (favInfo) {
        if (!usedEntityKeys.has(favInfo.entityKey)) {
          usedEntityKeys.add(favInfo.entityKey);
          usedEventIds.add(event.id);

          // Calculate how many EXTRA upcoming games this favorite entity has
          const allUpcomingForEntity = validEvents.filter(e => {
            const info = getFavoriteReason(e);
            return info?.entityKey === favInfo.entityKey;
          });
          const extraCount = Math.max(0, allUpcomingForEntity.length - 1);

          pickedItems.push({
            event,
            favoriteLabel: favInfo.label,
            extraCount,
          });
        }
      }
    }

    // 3. Fallback: If fewer than 3 items found from favorites, fill with other featured upcoming games (max 1 per team/league)
    if (pickedItems.length < 3) {
      for (const event of validEvents) {
        if (pickedItems.length >= 3) break;
        if (usedEventIds.has(event.id)) continue;

        const homeKey = `team-${event.homeTeam.id}`;
        const awayKey = `team-${event.awayTeam.id}`;
        const leagueKey = `league-${event.league}`;

        if (!usedEntityKeys.has(homeKey) && !usedEntityKeys.has(awayKey) && !usedEntityKeys.has(leagueKey)) {
          usedEntityKeys.add(homeKey);
          usedEntityKeys.add(awayKey);
          usedEntityKeys.add(leagueKey);
          usedEventIds.add(event.id);

          pickedItems.push({
            event,
            favoriteLabel: undefined,
            extraCount: 0,
          });
        }
      }
    }

    return pickedItems;
  }, [events, toggles, favorites, getTeamById]);

  // Format Countdown String
  const getCountdownString = (isoDate: string, state: string) => {
    if (state === 'in') return null;

    const targetTime = new Date(isoDate).getTime();
    const diffMs = targetTime - nowTimestamp;

    if (diffMs <= 0) return 'Starting soon';

    const totalSecs = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSecs / (3600 * 24));
    const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${mins}m`;
    }
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const formatMatchDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (spotlightItems.length === 0) return null;

  return (
    <div className={`spotlight-container ${position}`}>
      <div className="spotlight-header">
        <div className="spotlight-title-group">
          <Sparkles className="spotlight-star-icon" size={18} />
          <h3>UPCOMING MATCHES SPOTLIGHT</h3>
          <span className="spotlight-cap-tag">Top 3 Next Games</span>
        </div>

        <div className="spotlight-actions">
          <button 
            className="spotlight-layout-btn"
            onClick={onTogglePosition}
            title="Toggle layout placement of Upcoming Spotlight block"
          >
            <MoveVertical size={13} />
            <span>Position: {position === 'header' ? 'Top of Page' : 'Above Feed'}</span>
          </button>
        </div>
      </div>

      <div className="spotlight-grid">
        {spotlightItems.map(({ event, favoriteLabel, extraCount, isCloseGame }) => {
          const isLive = event.status.state === 'in';
          const countdown = getCountdownString(event.date, event.status.state);
          const broadcast = event.tvBroadcasts?.[0];

          return (
            <div
              key={event.id}
              className={`spotlight-card ${isLive ? 'is-live' : ''} ${isCloseGame ? 'is-close-late' : ''}`}
              onClick={() => onSelectEvent(event)}
              style={{ '--league-color': `var(--color-${event.league})` } as React.CSSProperties}
            >
              {/* Header Badge Row */}
              <div className="spotlight-card-top">
                <span className="spotlight-league-tag" style={{ backgroundColor: `var(--color-${event.league})` }}>
                  {event.league.toUpperCase()}
                </span>

                {favoriteLabel ? (
                  <span className="spotlight-fav-tag">
                    <Star size={11} className="fill-star" />
                    <span>{favoriteLabel}</span>
                  </span>
                ) : isCloseGame ? (
                  <span className="spotlight-featured-tag">
                    <Flame size={11} />
                    <span>Close Game</span>
                  </span>
                ) : (
                  <span className="spotlight-featured-tag">
                    <Flame size={11} />
                    <span>Featured</span>
                  </span>
                )}

                {extraCount > 0 && (
                  <span className="spotlight-extra-tag" title={`${extraCount} more upcoming match(es) scheduled for this favorite`}>
                    +{extraCount} upcoming
                  </span>
                )}
              </div>

              {/* Matchup Center */}
              {event.league === 'f1' ? (
                <div className="spotlight-f1-matchup">
                  <div className="team-logo-glow-wrapper f1-glow" style={{ position: 'relative' }}>
                    <img 
                      src={event.homeTeam.logo || 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/f1.png'} 
                      alt="F1" 
                      className="spotlight-logo f1-hero-logo" 
                    />
                    {event.f1CountryFlag && (
                      <img 
                        src={event.f1CountryFlag} 
                        alt="Host Country Flag" 
                        style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '13px', objectFit: 'cover', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.2)' }}
                        title="Grand Prix Host Country"
                      />
                    )}
                  </div>
                  <div className="spotlight-f1-info">
                    <span className="spotlight-f1-session">
                      F1: {event.f1SessionType || (event.homeTeam.displayName !== 'F1' ? event.homeTeam.displayName : 'Race')}
                    </span>
                    <span className="spotlight-f1-gp">
                      {event.name.split(' - ')[0]}
                    </span>
                    {isLive ? (
                      <div className="spotlight-live-pulse" style={{ marginTop: '4px' }}>
                        <span className="pulse-dot"></span>
                        <span className="live-text">LIVE SESSION</span>
                      </div>
                    ) : event.status.state === 'post' && event.homeTeam.score ? (
                      <span className="spotlight-f1-winner">
                        🏆 Winner: {event.homeTeam.score}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="spotlight-matchup">
                  <div className="spotlight-team">
                    <div className="team-logo-glow-wrapper">
                      <img src={event.awayTeam.logo} alt="" className="spotlight-logo" />
                    </div>
                    <span className="spotlight-team-name">{event.awayTeam.abbreviation}</span>
                    <span className="spotlight-full-name">{event.awayTeam.displayName}</span>
                  </div>

                  <div className="spotlight-vs-container">
                    {isLive ? (
                      <div className="spotlight-live-pulse">
                        <span className="pulse-dot"></span>
                        <span className="live-text">LIVE NOW</span>
                        <span className="live-score">{event.awayTeam.score} - {event.homeTeam.score}</span>
                      </div>
                    ) : (
                      <div className="spotlight-vs-box">
                        <span className="vs-text">VS</span>
                      </div>
                    )}
                  </div>

                  <div className="spotlight-team">
                    <div className="team-logo-glow-wrapper">
                      <img src={event.homeTeam.logo} alt="" className="spotlight-logo" />
                    </div>
                    <span className="spotlight-team-name">{event.homeTeam.abbreviation}</span>
                    <span className="spotlight-full-name">{event.homeTeam.displayName}</span>
                  </div>
                </div>
              )}

              {/* Card Footer Details */}
              <div className="spotlight-card-footer">
                <div className="spotlight-time-info">
                  <Calendar size={13} className="text-secondary" />
                  <span>{formatMatchDate(event.date)}</span>
                </div>

                {countdown && (
                  <div className="spotlight-countdown-badge">
                    <span className="countdown-prefix">Starts in</span>
                    <span className="countdown-timer">{countdown}</span>
                  </div>
                )}

                {broadcast && (
                  <div className="spotlight-tv-badge">
                    <Tv size={12} />
                    <span>{broadcast}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
