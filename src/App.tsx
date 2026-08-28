import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Star, 
  Eye, 
  EyeOff, 
  Tv, 
  MapPin, 
  ExternalLink, 
  X,
  SlidersHorizontal,
  Maximize2,
  Search
} from 'lucide-react';
import type { League, Team, GameEvent, FavoritesState, TogglesState } from './types';
import { fetchScoreboard } from './api';
import { TEAMS_DIRECTORY, getReadableTeamColor } from './teamsData';
import { registerTeams, getAllTeamsForLeague } from './teamCache';
import { TickerBar } from './components/TickerBar';
import { UpcomingSpotlight } from './components/UpcomingSpotlight';

// Helper to format date for API (YYYYMMDD)
const formatDateForApi = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

// Local storage keys
const LOCAL_STORAGE_FAVORITES = 'sportscal_favorites';
const LOCAL_STORAGE_TOGGLES = 'sportscal_toggles';
const LOCAL_STORAGE_FAV_ONLY = 'sportscal_favorites_only';
const LOCAL_STORAGE_SIDEBAR_OPEN = 'sportscal_sidebar_open';

const ALIAS_MAP: Record<string, string> = {
  'ny': 'new york',
  'la': 'los angeles',
  'sf': 'san francisco',
  'gb': 'green bay',
  'tb': 'tampa bay',
  'kc': 'kansas city',
  'ne': 'new england',
  'sj': 'san jose',
  'dc': 'washington',
  'lv': 'las vegas',
  'philly': 'philadelphia',
  'indy': 'indianapolis',
  'jax': 'jacksonville',
  'ari': 'arizona',
  'car': 'carolina',
  'chi': 'chicago',
  'dal': 'dallas',
  'den': 'denver',
  'det': 'detroit',
  'hou': 'houston',
  'mia': 'miami',
  'min': 'minnesota',
  'sea': 'seattle',
  'stl': 'st. louis',
};

const LEAGUE_DISPLAY_NAMES: Record<League, string> = {
  nfl: 'NFL',
  nba: 'NBA',
  mlb: 'MLB',
  nhl: 'NHL',
  ncaaf: 'College Football',
  ncaab: 'College Basketball',
  mls: 'MLS',
  f1: 'Formula 1',
  ufc: 'UFC',
  worldcup: 'World Cup',
  olympics: 'Olympic Games',
  epl: 'EPL',
  laliga: 'La Liga',
  champions: 'Champions League',
};

const INITIAL_FAVORITES: FavoritesState = {
  leagues: [],
  teams: [],
};

const INITIAL_TOGGLES: TogglesState = {
  leagues: { nfl: true, nba: true, mlb: true, nhl: true, ncaaf: true, ncaab: true, mls: true, f1: true, ufc: true, worldcup: true, olympics: true, epl: true, laliga: true, champions: true },
  teams: {},
};

// Favicon SVG Component (matches public/favicon.svg but with currentColor fill for theme integration)
function FaviconIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M37.25,19.55H26.75a1,1,0,0,1-1-1V12.13a1,1,0,0,1,1-1h10.5a1,1,0,0,1,1,1v6.42A1,1,0,0,1,37.25,19.55Zm-9.5-2h8.5V13.13h-8.5Z"/>
      <path d="M43.68,52.87H20.32a1,1,0,0,1-1-1V15.55a1,1,0,0,1,1-1h6.43a1,1,0,0,1,1,1v2h8.5v-2a1,1,0,0,1,1-1h6.43a1,1,0,0,1,1,1V51.87A1,1,0,0,1,43.68,52.87Zm-22.36-2H42.68V16.55H38.25v2a1,1,0,0,1-1,1H26.75a1,1,0,0,1-1-1v-2H21.32Z"/>
      <path d="M25.91,46.76a3.31,3.31,0,1,1,3.3-3.3A3.3,3.3,0,0,1,25.91,46.76Zm0-4.61a1.31,1.31,0,1,0,1.3,1.31A1.31,1.31,0,0,0,25.91,42.15Z"/>
      <path d="M26.93,42.69a1,1,0,0,1-1-1c0-.38-.14-8.6,4.28-13.39l-1.88-.57a1,1,0,0,1,.57-1.91l3.57,1.07a1,1,0,0,1,.69.78,1,1,0,0,1-.37,1c-5,3.83-4.86,12.91-4.86,13a1,1,0,0,1-1,1Z"/>
      <path d="M32.31,32.94a1,1,0,0,1-1-1l-.13-4.07a1,1,0,0,1,1-1,1,1,0,0,1,1,1l.13,4.08a1,1,0,0,1-1,1Z"/>
      <path d="M38.34,44.55a1,1,0,0,1-.71-.29l-3.54-3.54a1,1,0,0,1,0-1.42,1,1,0,0,1,1.41,0l3.55,3.54a1,1,0,0,1,0,1.42A1,1,0,0,1,38.34,44.55Z"/>
      <path d="M34.8,44.55a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42l3.54-3.54a1,1,0,1,1,1.42,1.42L35.5,44.26A1,1,0,0,1,34.8,44.55Z"/>
      <path d="M39,26.71a1,1,0,0,1-.71-.29l-3.54-3.54a1,1,0,0,1,1.42-1.42L39.69,25a1,1,0,0,1,0,1.42A1,1,0,0,1,39,26.71Z"/>
      <path d="M35.44,26.71a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42l3.54-3.54a1,1,0,1,1,1.42,1.42l-3.54,3.54A1,1,0,0,1,35.44,26.71Z"/>
    </svg>
  );
}

export default function App() {
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Data State
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);



  // Favorites & Filter Toggles State
  const [favorites, setFavorites] = useState<FavoritesState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_FAVORITES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          leagues: parsed.leagues || [],
          conferences: parsed.conferences || [],
          teams: parsed.teams || [],
        };
      } catch {
        return INITIAL_FAVORITES;
      }
    }
    return INITIAL_FAVORITES;
  });
  const [toggles, setToggles] = useState<TogglesState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_TOGGLES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          leagues: { ...INITIAL_TOGGLES.leagues, ...parsed.leagues },
          conferences: parsed.conferences || {},
          teams: { ...INITIAL_TOGGLES.teams, ...parsed.teams },
        };
      } catch {
        return INITIAL_TOGGLES;
      }
    }
    return INITIAL_TOGGLES;
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_FAV_ONLY);
    return saved ? JSON.parse(saved) : false;
  });

  // League Accents Color State
  const [leagueColors, setLeagueColors] = useState<Record<League, string>>(() => {
    const defaultColors = {
      nfl: '#5282ba',
      nba: '#d6793e',
      mlb: '#3b9e7a',
      nhl: '#8c62c2',
      ncaaf: '#0e4800',
      ncaab: '#d53ae0',
      mls: '#46a84c',
      f1: '#d42b24',
      ufc: '#c23c3c',
      worldcup: '#1e6091',
      olympics: '#dca124',
      epl: '#d61a55',
      laliga: '#db3747',
      champions: '#1c52b3',
    };
    const saved = localStorage.getItem('sportscal_league_colors');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Auto-migrate if they were on the old cyber defaults (using old NFL #3b82f6)
        if (parsed.nfl === '#3b82f6') {
          return defaultColors;
        }
        const validParsed = Object.fromEntries(
          Object.entries(parsed).filter(([_, v]) => typeof v === 'string' && (v as string).trim().length > 0)
        );
        return { ...defaultColors, ...validParsed };
      } catch {
        return defaultColors;
      }
    }
    return defaultColors;
  });

  // Dynamic CSS variables injector
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(leagueColors).forEach(([league, color]) => {
      root.style.setProperty(`--color-${league}`, color);
      
      // Parse Hex to RGBA for Glow
      let r = 0, g = 0, b = 0;
      if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16);
          g = parseInt(hex[1] + hex[1], 16);
          b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
          r = parseInt(hex.slice(0, 2), 16);
          g = parseInt(hex.slice(2, 4), 16);
          b = parseInt(hex.slice(4, 6), 16);
        }
      }
      root.style.setProperty(`--glow-${league}`, `rgba(${r}, ${g}, ${b}, 0.2)`);
    });
    // Save to local storage
    localStorage.setItem('sportscal_league_colors', JSON.stringify(leagueColors));
  }, [leagueColors]);

  // Known UFC Fighters Cache State
  const [knownFighters, setKnownFighters] = useState<Record<string, { id: string; displayName: string; logo: string }>>(() => {
    const saved = localStorage.getItem('sportscal_known_fighters');
    return saved ? JSON.parse(saved) : {};
  });

  // Persistent Dynamic Teams Cache (stores newly discovered teams/players from API in localStorage)
  const [dynamicTeams, setDynamicTeams] = useState<Record<string, Record<string, Team>>>(() => {
    const saved = localStorage.getItem('sportscal_dynamic_teams');
    return saved ? JSON.parse(saved) : {};
  });

  // UI States
  const [expandedLeagues, setExpandedLeagues] = useState<Record<League, boolean>>({
    nfl: false,
    nba: false,
    mlb: false,
    nhl: false,
    ncaaf: false,
    ncaab: false,
    mls: false,
    f1: false,
    ufc: false,
    worldcup: false,
    olympics: false,
    epl: false,
    laliga: false,
    champions: false,
  });
  const [teamSearchQueries, setTeamSearchQueries] = useState<Record<League, string>>({
    nfl: '',
    nba: '',
    mlb: '',
    nhl: '',
    ncaaf: '',
    ncaab: '',
    mls: '',
    f1: '',
    ufc: '',
    worldcup: '',
    olympics: '',
    epl: '',
    laliga: '',
    champions: '',
  });
  const [expandedConferences, setExpandedConferences] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SIDEBAR_OPEN);
    return saved ? saved === 'true' : true;
  });
  
  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: Date; events: GameEvent[] } | null>(null);
  const [selectedLeagueDetails, setSelectedLeagueDetails] = useState<League | 'favorites' | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [minimizedModalConferences, setMinimizedModalConferences] = useState<Record<string, boolean>>({});
  const [showHiddenGames, setShowHiddenGames] = useState<boolean>(false);

  // Upcoming Spotlight Position state ('header' vs 'feed')
  const [spotlightPosition, setSpotlightPosition] = useState<'header' | 'feed'>(() => {
    const saved = localStorage.getItem('sportscal_spotlight_position');
    return (saved as 'header' | 'feed') || 'header';
  });

  const handleToggleSpotlightPosition = () => {
    setSpotlightPosition(prev => {
      const next = prev === 'header' ? 'feed' : 'header';
      localStorage.setItem('sportscal_spotlight_position', next);
      return next;
    });
  };

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_TOGGLES, JSON.stringify(toggles));
  }, [toggles]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_FAV_ONLY, JSON.stringify(showFavoritesOnly));
  }, [showFavoritesOnly]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SIDEBAR_OPEN, String(sidebarOpen));
  }, [sidebarOpen]);

  // Setup effects and fetch logic below

  // Compute Calendar Grid Dates (42 cells: 6 weeks * 7 days)
  const gridDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Start grid at the first visible Sunday (could be in previous month)
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDayOfWeek);
    
    const dates: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [currentDate]);

  // Fetch Scoreboards when currentDate or visible grid range changes
  useEffect(() => {
    let active = true;
    if (gridDates.length === 0) return;

    async function loadEventsData() {
      setLoading(true);
      
      // Buffer by 1 day on each side to prevent timezone leaks
      const fetchStart = new Date(gridDates[0]);
      fetchStart.setDate(fetchStart.getDate() - 1);
      
      const fetchEnd = new Date(gridDates[gridDates.length - 1]);
      fetchEnd.setDate(fetchEnd.getDate() + 1);

      const startDateStr = formatDateForApi(fetchStart);
      const endDateStr = formatDateForApi(fetchEnd);

      try {
        const [
          nflEvents,
          nbaEvents,
          mlbEvents,
          nhlEvents,
          ncaafEvents,
          ncaabEvents,
          mlsEvents,
          f1Events,
          ufcEvents,
          worldcupEvents,
          olympicsEvents,
          eplEvents,
          laligaEvents,
          championsEvents
        ] = await Promise.all([
          fetchScoreboard('nfl', startDateStr, endDateStr),
          fetchScoreboard('nba', startDateStr, endDateStr),
          fetchScoreboard('mlb', startDateStr, endDateStr),
          fetchScoreboard('nhl', startDateStr, endDateStr),
          fetchScoreboard('ncaaf', startDateStr, endDateStr),
          fetchScoreboard('ncaab', startDateStr, endDateStr),
          fetchScoreboard('mls', startDateStr, endDateStr),
          fetchScoreboard('f1', startDateStr, endDateStr),
          fetchScoreboard('ufc', startDateStr, endDateStr),
          fetchScoreboard('worldcup', startDateStr, endDateStr),
          fetchScoreboard('olympics', startDateStr, endDateStr),
          fetchScoreboard('epl', startDateStr, endDateStr),
          fetchScoreboard('laliga', startDateStr, endDateStr),
          fetchScoreboard('champions', startDateStr, endDateStr),
        ]);

        if (active) {
          setEvents([
            ...nflEvents,
            ...nbaEvents,
            ...mlbEvents,
            ...nhlEvents,
            ...ncaafEvents,
            ...ncaabEvents,
            ...mlsEvents,
            ...f1Events,
            ...ufcEvents,
            ...worldcupEvents,
            ...olympicsEvents,
            ...eplEvents,
            ...laligaEvents,
            ...championsEvents
          ]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load scoreboard events:', err);
        if (active) setLoading(false);
      }
    }

    loadEventsData();

    return () => {
      active = false;
    };
  }, [gridDates]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Toggle handlers for Favorites
  const toggleLeagueFavorite = (league: League, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const isFav = prev.leagues.includes(league);
      return {
        ...prev,
        leagues: isFav 
          ? prev.leagues.filter(l => l !== league) 
          : [...prev.leagues, league],
      };
    });
  };

  const toggleTeamFavorite = (teamId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const isFav = prev.teams.includes(teamId);
      return {
        ...prev,
        teams: isFav 
          ? prev.teams.filter(id => id !== teamId) 
          : [...prev.teams, teamId],
      };
    });
  };

  const toggleConferenceFavorite = (confId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const currentConfs = prev.conferences || [];
      const isFav = currentConfs.includes(confId);
      return {
        ...prev,
        conferences: isFav
          ? currentConfs.filter(id => id !== confId)
          : [...currentConfs, confId],
      };
    });
  };

  // Toggle handlers for Visibility Toggles
  const toggleLeagueVisibility = (league: League, e: React.MouseEvent) => {
    e.stopPropagation();
    setToggles(prev => ({
      ...prev,
      leagues: {
        ...prev.leagues,
        [league]: !prev.leagues[league],
      },
    }));
  };

  const toggleConferenceVisibility = (confId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setToggles(prev => {
      const currentConfs = prev.conferences || {};
      const currentVal = currentConfs[confId] !== false; // defaults to true
      return {
        ...prev,
        conferences: {
          ...currentConfs,
          [confId]: !currentVal,
        },
      };
    });
  };

  const toggleHideAllFavoriteConferences = () => {
    const favConfs = favorites.conferences || [];
    if (favConfs.length === 0) return;
    const allHidden = favConfs.every(id => toggles.conferences?.[id] === false);

    setToggles(prev => {
      const newConfs = { ...(prev.conferences || {}) };
      favConfs.forEach(id => {
        newConfs[id] = allHidden; // If all were hidden, set all to true; otherwise hide all
      });
      return {
        ...prev,
        conferences: newConfs
      };
    });
  };

  const toggleMinimizeModalConference = (confId: string) => {
    setMinimizedModalConferences(prev => ({
      ...prev,
      [confId]: !prev[confId]
    }));
  };

  const handleCollapseAllModalConferences = (confIds: string[]) => {
    setMinimizedModalConferences(prev => {
      const nextState = { ...prev };
      confIds.forEach(id => {
        nextState[id] = true;
      });
      return nextState;
    });
  };

  const handleExpandAllModalConferences = (confIds: string[]) => {
    setMinimizedModalConferences(prev => {
      const nextState = { ...prev };
      confIds.forEach(id => {
        nextState[id] = false;
      });
      return nextState;
    });
  };

  const toggleTeamVisibility = (teamId: string) => {
    setToggles(prev => {
      const currentVal = prev.teams[teamId] !== false; // defaults to true
      return {
        ...prev,
        teams: {
          ...prev.teams,
          [teamId]: !currentVal,
        },
      };
    });
  };

  // Helper to get team details by ID
  const getTeamById = React.useCallback((teamId: string) => {
    // 1. Check all leagues in TEAMS_DIRECTORY
    for (const league in TEAMS_DIRECTORY) {
      const match = TEAMS_DIRECTORY[league as League].find(t => t.id === teamId);
      if (match) return match;
    }
    // 2. Check ufc/fighters
    if (teamId.startsWith('ufc-')) {
      const fighterId = teamId.replace('ufc-', '');
      const fighter = knownFighters[fighterId];
      if (fighter) {
        return {
          id: teamId,
          displayName: fighter.displayName,
          shortDisplayName: fighter.displayName,
          abbreviation: fighter.displayName,
          color: '1e293b',
          logo: fighter.logo,
          league: 'ufc' as League
        };
      }
    }
    // 3. Fallback: check if we can extract from events
    for (const event of events) {
      if (event.homeTeam.id === teamId) {
        return {
          id: teamId,
          displayName: event.homeTeam.displayName,
          shortDisplayName: event.homeTeam.displayName,
          abbreviation: event.homeTeam.abbreviation,
          color: event.homeTeam.color || '1e293b',
          logo: event.homeTeam.logo,
          league: event.league
        };
      }
      if (event.awayTeam.id === teamId) {
        return {
          id: teamId,
          displayName: event.awayTeam.displayName,
          shortDisplayName: event.awayTeam.displayName,
          abbreviation: event.awayTeam.abbreviation,
          color: event.awayTeam.color || '1e293b',
          logo: event.awayTeam.logo,
          league: event.league
        };
      }
      // If it's a UFC event, check fighters
      if (event.league === 'ufc' && event.ufcFights) {
        for (const fight of event.ufcFights) {
          for (const comp of fight.competitors) {
            const ufcId = `ufc-${comp.id}`;
            if (ufcId === teamId) {
              return {
                id: teamId,
                displayName: comp.displayName,
                shortDisplayName: comp.displayName,
                abbreviation: comp.displayName,
                color: '1e293b',
                logo: comp.logo,
                league: 'ufc' as League
              };
            }
          }
        }
      }
    }
    return null;
  }, [knownFighters, events]);

  // Filter events based on active filters & toggles
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // 1. League visibility toggle check
      if (!toggles.leagues[event.league]) return false;

      // 2. Conference visibility toggle check (for college sports)
      if (event.league === 'ncaaf' || event.league === 'ncaab') {
        const homeTeamObj = getTeamById(event.homeTeam.id);
        const awayTeamObj = getTeamById(event.awayTeam.id);

        if (homeTeamObj?.conference) {
          const confId = `${event.league}-${homeTeamObj.conference}`;
          if (toggles.conferences?.[confId] === false && toggles.teams[event.homeTeam.id] !== true) {
            return false;
          }
        }
        if (awayTeamObj?.conference) {
          const confId = `${event.league}-${awayTeamObj.conference}`;
          if (toggles.conferences?.[confId] === false && toggles.teams[event.awayTeam.id] !== true) {
            return false;
          }
        }
      }

      // 3. Individual team toggles (check if either team is toggled OFF)
      if (toggles.teams[event.homeTeam.id] === false) return false;
      if (toggles.teams[event.awayTeam.id] === false) return false;

      // 4. Favorites only filter
      if (showFavoritesOnly) {
        const isLeagueFav = favorites.leagues.includes(event.league);
        const isHomeFav = favorites.teams.includes(event.homeTeam.id);
        const isAwayFav = favorites.teams.includes(event.awayTeam.id);

        // Conference favorites check
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
        
        if (!isLeagueFav && !isHomeFav && !isAwayFav && !isConfFav && !isUfcCardFav) return false;
      }

      return true;
    });
  }, [events, toggles, favorites, showFavoritesOnly, getTeamById]);

  // Group filtered events by local calendar cell date
  const eventsByDate = useMemo(() => {
    const map: Record<string, GameEvent[]> = {};
    
    filteredEvents.forEach(event => {
      const localDate = new Date(event.date);
      const dateKey = `${localDate.getFullYear()}-${localDate.getMonth()}-${localDate.getDate()}`;
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(event);
    });

    // Sort events by date-time
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return map;
  }, [filteredEvents]);

  // Group all events (including hidden ones) by local calendar cell date
  const allEventsByDate = useMemo(() => {
    const map: Record<string, GameEvent[]> = {};
    
    events.forEach(event => {
      const localDate = new Date(event.date);
      const dateKey = `${localDate.getFullYear()}-${localDate.getMonth()}-${localDate.getDate()}`;
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(event);
    });

    // Sort events by date-time
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return map;
  }, [events]);

  // Helper to check if a Date matches Today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Helper to format date string
  const formatMonthName = (date: Date): string => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Helper to look up conference for dynamic/unrecognized teams directly from processed JSON directory
  const getConferenceForTeam = React.useCallback((name: string, abbrev: string, league: League): string => {
    if (league !== 'ncaaf' && league !== 'ncaab') return '';

    const list = TEAMS_DIRECTORY[league] || [];
    const cleanName = (name || '').toLowerCase().trim();
    const cleanAbbrev = (abbrev || '').toLowerCase().trim();

    // 1. Match by exact displayName or shortDisplayName
    const exactMatch = list.find(t => 
      t.displayName.toLowerCase() === cleanName ||
      t.shortDisplayName.toLowerCase() === cleanName
    );
    if (exactMatch && exactMatch.conference) return exactMatch.conference;

    // 2. Abbreviation + name inclusion match
    const abbrevMatch = list.find(t => 
      t.abbreviation && t.abbreviation.toLowerCase() === cleanAbbrev &&
      (t.displayName.toLowerCase().includes(cleanName) || cleanName.includes(t.shortDisplayName.toLowerCase()))
    );
    if (abbrevMatch && abbrevMatch.conference) return abbrevMatch.conference;

    // 3. Fallback partial match if name contains full display name or short display name
    const partialMatch = list.find(t => 
      cleanName.includes(t.shortDisplayName.toLowerCase()) ||
      t.displayName.toLowerCase().includes(cleanName)
    );
    if (partialMatch && partialMatch.conference) return partialMatch.conference;

    // Default unrecognized dynamic teams
    return league === 'ncaaf' ? 'FCS' : 'Independent';
  }, []);

  // Persistent auto-registration effect for teams & fighters from live events
  useEffect(() => {
    let updatedTeams = false;
    let updatedFighters = false;
    const newDynamicTeams = { ...dynamicTeams };
    const newFighters = { ...knownFighters };
    const teamsToRegister: Team[] = [];

    events.forEach(event => {
      const lg = event.league;
      if (!newDynamicTeams[lg]) {
        newDynamicTeams[lg] = {};
      }

      // Handle UFC fighters
      if (lg === 'ufc' && event.ufcFights) {
        event.ufcFights.forEach(fight => {
          fight.competitors.forEach(c => {
            const fullId = `ufc-${c.id}`;
            if (!newFighters[fullId]) {
              newFighters[fullId] = {
                id: fullId,
                displayName: c.displayName,
                logo: c.logo
              };
              updatedFighters = true;
            }
          });
        });
      }

      // Handle Home Team
      if (event.homeTeam && event.homeTeam.id && !event.homeTeam.id.startsWith('f1-')) {
        const teamId = event.homeTeam.id;
        const isStatic = (TEAMS_DIRECTORY[lg] || []).some(t => t.id === teamId);
        const teamConf = event.homeTeam.conference || getConferenceForTeam(event.homeTeam.displayName, event.homeTeam.abbreviation, lg);
        const tObj: Team = {
          id: teamId,
          displayName: event.homeTeam.displayName,
          shortDisplayName: event.homeTeam.displayName,
          abbreviation: event.homeTeam.abbreviation,
          color: event.homeTeam.color || '1e293b',
          logo: event.homeTeam.logo,
          league: lg,
          conference: teamConf
        };
        teamsToRegister.push(tObj);
        if (!isStatic && !newDynamicTeams[lg][teamId]) {
          newDynamicTeams[lg][teamId] = tObj;
          updatedTeams = true;
        }
      }

      // Handle Away Team
      if (event.awayTeam && event.awayTeam.id && !event.awayTeam.id.startsWith('f1-')) {
        const teamId = event.awayTeam.id;
        const isStatic = (TEAMS_DIRECTORY[lg] || []).some(t => t.id === teamId);
        const teamConf = event.awayTeam.conference || getConferenceForTeam(event.awayTeam.displayName, event.awayTeam.abbreviation, lg);
        const tObj: Team = {
          id: teamId,
          displayName: event.awayTeam.displayName,
          shortDisplayName: event.awayTeam.displayName,
          abbreviation: event.awayTeam.abbreviation,
          color: event.awayTeam.color || '1e293b',
          logo: event.awayTeam.logo,
          league: lg,
          conference: teamConf
        };
        teamsToRegister.push(tObj);
        if (!isStatic && !newDynamicTeams[lg][teamId]) {
          newDynamicTeams[lg][teamId] = tObj;
          updatedTeams = true;
        }
      }
    });

    if (teamsToRegister.length > 0) {
      registerTeams(teamsToRegister);
    }
    if (updatedTeams) {
      setDynamicTeams(newDynamicTeams);
      localStorage.setItem('sportscal_dynamic_teams', JSON.stringify(newDynamicTeams));
    }
    if (updatedFighters) {
      setKnownFighters(newFighters);
      localStorage.setItem('sportscal_known_fighters', JSON.stringify(newFighters));
    }
  }, [events, dynamicTeams, knownFighters, getConferenceForTeam]);

  // Helper to get all combined teams for a league (combining static directory + persistent dynamic teamCache + live events)
  const getCombinedLeagueTeams = React.useCallback((league: League): Team[] => {
    if (league === 'ufc') {
      return Object.values(knownFighters).map(f => ({
        id: f.id,
        displayName: f.displayName,
        shortDisplayName: f.displayName,
        abbreviation: f.displayName,
        color: '1e293b',
        logo: f.logo,
        league: 'ufc' as League
      }));
    }

    const cachedTeams = getAllTeamsForLeague(league);
    const teamMap = new Map<string, Team>();

    cachedTeams.forEach(t => {
      const computedConf = getConferenceForTeam(t.displayName, t.abbreviation, league);
      teamMap.set(t.id, {
        ...t,
        conference: computedConf || t.conference
      });
    });

    // Add live teams from current events if not yet registered
    events.forEach(event => {
      if (event.league === league) {
        if (event.homeTeam && event.homeTeam.id && !event.homeTeam.id.startsWith('f1-')) {
          const teamConf = getConferenceForTeam(event.homeTeam.displayName, event.homeTeam.abbreviation, league) || event.homeTeam.conference;
          if (!teamMap.has(event.homeTeam.id)) {
            teamMap.set(event.homeTeam.id, {
              id: event.homeTeam.id,
              displayName: event.homeTeam.displayName,
              shortDisplayName: event.homeTeam.displayName,
              abbreviation: event.homeTeam.abbreviation,
              color: event.homeTeam.color || '1e293b',
              logo: event.homeTeam.logo,
              league: league,
              conference: teamConf
            });
          }
        }
        if (event.awayTeam && event.awayTeam.id && !event.awayTeam.id.startsWith('f1-')) {
          const teamConf = getConferenceForTeam(event.awayTeam.displayName, event.awayTeam.abbreviation, league) || event.awayTeam.conference;
          if (!teamMap.has(event.awayTeam.id)) {
            teamMap.set(event.awayTeam.id, {
              id: event.awayTeam.id,
              displayName: event.awayTeam.displayName,
              shortDisplayName: event.awayTeam.displayName,
              abbreviation: event.awayTeam.abbreviation,
              color: event.awayTeam.color || '1e293b',
              logo: event.awayTeam.logo,
              league: league,
              conference: teamConf
            });
          }
        }
      }
    });

    return Array.from(teamMap.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [events, knownFighters, getConferenceForTeam]);

  // Get active teams for list rendering (filtered by search query)
  const getFilteredTeams = (league: League) => {
    const rawQuery = teamSearchQueries[league];
    const cleanQuery = rawQuery
      .toLowerCase()
      .trim()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
    
    const teamList = getCombinedLeagueTeams(league);
    if (!cleanQuery) return teamList;

    const queryTokens = cleanQuery.split(/\s+/);

    return teamList.filter(team => {
      const matchName = team.displayName.toLowerCase();
      const matchAbbrev = team.abbreviation.toLowerCase();

      return queryTokens.every(token => {
        const alias = ALIAS_MAP[token];
        return (
          matchName.includes(token) ||
          matchAbbrev.includes(token) ||
          (alias && matchName.includes(alias))
        );
      });
    });
  };

  const hasTogglesOff = useMemo(() => {
    // If any team, conference, or league has a toggle off, we show a badge
    const anyLeagueOff = Object.values(toggles.leagues).some(val => !val);
    const anyConfOff = toggles.conferences ? Object.values(toggles.conferences).some(val => !val) : false;
    const anyTeamOff = Object.values(toggles.teams).some(val => !val);
    return anyLeagueOff || anyConfOff || anyTeamOff;
  }, [toggles]);

  // Helper to group teams of a college league by conference
  const getLeagueConferences = (league: League) => {
    const teamList = getCombinedLeagueTeams(league);
    const confMap: Record<string, Team[]> = {};
    
    teamList.forEach(team => {
      const conf = team.conference || 'Other';
      if (!confMap[conf]) confMap[conf] = [];
      confMap[conf].push(team);
    });
    
    const searchQ = (teamSearchQueries[league] || '').trim().toLowerCase();
    
    return Object.entries(confMap)
      .map(([confName, confTeams]) => {
        let filteredTeams = confTeams;
        if (searchQ) {
          const queryTokens = searchQ.split(/\s+/);
          filteredTeams = confTeams.filter(team => {
            const matchName = team.displayName.toLowerCase();
            const matchAbbrev = team.abbreviation.toLowerCase();
            const matchConf = confName.toLowerCase();
            return queryTokens.every(token => {
              const alias = ALIAS_MAP[token];
              return (
                matchName.includes(token) ||
                matchAbbrev.includes(token) ||
                matchConf.includes(token) ||
                (alias && matchName.includes(alias))
              );
            });
          });
        }
        return {
          name: confName,
          id: `${league}-${confName}`,
          teams: filteredTeams,
          totalTeamCount: confTeams.length
        };
      })
      .filter(conf => {
        if (!searchQ) return true;
        const matchConfName = conf.name.toLowerCase().includes(searchQ);
        return matchConfName || conf.teams.length > 0;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Helper to get modal conferences with search query
  const getModalConferences = (league: League, searchQ: string) => {
    const teamList = getCombinedLeagueTeams(league);
    const confMap: Record<string, Team[]> = {};

    teamList.forEach(team => {
      const conf = team.conference || 'Other';
      if (!confMap[conf]) confMap[conf] = [];
      confMap[conf].push(team);
    });

    const cleanQ = searchQ.trim().toLowerCase();

    return Object.entries(confMap)
      .map(([confName, confTeams]) => {
        let filteredTeams = confTeams;
        if (cleanQ) {
          const queryTokens = cleanQ.split(/\s+/);
          filteredTeams = confTeams.filter(team => {
            const matchName = team.displayName.toLowerCase();
            const matchAbbrev = team.abbreviation.toLowerCase();
            const matchConf = confName.toLowerCase();
            return queryTokens.every(token => {
              const alias = ALIAS_MAP[token];
              return (
                matchName.includes(token) ||
                matchAbbrev.includes(token) ||
                matchConf.includes(token) ||
                (alias && matchName.includes(alias))
              );
            });
          });
        }
        return {
          name: confName,
          id: `${league}-${confName}`,
          teams: filteredTeams,
        };
      })
      .filter(conf => {
        if (!cleanQ) return true;
        const matchConfName = conf.name.toLowerCase().includes(cleanQ);
        return matchConfName || conf.teams.length > 0;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Helper to get modal teams for standard leagues
  const getModalTeams = (league: League, searchQ: string) => {
    const teamList = getCombinedLeagueTeams(league);
    const cleanQ = searchQ.trim().toLowerCase();
    if (!cleanQ) return teamList;

    const queryTokens = cleanQ.split(/\s+/);
    return teamList.filter(team => {
      const matchName = team.displayName.toLowerCase();
      const matchAbbrev = team.abbreviation.toLowerCase();
      return queryTokens.every(token => {
        const alias = ALIAS_MAP[token];
        return (
          matchName.includes(token) ||
          matchAbbrev.includes(token) ||
          (alias && matchName.includes(alias))
        );
      });
    });
  };



  // Helper to check if an event is currently visible based on active toggles/filters
  const isEventVisible = (event: GameEvent): boolean => {
    // 1. League visibility toggle check
    if (!toggles.leagues[event.league]) return false;

    // 2. Conference visibility toggle check (for college sports)
    if (event.league === 'ncaaf' || event.league === 'ncaab') {
      const homeTeamObj = getTeamById(event.homeTeam.id);
      const awayTeamObj = getTeamById(event.awayTeam.id);
      
      if (homeTeamObj?.conference) {
        const confId = `${event.league}-${homeTeamObj.conference}`;
        if (toggles.conferences?.[confId] === false && toggles.teams[event.homeTeam.id] !== true) {
          return false;
        }
      }
      if (awayTeamObj?.conference) {
        const confId = `${event.league}-${awayTeamObj.conference}`;
        if (toggles.conferences?.[confId] === false && toggles.teams[event.awayTeam.id] !== true) {
          return false;
        }
      }
    }

    // 3. Individual team toggles (check if either team is toggled OFF)
    if (toggles.teams[event.homeTeam.id] === false) return false;
    if (toggles.teams[event.awayTeam.id] === false) return false;

    // 4. Favorites only filter
    if (showFavoritesOnly) {
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
      
      if (!isLeagueFav && !isHomeFav && !isAwayFav && !isConfFav && !isUfcCardFav) return false;
    }

    return true;
  };

  const handleCloseDayModal = () => {
    setSelectedDayEvents(null);
    setShowHiddenGames(false);
  };

  // Helper to render a match card in the day schedule modal
  const renderDetailedMatchCard = (event: GameEvent, isHidden: boolean) => {
    const isLive = event.status.state === 'in';
    
    return (
      <div 
        key={event.id} 
        className={`detailed-match-card ${isHidden ? 'hidden-card' : ''}`}
        style={{ padding: '16px', cursor: 'pointer', opacity: isHidden ? 0.65 : 1 }}
        onClick={() => {
          setSelectedEvent(event);
          handleCloseDayModal();
        }}
      >
        <div className="match-card-header" style={{ marginBottom: '-6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`league-badge ${event.league}`}>{event.league}</span>
            {isHidden && (
              <span className="hidden-badge" style={{ 
                fontSize: '9px', 
                fontWeight: 700, 
                padding: '1px 4px', 
                borderRadius: '4px', 
                background: 'rgba(239, 68, 68, 0.15)', 
                color: 'var(--danger)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                HIDDEN
              </span>
            )}
          </div>
          <div className={`match-status-text ${isLive ? 'live' : ''}`} style={{ fontSize: '11px' }}>
            {isLive && <span className="live-pulse-dot" />}
            {event.status.detail || (event.status.state === 'pre' ? 'Upcoming' : 'Final')}
          </div>
        </div>

        <div className="competitors-row" style={{ padding: '4px 0', gap: '8px' }}>
          {event.league === 'f1' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={event.homeTeam.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{event.name}</span>
              </div>
              {event.status.state === 'post' ? (
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                  Winner: {event.homeTeam.score}
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          ) : event.league === 'ufc' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={event.homeTeam.logo} alt="" style={{ width: '24px', height: '16px', objectFit: 'cover', borderRadius: '2px' }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{event.name}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {event.status.state === 'post' ? 'Final' : new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ) : (
            <div className="competitors-row" style={{ padding: '4px 0', gap: '8px', width: '100%' }}>
              {/* Away */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <img src={event.awayTeam.logo} alt={event.awayTeam.displayName} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span className="desktop-only">{event.awayTeam.displayName}</span>
                  <span className="mobile-only">{event.awayTeam.abbreviation}</span>
                </span>
              </div>
              
              {/* Score or VS */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, fontFamily: 'monospace' }}>
                {event.status.state !== 'pre' ? (
                  <>
                    <span style={{ color: event.awayTeam.winner ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {event.awayTeam.score}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                    <span style={{ color: event.homeTeam.winner ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {event.homeTeam.score}
                    </span>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Home */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, justifyContent: 'flex-end', textAlign: 'right' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span className="desktop-only">{event.homeTeam.displayName}</span>
                  <span className="mobile-only">{event.homeTeam.abbreviation}</span>
                </span>
                <img src={event.homeTeam.logo} alt={event.homeTeam.displayName} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Clear all filters
  const handleClearFilters = () => {
    setToggles(INITIAL_TOGGLES);
    setShowFavoritesOnly(false);
  };

  // Reset league colors to the new defaults
  const handleResetColors = () => {
    const defaultColors = {
      nfl: '#5282ba',
      nba: '#d6793e',
      mlb: '#3b9e7a',
      nhl: '#8c62c2',
      ncaaf: '#0e4800',
      ncaab: '#d53ae0',
      mls: '#46a84c',
      f1: '#d42b24',
      ufc: '#c23c3c',
      worldcup: '#1e6091',
      olympics: '#dca124',
      epl: '#d61a55',
      laliga: '#db3747',
      champions: '#1c52b3',
    };
    setLeagueColors(defaultColors);
  };

  return (
    <div className="app-container">
      {/* Sidebar Backdrop for Mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop mobile-only" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Filters */}
      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        {/* Mobile Sidebar Header */}
        <div className="mobile-only sidebar-mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
          <div className="logo-container" style={{ justifyContent: 'flex-start' }}>
            <FaviconIcon className="logo-icon" size={28} />
            <span className="logo-text" style={{ fontSize: '18px' }}>Filters</span>
          </div>
          <button className="action-btn" onClick={() => setSidebarOpen(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div className="filter-section">
          <h3 className="section-title">Calendar Mode</h3>
          
          <button 
            className={`global-toggle ${showFavoritesOnly ? 'active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <div className="global-toggle-label">
              <Star 
                size={16} 
                className={showFavoritesOnly ? 'favorite-active' : ''} 
                fill={showFavoritesOnly ? 'var(--star-color)' : 'none'} 
              />
              <span>Favorites Only</span>
            </div>
            <div className="toggle-switch">
              <input 
                type="checkbox" 
                checked={showFavoritesOnly} 
                onChange={() => {}} // handled by parent click
              />
              <span className="slider"></span>
            </div>
          </button>
        </div>

        <div className="filter-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="section-title">My Favorites</h3>
            <button 
              className="action-btn"
              onClick={() => setSelectedLeagueDetails('favorites')}
              title="Open full Favorites popup directory"
            >
              <Maximize2 size={14} />
            </button>
          </div>
          <div className="favorites-list">
            {favorites.leagues.length === 0 && favorites.teams.length === 0 && (!favorites.conferences || favorites.conferences.length === 0) ? (
              <div className="favorites-empty-state">
                <Star size={16} className="empty-star-icon" />
                <span>No favorites yet. Star leagues or teams below to pin them here.</span>
              </div>
            ) : (
              <>
                {/* Favorited Leagues */}
                {favorites.leagues.map(league => {
                  const isVisible = toggles.leagues[league];
                  return (
                    <div key={`fav-league-${league}`} className={`fav-item league-fav-item ${!isVisible ? 'dimmed' : ''}`}>
                      <div className="fav-item-info">
                        <span className={`league-indicator ${league}`} />
                        <span className="fav-item-name">{LEAGUE_DISPLAY_NAMES[league] || league.toUpperCase()}</span>
                      </div>
                      <div className="fav-item-actions">
                        <button 
                          className="action-btn"
                          onClick={(e) => toggleLeagueVisibility(league, e)}
                          title={isVisible ? "Hide league" : "Show league"}
                        >
                          {isVisible ? <Eye size={14} /> : <EyeOff size={14} style={{ color: 'var(--danger)' }} />}
                        </button>
                        <button 
                          className="action-btn favorite-active"
                          onClick={(e) => toggleLeagueFavorite(league, e)}
                          title="Remove from favorites"
                        >
                          <Star size={14} fill="var(--star-color)" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Favorited Conferences */}
                {(favorites.conferences || []).map(confId => {
                  const parts = confId.split('-');
                  const confLeague = parts[0] as League;
                  const confName = parts.slice(1).join('-');
                  const isVisible = toggles.conferences?.[confId] !== false;
                  return (
                    <div key={`fav-conf-${confId}`} className={`fav-item conference-fav-item ${!isVisible ? 'dimmed' : ''}`}>
                      <div className="fav-item-info">
                        <span className={`league-indicator ${confLeague}`} />
                        <span className="fav-item-name">{confName}</span>
                        <span className={`league-tag-badge ${confLeague}`}>{confLeague.toUpperCase()}</span>
                      </div>
                      <div className="fav-item-actions">
                        <button 
                          className="action-btn"
                          onClick={(e) => toggleConferenceVisibility(confId, e)}
                          title={isVisible ? "Hide conference" : "Show conference"}
                        >
                          {isVisible ? <Eye size={14} /> : <EyeOff size={14} style={{ color: 'var(--danger)' }} />}
                        </button>
                        <button 
                          className="action-btn favorite-active"
                          onClick={(e) => toggleConferenceFavorite(confId, e)}
                          title="Remove from favorites"
                        >
                          <Star size={14} fill="var(--star-color)" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Favorited Teams */}
                {favorites.teams.map(teamId => {
                  const team = getTeamById(teamId);
                  if (!team) return null;
                  const isVisible = toggles.teams[teamId] !== false;
                  return (
                    <div key={`fav-team-${teamId}`} className={`fav-item team-fav-item ${!isVisible ? 'dimmed' : ''}`}>
                      <div className="fav-item-info">
                        <img src={team.logo} alt={team.displayName} className="team-logo-small" />
                        <span className="fav-item-name">{team.shortDisplayName}</span>
                        <span className={`league-tag-badge ${team.league}`}>{team.league.toUpperCase()}</span>
                      </div>
                      <div className="fav-item-actions">
                        <button 
                          className="action-btn"
                          onClick={() => toggleTeamVisibility(teamId)}
                          title={isVisible ? "Hide team" : "Show team"}
                        >
                          {isVisible ? <Eye size={14} /> : <EyeOff size={14} style={{ color: 'var(--danger)' }} />}
                        </button>
                        <button 
                          className="action-btn favorite-active"
                          onClick={(e) => toggleTeamFavorite(teamId, e)}
                          title="Remove from favorites"
                        >
                          <Star size={14} fill="var(--star-color)" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="filter-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="section-title">Leagues & Teams</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {hasTogglesOff && (
                <button 
                  onClick={handleClearFilters}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Reset Toggles
                </button>
              )}
              <button 
                onClick={handleResetColors}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reset Colors
              </button>
            </div>
          </div>
          
          <div className="league-filter-list">
            {(['nfl', 'nba', 'mlb', 'nhl', 'ncaaf', 'ncaab', 'mls', 'f1', 'ufc', 'worldcup', 'olympics', 'epl', 'laliga', 'champions'] as League[]).map(league => {
              const isFav = favorites.leagues.includes(league);
              const isVisible = toggles.leagues[league];
              const isExpanded = expandedLeagues[league];
              const leagueTeams = getFilteredTeams(league);

              return (
                <div key={league} className={`league-filter-item ${isExpanded ? 'expanded' : ''}`}>
                  {/* League Header */}
                  <div 
                    className="league-filter-header"
                    onClick={() => setExpandedLeagues(prev => ({ ...prev, [league]: !prev[league] }))}
                  >
                    <div className="league-info">
                      <span className={`league-indicator ${league}`} />
                      <span>{LEAGUE_DISPLAY_NAMES[league] || league}</span>
                    </div>
                    
                    <div className="league-actions" onClick={e => e.stopPropagation()}>
                      <input 
                        type="color" 
                        value={leagueColors[league]}
                        onChange={e => setLeagueColors(prev => ({ ...prev, [league]: e.target.value }))}
                        className="league-color-picker"
                        title={`Customize ${LEAGUE_DISPLAY_NAMES[league] || league} color`}
                      />
                      <button 
                        className={`action-btn ${isFav ? 'favorite-active' : ''}`}
                        onClick={e => toggleLeagueFavorite(league, e)}
                        title={isFav ? "Remove from favorites" : "Favorite league"}
                      >
                        <Star size={15} fill={isFav ? 'var(--star-color)' : 'none'} />
                      </button>
                      <button 
                        className="action-btn"
                        onClick={e => toggleLeagueVisibility(league, e)}
                        title={isVisible ? "Hide league" : "Show league"}
                      >
                        {isVisible ? <Eye size={15} /> : <EyeOff size={15} style={{ color: 'var(--danger)' }} />}
                      </button>
                      <button 
                        className="action-btn"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedLeagueDetails(league);
                        }}
                        title={`Open full ${LEAGUE_DISPLAY_NAMES[league] || league} popup directory`}
                      >
                        <Maximize2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* League Teams / Conferences Collapsible Content */}
                  <div className="league-teams-wrapper">
                    <div className="teams-list-container">
                      <div className="team-search-input-wrapper">
                        <input 
                          type="text" 
                          placeholder={league === 'ncaaf' || league === 'ncaab' ? "Search conferences or teams..." : "Search teams..."} 
                          className="team-search-input"
                          value={teamSearchQueries[league]}
                          onChange={e => setTeamSearchQueries(prev => ({ ...prev, [league]: e.target.value }))}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      
                      {league === 'ncaaf' || league === 'ncaab' ? (
                        // College Sports: Render Conferences Hierarchy
                        getLeagueConferences(league).length === 0 ? (
                          <div style={{ padding: '8px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                            No conferences found
                          </div>
                        ) : (
                          getLeagueConferences(league).map(conf => {
                            const isConfFav = (favorites.conferences || []).includes(conf.id);
                            const isConfVisible = toggles.conferences?.[conf.id] !== false;
                            const searchQ = (teamSearchQueries[league] || '').trim();
                            const isConfExpanded = searchQ.length > 0 || expandedConferences[conf.id];

                            return (
                              <div key={conf.id} className={`conference-item ${isConfExpanded ? 'expanded' : ''}`}>
                                {/* Conference Header */}
                                <div 
                                  className="conference-header"
                                  onClick={() => setExpandedConferences(prev => ({ ...prev, [conf.id]: !prev[conf.id] }))}
                                >
                                  <div className="conference-title-group">
                                    <ChevronRight 
                                      size={14} 
                                      style={{ 
                                        transform: isConfExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s ease',
                                        color: 'var(--text-muted)'
                                      }} 
                                    />
                                    <span>{conf.name}</span>
                                    <span className="conference-count-badge">{conf.totalTeamCount} teams</span>
                                  </div>
                                  
                                  <div className="league-actions" onClick={e => e.stopPropagation()}>
                                    <button 
                                      className={`action-btn ${isConfFav ? 'favorite-active' : ''}`}
                                      onClick={e => toggleConferenceFavorite(conf.id, e)}
                                      title={isConfFav ? "Remove conference from favorites" : "Favorite conference"}
                                    >
                                      <Star size={13} fill={isConfFav ? 'var(--star-color)' : 'none'} />
                                    </button>
                                    <button 
                                      className="action-btn"
                                      onClick={e => toggleConferenceVisibility(conf.id, e)}
                                      title={isConfVisible ? "Hide conference" : "Show conference"}
                                    >
                                      {isConfVisible ? <Eye size={13} /> : <EyeOff size={13} style={{ color: 'var(--danger)' }} />}
                                    </button>
                                  </div>
                                </div>

                                {/* Conference Teams */}
                                <div className="conference-teams-wrapper">
                                  {conf.teams.map(team => {
                                    const isTeamFav = favorites.teams.includes(team.id);
                                    const isTeamVisible = toggles.teams[team.id] !== false;

                                    return (
                                      <div key={team.id} className="team-filter-row">
                                        <label className="team-label">
                                          <input 
                                            type="checkbox" 
                                            className="team-row-checkbox"
                                            checked={isTeamVisible}
                                            onChange={() => toggleTeamVisibility(team.id)}
                                          />
                                          <img src={team.logo} alt={team.displayName} className="team-logo-small" />
                                          <span 
                                            className="team-name-text" 
                                            style={{ 
                                              textDecoration: isTeamVisible ? 'none' : 'line-through',
                                              opacity: isTeamVisible ? 1 : 0.5,
                                              borderLeft: `2px solid #${getReadableTeamColor(team.color, team.alternateColor)}`,
                                              paddingLeft: '4px'
                                            }}
                                          >
                                            {team.shortDisplayName}
                                          </span>
                                        </label>

                                        <button 
                                          className={`action-btn ${isTeamFav ? 'favorite-active' : ''}`}
                                          onClick={e => toggleTeamFavorite(team.id, e)}
                                          title={isTeamFav ? "Remove from favorites" : "Favorite team"}
                                        >
                                          <Star size={13} fill={isTeamFav ? 'var(--star-color)' : 'none'} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })
                        )
                      ) : (
                        // Standard Leagues: Render Teams Directly
                        leagueTeams.length === 0 ? (
                          <div style={{ padding: '8px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                            No teams found
                          </div>
                        ) : (
                          leagueTeams.map(team => {
                            const isTeamFav = favorites.teams.includes(team.id);
                            const isTeamVisible = toggles.teams[team.id] !== false;

                            return (
                              <div key={team.id} className="team-filter-row">
                                <label className="team-label">
                                  <input 
                                    type="checkbox" 
                                    className="team-row-checkbox"
                                    checked={isTeamVisible}
                                    onChange={() => toggleTeamVisibility(team.id)}
                                  />
                                  <img src={team.logo} alt={team.displayName} className="team-logo-small" />
                                  <span 
                                    className="team-name-text" 
                                    style={{ 
                                      textDecoration: isTeamVisible ? 'none' : 'line-through',
                                      opacity: isTeamVisible ? 1 : 0.5,
                                      borderLeft: `2px solid #${getReadableTeamColor(team.color, team.alternateColor)}`,
                                      paddingLeft: '4px'
                                    }}
                                  >
                                    {team.shortDisplayName}
                                  </span>
                                </label>

                                <button 
                                  className={`action-btn ${isTeamFav ? 'favorite-active' : ''}`}
                                  onClick={e => toggleTeamFavorite(team.id, e)}
                                  title={isTeamFav ? "Remove from favorites" : "Favorite team"}
                                >
                                  <Star size={13} fill={isTeamFav ? 'var(--star-color)' : 'none'} />
                                </button>
                              </div>
                            );
                          })
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Dashboard Panel */}
      <main className="main-content">
        {/* Navigation & Header */}
        <header className="header">
          <div className="header-left">
            <button 
              className={`btn ${sidebarOpen ? 'btn-primary' : ''}`}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Hide Filters" : "Show Filters"}
            >
              <SlidersHorizontal size={16} />
              <span>{sidebarOpen ? 'Hide Filters' : 'Filters'}</span>
            </button>
            <div className="logo-container">
              <FaviconIcon className="logo-icon" size={36} />
              <h1 className="logo-text">SportsCal</h1>
            </div>
          </div>

          <div className="calendar-nav">
            <button className="nav-btn" onClick={handlePrevMonth} title="Previous Month">
              <ChevronLeft size={20} />
            </button>
            <h2 className="current-month-year">{formatMonthName(currentDate)}</h2>
            <button className="nav-btn" onClick={handleNextMonth} title="Next Month">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="header-actions">
            <button className="btn" onClick={handleToday}>
              Today
            </button>
          </div>
        </header>

        {/* Live / Today's Games Stock Ticker */}
        <TickerBar
          events={events}
          toggles={toggles}
          favorites={favorites}
          getTeamById={getTeamById}
          onSelectEvent={setSelectedEvent}
        />

        {/* Position A: Spotlight block at Top of Page */}
        {spotlightPosition === 'header' && (
          <UpcomingSpotlight
            events={events}
            toggles={toggles}
            favorites={favorites}
            getTeamById={getTeamById}
            onSelectEvent={setSelectedEvent}
            position="header"
            onTogglePosition={handleToggleSpotlightPosition}
          />
        )}

        {/* Position B: Spotlight block above Feed */}
        {spotlightPosition === 'feed' && (
          <UpcomingSpotlight
            events={events}
            toggles={toggles}
            favorites={favorites}
            getTeamById={getTeamById}
            onSelectEvent={setSelectedEvent}
            position="feed"
            onTogglePosition={handleToggleSpotlightPosition}
          />
        )}

        {/* Calendar View Area */}
        <section className="calendar-view">
          <div className="weekdays-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">{day[0]}</div>
            ))}
          </div>

          {loading ? (
            <div className="days-grid" style={{ gridAutoRows: 'unset', gridTemplateRows: 'repeat(6, 1fr)' }}>
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="skeleton-grid-cell" />
              ))}
            </div>
          ) : (
            <div className="days-grid">
              {gridDates.map((date, idx) => {
                const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                const dayFilteredEvents = eventsByDate[dateKey] || [];
                const dayAllEvents = allEventsByDate[dateKey] || [];
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                
                // Show max 3 events inside the box
                const visibleEvents = dayFilteredEvents.slice(0, 3);
                const extraCount = dayFilteredEvents.length - 3;
                const hasGames = dayAllEvents.length > 0;
                const dayLeagues = Array.from(new Set(dayFilteredEvents.map(e => e.league)));

                return (
                  <div 
                    key={idx} 
                    className={`day-cell ${!isCurrentMonth ? 'inactive' : ''} ${isToday(date) ? 'today' : ''} ${!hasGames ? 'empty' : ''}`}
                    onClick={() => {
                      if (hasGames) {
                        setSelectedDayEvents({ date, events: dayAllEvents });
                      }
                    }}
                  >
                    <div className="day-header-row">
                      <span className="day-number">{date.getDate()}</span>
                      {dayFilteredEvents.length > 0 && (
                        <span className="day-events-count">
                          {dayFilteredEvents.length} {dayFilteredEvents.length === 1 ? 'game' : 'games'}
                        </span>
                      )}
                    </div>
                    
                    <div className="day-events-list desktop-only">
                      {visibleEvents.map(event => {
                        const isLive = event.status.state === 'in';
                        const isFinal = event.status.state === 'post';
                        let scoreString = '';
                        
                        if (event.league === 'f1') {
                          if (isFinal) {
                            scoreString = event.homeTeam.score;
                          } else if (isLive) {
                            scoreString = 'LIVE';
                          } else {
                            const detail = event.status.detail;
                            scoreString = detail.includes('PM') || detail.includes('AM') 
                              ? detail.replace(' EST', '').replace(' EDT', '') 
                              : new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          }
                        } else if (event.league === 'ufc') {
                          if (isFinal) {
                            scoreString = 'Final';
                          } else if (isLive) {
                            scoreString = 'LIVE';
                          } else {
                            const detail = event.status.detail;
                            scoreString = detail.includes('PM') || detail.includes('AM') 
                              ? detail.replace(' EST', '').replace(' EDT', '') 
                              : new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          }
                        } else {
                          if (isLive || isFinal) {
                            scoreString = `${event.awayTeam.score}-${event.homeTeam.score}`;
                          } else {
                            const detail = event.status.detail;
                            scoreString = detail.includes('PM') || detail.includes('AM') 
                              ? detail.replace(' EST', '').replace(' EDT', '') 
                              : new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          }
                        }

                        let eventTeamsDisplay = '';
                        if (event.league === 'f1') {
                          const session = event.f1SessionType || (event.homeTeam.displayName !== 'F1' ? event.homeTeam.displayName : 'Race');
                          eventTeamsDisplay = `F1: ${session}`;
                        } else if (event.league === 'ufc') {
                          eventTeamsDisplay = `UFC: ${event.awayTeam.abbreviation} vs ${event.homeTeam.abbreviation}`;
                        } else {
                          eventTeamsDisplay = `${event.awayTeam.abbreviation} @ ${event.homeTeam.abbreviation}`;
                        }

                        return (
                          <div 
                            key={event.id}
                            className={`event-strip ${event.league} ${isLive ? 'live' : ''}`}
                            onClick={e => {
                              // Stop propagation so we don't open the Day View Modal instead
                              e.stopPropagation();
                              setSelectedEvent(event);
                            }}
                          >
                            <span className="event-teams">
                              {eventTeamsDisplay}
                            </span>
                            <span className="event-score-time">
                              {isLive && <span className="live-pulse-dot" style={{ marginRight: '4px' }} />}
                              {scoreString}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {extraCount > 0 && (
                      <div className="desktop-only" style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        textAlign: 'center',
                        marginTop: 'auto',
                        paddingTop: '2px'
                      }}>
                        + {extraCount} more
                      </div>
                    )}

                    {/* Mobile Dots Row */}
                    {dayFilteredEvents.length > 0 && (
                      <div className="day-dots-row mobile-only">
                        {dayLeagues.slice(0, 4).map(league => (
                          <span key={league} className={`day-dot ${league}`} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Game Details Modal */}
      <div className={`modal-overlay ${selectedEvent ? 'active' : ''}`} onClick={() => setSelectedEvent(null)}>
        {selectedEvent && (
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Game Details</span>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detailed-match-card">
                <div className="match-card-header">
                  <span className={`league-badge ${selectedEvent.league}`}>{selectedEvent.league}</span>
                  <div className={`match-status-text ${selectedEvent.status.state === 'in' ? 'live' : ''}`}>
                    {selectedEvent.status.state === 'in' && <span className="live-pulse-dot" />}
                    {selectedEvent.status.detail || (selectedEvent.status.state === 'pre' ? 'Upcoming' : 'Final')}
                  </div>
                </div>

                {selectedEvent.league === 'f1' ? (
                  <div className="f1-leaderboard" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                      Leaderboard / Entrants
                    </h4>
                    <div className="f1-driver-list" style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                      {(selectedEvent.f1Competitors || []).map(driver => (
                        <div 
                          key={driver.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '8px 12px', 
                            background: driver.winner ? 'rgba(225, 6, 0, 0.15)' : 'rgba(255, 255, 255, 0.02)', 
                            border: `1px solid ${driver.winner ? 'rgba(225, 6, 0, 0.3)' : 'var(--border-glass)'}`,
                            borderRadius: '8px' 
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: driver.winner ? 'var(--primary)' : 'var(--text-muted)', width: '20px' }}>
                              {driver.position}
                            </span>
                            {(driver.countryFlag || driver.logo) && (
                              <img 
                                src={driver.countryFlag || driver.logo} 
                                alt="Country Flag" 
                                style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} 
                                title="Driver Nationality"
                              />
                            )}
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {driver.name}
                            </span>
                            {driver.teamName && (
                              <span 
                                style={{ 
                                  fontSize: '10px', 
                                  fontWeight: 800, 
                                  padding: '2px 7px', 
                                  borderRadius: '6px', 
                                  backgroundColor: driver.teamColor || '#e10600', 
                                  color: '#fff', 
                                  letterSpacing: '0.4px',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {driver.teamName}
                              </span>
                            )}
                          </div>
                          {driver.winner && (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#e10600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Winner
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedEvent.league === 'ufc' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                    {/* Headliner Matchup */}
                    <div className="competitors-row" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-glass)', width: '100%' }}>
                      {/* Away/Challenger */}
                      <div className="team-block">
                        <img 
                          src={selectedEvent.awayTeam.logo} 
                          alt={selectedEvent.awayTeam.displayName} 
                          className="team-logo-large" 
                          style={{ borderRadius: '4px', objectFit: 'cover' }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                          <span className="team-name-large">{selectedEvent.awayTeam.displayName}</span>
                          <button 
                            className={`action-btn ${favorites.teams.includes(selectedEvent.awayTeam.id) ? 'favorite-active' : ''}`}
                            onClick={e => toggleTeamFavorite(selectedEvent.awayTeam.id, e)}
                            style={{ width: '24px', height: '24px', padding: 0 }}
                            title={favorites.teams.includes(selectedEvent.awayTeam.id) ? "Remove from favorites" : "Favorite fighter"}
                          >
                            <Star size={14} fill={favorites.teams.includes(selectedEvent.awayTeam.id) ? 'var(--star-color)' : 'none'} />
                          </button>
                        </div>
                        {selectedEvent.status.state !== 'pre' && (
                          <div className={`team-score-large ${selectedEvent.awayTeam.winner ? 'winner' : ''}`}>
                            {selectedEvent.awayTeam.score}
                          </div>
                        )}
                      </div>

                      <div className="vs-block">
                        <div className="vs-text">VS</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Main Event</div>
                      </div>

                      {/* Home/Champion */}
                      <div className="team-block">
                        <img 
                          src={selectedEvent.homeTeam.logo} 
                          alt={selectedEvent.homeTeam.displayName} 
                          className="team-logo-large" 
                          style={{ borderRadius: '4px', objectFit: 'cover' }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                          <span className="team-name-large">{selectedEvent.homeTeam.displayName}</span>
                          <button 
                            className={`action-btn ${favorites.teams.includes(selectedEvent.homeTeam.id) ? 'favorite-active' : ''}`}
                            onClick={e => toggleTeamFavorite(selectedEvent.homeTeam.id, e)}
                            style={{ width: '24px', height: '24px', padding: 0 }}
                            title={favorites.teams.includes(selectedEvent.homeTeam.id) ? "Remove from favorites" : "Favorite fighter"}
                          >
                            <Star size={14} fill={favorites.teams.includes(selectedEvent.homeTeam.id) ? 'var(--star-color)' : 'none'} />
                          </button>
                        </div>
                        {selectedEvent.status.state !== 'pre' && (
                          <div className={`team-score-large ${selectedEvent.homeTeam.winner ? 'winner' : ''}`}>
                            {selectedEvent.homeTeam.score}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Complete Fight Card */}
                    <div className="ufc-fight-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Full Fight Card
                      </h4>
                      <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                        {(selectedEvent.ufcFights || []).map((fight, fidx) => {
                          const isMain = fidx === (selectedEvent.ufcFights || []).length - 1;
                          return (
                            <div 
                              key={fight.id} 
                              style={{ 
                                padding: '10px 12px', 
                                background: isMain ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)', 
                                border: `1px solid ${isMain ? 'rgba(99, 102, 241, 0.25)' : 'var(--border-glass)'}`,
                                borderRadius: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: isMain ? 'var(--primary)' : 'var(--text-muted)' }}>
                                  {isMain ? 'Main Event' : `Fight ${fidx + 1}`}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  {fight.status}
                                </span>
                              </div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {/* Fighter 1 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                                  {fight.competitors[0].logo && (
                                    <img src={fight.competitors[0].logo} alt="" style={{ width: '16px', height: '11px', objectFit: 'cover' }} />
                                  )}
                                  <span style={{ 
                                    fontSize: '12px', 
                                    fontWeight: fight.competitors[0].winner ? 700 : 500, 
                                    color: fight.competitors[0].winner ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {fight.competitors[0].displayName}
                                  </span>
                                  <button 
                                    className={`action-btn ${favorites.teams.includes(`ufc-${fight.competitors[0].id}`) ? 'favorite-active' : ''}`}
                                    onClick={e => toggleTeamFavorite(`ufc-${fight.competitors[0].id}`, e)}
                                    style={{ width: '20px', height: '20px', padding: 0 }}
                                    title={favorites.teams.includes(`ufc-${fight.competitors[0].id}`) ? "Remove from favorites" : "Favorite fighter"}
                                  >
                                    <Star size={11} fill={favorites.teams.includes(`ufc-${fight.competitors[0].id}`) ? 'var(--star-color)' : 'none'} />
                                  </button>
                                </div>

                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 8px' }}>vs</span>

                                {/* Fighter 2 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, justifyContent: 'flex-end', textAlign: 'right' }}>
                                  <button 
                                    className={`action-btn ${favorites.teams.includes(`ufc-${fight.competitors[1].id}`) ? 'favorite-active' : ''}`}
                                    onClick={e => toggleTeamFavorite(`ufc-${fight.competitors[1].id}`, e)}
                                    style={{ width: '20px', height: '20px', padding: 0 }}
                                    title={favorites.teams.includes(`ufc-${fight.competitors[1].id}`) ? "Remove from favorites" : "Favorite fighter"}
                                  >
                                    <Star size={11} fill={favorites.teams.includes(`ufc-${fight.competitors[1].id}`) ? 'var(--star-color)' : 'none'} />
                                  </button>
                                  <span style={{ 
                                    fontSize: '12px', 
                                    fontWeight: fight.competitors[1].winner ? 700 : 500, 
                                    color: fight.competitors[1].winner ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {fight.competitors[1].displayName}
                                  </span>
                                  {fight.competitors[1].logo && (
                                    <img src={fight.competitors[1].logo} alt="" style={{ width: '16px', height: '11px', objectFit: 'cover' }} />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="competitors-row">
                    {/* Away Team */}
                    <div className="team-block">
                      <img 
                        src={selectedEvent.awayTeam.logo} 
                        alt={selectedEvent.awayTeam.displayName} 
                        className="team-logo-large" 
                      />
                      <div className="team-name-large">{selectedEvent.awayTeam.displayName}</div>
                      {selectedEvent.status.state !== 'pre' && (
                        <div className={`team-score-large ${selectedEvent.awayTeam.winner ? 'winner' : ''}`}>
                          {selectedEvent.awayTeam.score}
                        </div>
                      )}
                    </div>

                    {/* Middle VS */}
                    <div className="vs-block">
                      <div className="vs-text">
                        {selectedEvent.status.state === 'pre' ? 'VS' : '-'}
                      </div>
                    </div>

                    {/* Home Team */}
                    <div className="team-block">
                      <img 
                        src={selectedEvent.homeTeam.logo} 
                        alt={selectedEvent.homeTeam.displayName} 
                        className="team-logo-large" 
                      />
                      <div className="team-name-large">{selectedEvent.homeTeam.displayName}</div>
                      {selectedEvent.status.state !== 'pre' && (
                        <div className={`team-score-large ${selectedEvent.homeTeam.winner ? 'winner' : ''}`}>
                          {selectedEvent.homeTeam.score}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="match-info-meta">
                  <div className="meta-row">
                    <CalendarIcon className="meta-icon" size={14} />
                    <span>
                      {new Date(selectedEvent.date).toLocaleDateString([], {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })} at {new Date(selectedEvent.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  {selectedEvent.venue && (
                    <div className="meta-row">
                      <MapPin className="meta-icon" size={14} />
                      <span>{selectedEvent.venue}</span>
                    </div>
                  )}

                  {selectedEvent.tvBroadcasts.length > 0 && (
                    <div className="meta-row">
                      <Tv className="meta-icon" size={14} />
                      <span>{selectedEvent.tvBroadcasts.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="match-actions">
                  <a 
                    href={selectedEvent.espnLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-primary"
                    style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}
                  >
                    <span>View Gamecast</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Day Schedule Modal */}
      <div className={`modal-overlay day-schedule-modal ${selectedDayEvents ? 'active' : ''}`} onClick={handleCloseDayModal}>
        {selectedDayEvents && (() => {
          const visibleGames = selectedDayEvents.events.filter(isEventVisible);
          const hiddenGames = selectedDayEvents.events.filter(e => !isEventVisible(e));

          return (
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">
                  Games on {selectedDayEvents.date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <button className="modal-close" onClick={handleCloseDayModal}>
                  <X size={18} />
                </button>
              </div>
              
              <div className="modal-body" style={{ gap: '12px' }}>
                {visibleGames.length === 0 && hiddenGames.length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No games scheduled for this day
                  </div>
                ) : (
                  <>
                    {/* Visible Games List */}
                    {visibleGames.map(event => renderDetailedMatchCard(event, false))}

                    {/* Collapsible Hidden Games Section */}
                    {hiddenGames.length > 0 && (
                      <div className="hidden-games-section" style={{ marginTop: '4px' }}>
                        <button 
                          className="hidden-games-toggle-btn"
                          onClick={() => setShowHiddenGames(prev => !prev)}
                        >
                          <span>
                            {showHiddenGames ? 'Hide' : 'Show'} {hiddenGames.length} Hidden Game{hiddenGames.length === 1 ? '' : 's'}
                          </span>
                          <ChevronDown 
                            size={16} 
                            style={{ 
                              transform: showHiddenGames ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease'
                            }} 
                          />
                        </button>

                        {showHiddenGames && (
                          <div className="hidden-games-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                            {hiddenGames.map(event => renderDetailedMatchCard(event, true))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* League & Conference Directory Modal */}
    <div 
      className={`modal-overlay league-details-modal ${selectedLeagueDetails ? 'active' : ''}`} 
      onClick={() => {
        setSelectedLeagueDetails(null);
        setModalSearchQuery('');
      }}
    >
      {selectedLeagueDetails && (
        <div className="modal-content league-modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="league-modal-title-group">
              {selectedLeagueDetails === 'favorites' ? (
                <Star size={22} fill="var(--star-color)" color="var(--star-color)" />
              ) : (
                <span className={`league-indicator ${selectedLeagueDetails}`} />
              )}
              <div>
                <span className="modal-title">
                  {selectedLeagueDetails === 'favorites'
                    ? "My Favorites Directory"
                    : `${LEAGUE_DISPLAY_NAMES[selectedLeagueDetails] || selectedLeagueDetails.toUpperCase()} Directory`}
                </span>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {selectedLeagueDetails === 'favorites'
                    ? "Full directory view of favorited leagues, conferences, and teams"
                    : "Full details and toggles for conferences and teams"}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedLeagueDetails !== 'favorites' && (
                <>
                  <button 
                    className={`action-btn ${favorites.leagues.includes(selectedLeagueDetails) ? 'favorite-active' : ''}`}
                    onClick={(e) => toggleLeagueFavorite(selectedLeagueDetails, e)}
                    title="Favorite league"
                  >
                    <Star size={16} fill={favorites.leagues.includes(selectedLeagueDetails) ? 'var(--star-color)' : 'none'} />
                  </button>
                  
                  <button 
                    className="action-btn"
                    onClick={(e) => toggleLeagueVisibility(selectedLeagueDetails, e)}
                    title="Toggle league visibility"
                  >
                    {toggles.leagues[selectedLeagueDetails] ? <Eye size={16} /> : <EyeOff size={16} style={{ color: 'var(--danger)' }} />}
                  </button>
                </>
              )}

              <button 
                className="modal-close" 
                onClick={() => {
                  setSelectedLeagueDetails(null);
                  setModalSearchQuery('');
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="modal-body league-modal-body">
            {/* Search bar inside modal */}
            <div className="modal-search-bar">
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text"
                placeholder={
                  selectedLeagueDetails === 'favorites'
                    ? "Search favorites (teams, conferences, leagues)..."
                    : selectedLeagueDetails === 'ncaaf' || selectedLeagueDetails === 'ncaab' 
                    ? "Search teams, conferences, or cities..." 
                    : "Search teams or cities..."
                }
                value={modalSearchQuery}
                onChange={e => setModalSearchQuery(e.target.value)}
                className="modal-search-input"
              />
              {modalSearchQuery && (
                <button className="action-btn" onClick={() => setModalSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Content for Favorites Open View */}
            {selectedLeagueDetails === 'favorites' ? (
              <div className="college-directory-container">
                {/* Favorites Display Toolbar with Hide Conferences controls */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    <Star size={16} fill="var(--star-color)" color="var(--star-color)" />
                    <span>Favorites Directory Overview</span>
                  </div>

                  {(favorites.conferences && favorites.conferences.length > 0) && (
                    <button
                      className="btn"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={toggleHideAllFavoriteConferences}
                      title="Toggle visibility for all favorited conferences"
                    >
                      {favorites.conferences.every(id => toggles.conferences?.[id] === false) ? (
                        <>
                          <Eye size={14} />
                          <span>Show All Conferences</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} style={{ color: 'var(--danger)' }} />
                          <span>Hide All Conferences</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Favorited Conferences */}
                {(favorites.conferences && favorites.conferences.length > 0) && (
                  <div style={{ marginTop: '8px' }}>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      Favorited Conferences ({favorites.conferences.length})
                    </h4>
                    {favorites.conferences.map(confId => {
                      const parts = confId.split('-');
                      const confLeague = parts[0] as League;
                      const confName = parts.slice(1).join('-');
                      const isConfVisible = toggles.conferences?.[confId] !== false;
                      const isMinimized = !modalSearchQuery.trim() && minimizedModalConferences[confId] === true;

                      const allLeagueTeams = getCombinedLeagueTeams(confLeague);
                      const confTeams = allLeagueTeams.filter(t => t.conference === confName);

                      const searchQ = modalSearchQuery.trim().toLowerCase();
                      if (searchQ && !confName.toLowerCase().includes(searchQ) && !confTeams.some(t => t.displayName.toLowerCase().includes(searchQ) || t.abbreviation.toLowerCase().includes(searchQ))) {
                        return null;
                      }

                      return (
                        <div key={`modal-fav-conf-${confId}`} className={`modal-conference-card ${!isConfVisible ? 'dimmed' : ''} ${isMinimized ? 'minimized' : ''}`} style={{ marginBottom: '14px' }}>
                          <div 
                            className="modal-conference-header"
                            onClick={() => toggleMinimizeModalConference(confId)}
                            title={isMinimized ? "Click to expand conference" : "Click to minimize conference"}
                          >
                            <div className="modal-conference-title">
                              <ChevronDown 
                                size={16} 
                                style={{ 
                                  transform: isMinimized ? 'rotate(-90deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s ease',
                                  color: 'var(--text-muted)'
                                }} 
                              />
                              <span className={`league-indicator ${confLeague}`} />
                              <h3>{confName} Conference</h3>
                              <span className={`league-tag-badge ${confLeague}`}>{confLeague.toUpperCase()}</span>
                              {!isConfVisible && (
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', fontWeight: 600 }}>
                                  Hidden
                                </span>
                              )}
                            </div>

                            <div className="fav-item-actions" onClick={e => e.stopPropagation()}>
                              <button 
                                className="action-btn"
                                onClick={e => toggleConferenceVisibility(confId, e)}
                                title={isConfVisible ? "Hide conference" : "Show conference"}
                              >
                                {isConfVisible ? <Eye size={14} /> : <EyeOff size={14} style={{ color: 'var(--danger)' }} />}
                              </button>

                              <button 
                                className="action-btn favorite-active"
                                onClick={e => toggleConferenceFavorite(confId, e)}
                                title="Remove conference favorite"
                              >
                                <Star size={14} fill="var(--star-color)" />
                              </button>
                            </div>
                          </div>

                          {!isMinimized && (
                            <div className="modal-teams-grid">
                              {confTeams.map(team => {
                                const isTeamFav = favorites.teams.includes(team.id);
                                const isTeamVisible = toggles.teams[team.id] !== false;

                                return (
                                  <div key={`conf-team-${team.id}`} className={`modal-team-card ${!isTeamVisible || !isConfVisible ? 'dimmed' : ''}`}>
                                    <div className="modal-team-main">
                                      <input 
                                        type="checkbox" 
                                        checked={isTeamVisible && isConfVisible}
                                        onChange={() => toggleTeamVisibility(team.id)}
                                        className="team-row-checkbox"
                                      />
                                      <img src={team.logo} alt={team.displayName} className="modal-team-logo" />
                                      <div className="modal-team-details">
                                        <span className="modal-team-name">{team.displayName}</span>
                                        <span className="modal-team-abbrev" style={{ color: `#${getReadableTeamColor(team.color, team.alternateColor)}` }}>
                                          {team.abbreviation}
                                        </span>
                                      </div>
                                    </div>

                                    <button 
                                      className={`action-btn ${isTeamFav ? 'favorite-active' : ''}`}
                                      onClick={e => toggleTeamFavorite(team.id, e)}
                                      title={isTeamFav ? "Remove team favorite" : "Favorite team"}
                                    >
                                      <Star size={14} fill={isTeamFav ? 'var(--star-color)' : 'none'} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Favorited Leagues */}
                {favorites.leagues.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      Favorited Leagues ({favorites.leagues.length})
                    </h4>
                    <div className="modal-teams-grid standard-league-grid">
                      {favorites.leagues.map(lg => {
                        const isVisible = toggles.leagues[lg];
                        const searchQ = modalSearchQuery.trim().toLowerCase();
                        const lgName = LEAGUE_DISPLAY_NAMES[lg] || lg.toUpperCase();
                        if (searchQ && !lgName.toLowerCase().includes(searchQ)) return null;

                        return (
                          <div key={`modal-fav-lg-${lg}`} className={`modal-team-card ${!isVisible ? 'dimmed' : ''}`}>
                            <div className="modal-team-main">
                              <span className={`league-indicator ${lg}`} />
                              <div className="modal-team-details">
                                <span className="modal-team-name">{lgName}</span>
                              </div>
                            </div>

                            <div className="fav-item-actions">
                              <button 
                                className="action-btn"
                                onClick={e => toggleLeagueVisibility(lg, e)}
                                title={isVisible ? "Hide league" : "Show league"}
                              >
                                {isVisible ? <Eye size={14} /> : <EyeOff size={14} style={{ color: 'var(--danger)' }} />}
                              </button>

                              <button 
                                className="action-btn favorite-active"
                                onClick={e => toggleLeagueFavorite(lg, e)}
                                title="Remove league favorite"
                              >
                                <Star size={14} fill="var(--star-color)" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Favorited Teams */}
                {favorites.teams.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      Favorited Teams ({favorites.teams.length})
                    </h4>
                    <div className="modal-teams-grid standard-league-grid">
                      {favorites.teams.map(teamId => {
                        const team = getTeamById(teamId);
                        if (!team) return null;
                        const searchQ = modalSearchQuery.trim().toLowerCase();
                        if (searchQ && !team.displayName.toLowerCase().includes(searchQ) && !team.abbreviation.toLowerCase().includes(searchQ)) return null;

                        const isTeamVisible = toggles.teams[teamId] !== false;
                        const confId = team.conference ? `${team.league}-${team.conference}` : null;
                        const isConfVisible = confId ? toggles.conferences?.[confId] !== false : true;

                        return (
                          <div key={`modal-fav-team-${teamId}`} className={`modal-team-card ${!isTeamVisible || !isConfVisible ? 'dimmed' : ''}`}>
                            <div className="modal-team-main">
                              <input 
                                type="checkbox" 
                                checked={isTeamVisible && isConfVisible}
                                onChange={() => toggleTeamVisibility(teamId)}
                                className="team-row-checkbox"
                              />
                              <img src={team.logo} alt={team.displayName} className="modal-team-logo" />
                              <div className="modal-team-details">
                                <span className="modal-team-name">{team.displayName}</span>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <span className="modal-team-abbrev" style={{ color: `#${getReadableTeamColor(team.color, team.alternateColor)}` }}>
                                    {team.abbreviation}
                                  </span>
                                  <span className={`league-tag-badge ${team.league}`}>{team.league.toUpperCase()}</span>
                                  {team.conference && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: '3px' }}>
                                      {team.conference}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button 
                              className="action-btn favorite-active"
                              onClick={e => toggleTeamFavorite(teamId, e)}
                              title="Remove team favorite"
                            >
                              <Star size={14} fill="var(--star-color)" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : selectedLeagueDetails === 'ncaaf' || selectedLeagueDetails === 'ncaab' ? (
              // Content for College Sports
              (() => {
                const modalConfs = getModalConferences(selectedLeagueDetails, modalSearchQuery);
                const allConfIds = modalConfs.map(c => c.id);
                const searchQ = modalSearchQuery.trim().toLowerCase();

                return (
                  <div className="college-directory-container">
                    {/* Toolbar with Collapse All / Expand All controls */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {modalConfs.length} Conferences ({modalConfs.reduce((sum, c) => sum + c.teams.length, 0)} Teams)
                      </span>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn"
                          style={{ fontSize: '11px', padding: '5px 10px' }}
                          onClick={() => handleCollapseAllModalConferences(allConfIds)}
                          title="Collapse all conference sections"
                        >
                          <ChevronUp size={14} />
                          <span>Collapse All</span>
                        </button>
                        <button
                          className="btn"
                          style={{ fontSize: '11px', padding: '5px 10px' }}
                          onClick={() => handleExpandAllModalConferences(allConfIds)}
                          title="Expand all conference sections"
                        >
                          <ChevronDown size={14} />
                          <span>Expand All</span>
                        </button>
                      </div>
                    </div>

                    {modalConfs.map(conf => {
                      const isConfFav = (favorites.conferences || []).includes(conf.id);
                      const isConfVisible = toggles.conferences?.[conf.id] !== false;
                      const isMinimized = !searchQ && minimizedModalConferences[conf.id] === true;

                      return (
                        <div key={conf.id} className={`modal-conference-card ${!isConfVisible ? 'dimmed' : ''} ${isMinimized ? 'minimized' : ''}`}>
                          <div 
                            className="modal-conference-header"
                            onClick={() => toggleMinimizeModalConference(conf.id)}
                            title={isMinimized ? "Click to expand conference" : "Click to minimize conference"}
                          >
                            <div className="modal-conference-title">
                              <ChevronDown 
                                size={16} 
                                style={{ 
                                  transform: isMinimized ? 'rotate(-90deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s ease',
                                  color: 'var(--text-muted)'
                                }} 
                              />
                              <h3>{conf.name} Conference</h3>
                              <span className="conference-count-badge">{conf.teams.length} teams</span>
                              {!isConfVisible && (
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', fontWeight: 600 }}>
                                  Hidden
                                </span>
                              )}
                            </div>

                            <div className="fav-item-actions" onClick={e => e.stopPropagation()}>
                              <button 
                                className={`action-btn ${isConfFav ? 'favorite-active' : ''}`}
                                onClick={e => toggleConferenceFavorite(conf.id, e)}
                                title={isConfFav ? "Remove conference favorite" : "Favorite conference"}
                              >
                                <Star size={14} fill={isConfFav ? 'var(--star-color)' : 'none'} />
                              </button>

                              <button 
                                className="action-btn"
                                onClick={e => toggleConferenceVisibility(conf.id, e)}
                                title={isConfVisible ? "Hide conference" : "Show conference"}
                              >
                                {isConfVisible ? <Eye size={14} /> : <EyeOff size={14} style={{ color: 'var(--danger)' }} />}
                              </button>
                            </div>
                          </div>

                          {!isMinimized && (
                            <div className="modal-teams-grid">
                              {conf.teams.map(team => {
                                const isTeamFav = favorites.teams.includes(team.id);
                                const isTeamVisible = toggles.teams[team.id] !== false;

                                return (
                                  <div key={team.id} className={`modal-team-card ${!isTeamVisible || !isConfVisible ? 'dimmed' : ''}`}>
                                    <div className="modal-team-main">
                                      <input 
                                        type="checkbox" 
                                        checked={isTeamVisible && isConfVisible}
                                        onChange={() => toggleTeamVisibility(team.id)}
                                        className="team-row-checkbox"
                                      />
                                      <img src={team.logo} alt={team.displayName} className="modal-team-logo" />
                                      <div className="modal-team-details">
                                        <span className="modal-team-name">{team.displayName}</span>
                                        <span className="modal-team-abbrev" style={{ color: `#${getReadableTeamColor(team.color, team.alternateColor)}` }}>
                                          {team.abbreviation}
                                        </span>
                                      </div>
                                    </div>

                                    <button 
                                      className={`action-btn ${isTeamFav ? 'favorite-active' : ''}`}
                                      onClick={e => toggleTeamFavorite(team.id, e)}
                                      title={isTeamFav ? "Remove team favorite" : "Favorite team"}
                                    >
                                      <Star size={14} fill={isTeamFav ? 'var(--star-color)' : 'none'} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              // Content for Standard Leagues
              <div className="modal-teams-grid standard-league-grid">
                {getModalTeams(selectedLeagueDetails, modalSearchQuery).map(team => {
                  const isTeamFav = favorites.teams.includes(team.id);
                  const isTeamVisible = toggles.teams[team.id] !== false;

                  return (
                    <div key={team.id} className={`modal-team-card ${!isTeamVisible ? 'dimmed' : ''}`}>
                      <div className="modal-team-main">
                        <input 
                          type="checkbox" 
                          checked={isTeamVisible}
                          onChange={() => toggleTeamVisibility(team.id)}
                          className="team-row-checkbox"
                        />
                        <img src={team.logo} alt={team.displayName} className="modal-team-logo" />
                        <div className="modal-team-details">
                          <span className="modal-team-name">{team.displayName}</span>
                          <span className="modal-team-abbrev" style={{ color: `#${getReadableTeamColor(team.color, team.alternateColor)}` }}>
                            {team.abbreviation}
                          </span>
                        </div>
                      </div>

                      <button 
                        className={`action-btn ${isTeamFav ? 'favorite-active' : ''}`}
                        onClick={e => toggleTeamFavorite(team.id, e)}
                        title={isTeamFav ? "Remove team favorite" : "Favorite team"}
                      >
                        <Star size={14} fill={isTeamFav ? 'var(--star-color)' : 'none'} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);
}
