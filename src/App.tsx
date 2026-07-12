import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Eye, 
  EyeOff, 
  Tv, 
  MapPin, 
  ExternalLink, 
  X,
  SlidersHorizontal,
  ChevronDown,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  TrendingUp,
  Trophy
} from 'lucide-react';
import type { League, Team, GameEvent, FavoritesState, TogglesState } from './types';
import { fetchScoreboard } from './api';
import { TEAMS_DIRECTORY } from './teamsData';

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
  leagues: { nfl: true, nba: true, mlb: true, nhl: true, mls: true, f1: true, ufc: true, worldcup: true, olympics: true, epl: true, laliga: true, champions: true },
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

  // View Mode: grid or agenda
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>(() => {
    const saved = localStorage.getItem('sportscal_view_mode');
    return (saved === 'agenda' || saved === 'grid') ? saved : 'grid';
  });

  // Global search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('sportscal_view_mode', viewMode);
  }, [viewMode]);

  // Static list of all teams in all leagues (independent of visible month)
  const teams = TEAMS_DIRECTORY;

  // Favorites & Filter Toggles State
  const [favorites, setFavorites] = useState<FavoritesState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_FAVORITES);
    return saved ? JSON.parse(saved) : INITIAL_FAVORITES;
  });
  const [toggles, setToggles] = useState<TogglesState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_TOGGLES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          leagues: { ...INITIAL_TOGGLES.leagues, ...parsed.leagues },
          teams: { ...INITIAL_TOGGLES.teams, ...parsed.teams },
        };
      } catch (e) {
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
        return { ...defaultColors, ...parsed };
      } catch (e) {
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

  useEffect(() => {
    let updated = false;
    const newFighters = { ...knownFighters };
    events.forEach(event => {
      if (event.league === 'ufc' && event.ufcFights) {
        event.ufcFights.forEach(fight => {
          fight.competitors.forEach(c => {
            const fullId = `ufc-${c.id}`;
            if (!newFighters[fullId]) {
              newFighters[fullId] = {
                id: fullId,
                displayName: c.displayName,
                logo: c.logo
              };
              updated = true;
            }
          });
        });
      }
    });
    if (updated) {
      setKnownFighters(newFighters);
      localStorage.setItem('sportscal_known_fighters', JSON.stringify(newFighters));
    }
  }, [events, knownFighters]);

  // UI States
  const [expandedLeagues, setExpandedLeagues] = useState<Record<League, boolean>>({
    nfl: false,
    nba: false,
    mlb: false,
    nhl: false,
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
    mls: '',
    f1: '',
    ufc: '',
    worldcup: '',
    olympics: '',
    epl: '',
    laliga: '',
    champions: '',
  });
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SIDEBAR_OPEN);
    return saved ? saved === 'true' : true;
  });
  
  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: Date; events: GameEvent[] } | null>(null);
  const [showHiddenGames, setShowHiddenGames] = useState<boolean>(false);

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

  // Helper to check if event matches global search query
  const matchesSearch = (event: GameEvent): boolean => {
    const searchClean = searchQuery.toLowerCase().trim();
    if (!searchClean) return true;
    
    return Boolean(
      event.name.toLowerCase().includes(searchClean) ||
      event.shortName.toLowerCase().includes(searchClean) ||
      event.homeTeam.displayName.toLowerCase().includes(searchClean) ||
      event.homeTeam.abbreviation.toLowerCase().includes(searchClean) ||
      event.awayTeam.displayName.toLowerCase().includes(searchClean) ||
      event.awayTeam.abbreviation.toLowerCase().includes(searchClean) ||
      Boolean(event.venue && event.venue.toLowerCase().includes(searchClean)) ||
      Boolean(LEAGUE_DISPLAY_NAMES[event.league] && LEAGUE_DISPLAY_NAMES[event.league].toLowerCase().includes(searchClean)) ||
      event.league.toLowerCase().includes(searchClean) ||
      (event.ufcFights && event.ufcFights.some(fight => 
        fight.name.toLowerCase().includes(searchClean) || 
        fight.competitors.some(c => c.displayName.toLowerCase().includes(searchClean))
      )) ||
      (event.f1Competitors && event.f1Competitors.some(driver =>
        driver.name.toLowerCase().includes(searchClean)
      ))
    );
  };

  // Helper to check if an event is currently visible based on active toggles/filters & search query
  const isEventVisible = (event: GameEvent): boolean => {
    // 0. Search query check
    if (!matchesSearch(event)) return false;

    // 1. League visibility toggle check
    if (!toggles.leagues[event.league]) return false;

    // 2. Individual team toggles (check if either team is toggled OFF)
    if (toggles.teams[event.homeTeam.id] === false) return false;
    if (toggles.teams[event.awayTeam.id] === false) return false;

    // 3. Favorites only filter
    if (showFavoritesOnly) {
      const isLeagueFav = favorites.leagues.includes(event.league);
      const isHomeFav = favorites.teams.includes(event.homeTeam.id);
      const isAwayFav = favorites.teams.includes(event.awayTeam.id);
      const isUfcCardFav = event.league === 'ufc' && event.ufcFights?.some(fight =>
        fight.competitors.some(c => favorites.teams.includes(`ufc-${c.id}`))
      );
      
      if (!isLeagueFav && !isHomeFav && !isAwayFav && !isUfcCardFav) return false;
    }

    return true;
  };

  // Helper to check if a Date matches Today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Filter events based on active filters & toggles & search query
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // 1. Search Query Check
      if (!matchesSearch(event)) return false;

      // 2. League visibility toggle check
      if (!toggles.leagues[event.league]) return false;

      // 3. Individual team toggles (check if either team is toggled OFF)
      if (toggles.teams[event.homeTeam.id] === false) return false;
      if (toggles.teams[event.awayTeam.id] === false) return false;

      // 4. Favorites only filter
      if (showFavoritesOnly) {
        const isLeagueFav = favorites.leagues.includes(event.league);
        const isHomeFav = favorites.teams.includes(event.homeTeam.id);
        const isAwayFav = favorites.teams.includes(event.awayTeam.id);
        const isUfcCardFav = event.league === 'ufc' && event.ufcFights?.some(fight =>
          fight.competitors.some(c => favorites.teams.includes(`ufc-${c.id}`))
        );
        
        if (!isLeagueFav && !isHomeFav && !isAwayFav && !isUfcCardFav) return false;
      }

      return true;
    });
  }, [events, toggles, favorites, showFavoritesOnly, searchQuery]);

  // Compute live events (visible based on active filters)
  const liveEvents = useMemo(() => {
    return events.filter(e => e.status.state === 'in' && isEventVisible(e));
  }, [events, toggles, favorites, showFavoritesOnly, searchQuery]);

  // Compute today's events (visible based on active filters, excluding live)
  const todayEvents = useMemo(() => {
    return events.filter(e => {
      const d = new Date(e.date);
      return isToday(d) && e.status.state !== 'in' && isEventVisible(e);
    });
  }, [events, toggles, favorites, showFavoritesOnly, searchQuery]);

  // Group filtered events by date for Agenda/List view
  const agendaDays = useMemo(() => {
    // Filter events to only the selected month
    const monthEvents = filteredEvents.filter(event => {
      const d = new Date(event.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    // Group by date key
    const map: Record<string, { date: Date; events: GameEvent[] }> = {};
    monthEvents.forEach(event => {
      const d = new Date(event.date);
      const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[dateKey]) {
        map[dateKey] = { date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), events: [] };
      }
      map[dateKey].events.push(event);
    });

    // Sort dates ascending
    return Object.values(map).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredEvents, currentDate]);

  const monthStats = useMemo(() => {
    const monthEvents = filteredEvents.filter(event => {
      const d = new Date(event.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    const activeLeagues = new Set(monthEvents.map(event => event.league));
    const upcoming = monthEvents.filter(event => event.status.state === 'pre').length;
    const completed = monthEvents.filter(event => event.status.state === 'post').length;
    const primeTime = monthEvents.filter(event => {
      const hour = new Date(event.date).getHours();
      return hour >= 18 && hour <= 22;
    }).length;

    return {
      total: monthEvents.length,
      activeLeagues: activeLeagues.size,
      upcoming,
      completed,
      primeTime,
    };
  }, [filteredEvents, currentDate]);

  const topLeagueRows = useMemo(() => {
    const leagueCounts = filteredEvents.reduce((acc, event) => {
      const d = new Date(event.date);
      if (d.getMonth() !== currentDate.getMonth() || d.getFullYear() !== currentDate.getFullYear()) {
        return acc;
      }
      acc[event.league] = (acc[event.league] || 0) + 1;
      return acc;
    }, {} as Record<League, number>);

    return Object.entries(leagueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4) as [League, number][];
  }, [filteredEvents, currentDate]);

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

  // Helper to format date string
  const formatMonthName = (date: Date): string => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Get active teams for list rendering (filtered by search query)
  const getFilteredTeams = (league: League) => {
    const rawQuery = teamSearchQueries[league];
    const cleanQuery = rawQuery
      .toLowerCase()
      .trim()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
    
    let teamList = teams[league] || [];
    if (teamList.length === 0 && league !== 'ufc') {
      const uniqueTeams = new Map<string, Team>();
      events.forEach(event => {
        if (event.league === league) {
          if (event.homeTeam && event.homeTeam.id && event.homeTeam.id !== 'f1-session' && event.homeTeam.id !== 'f1-league') {
            uniqueTeams.set(event.homeTeam.id, {
              id: event.homeTeam.id,
              displayName: event.homeTeam.displayName,
              shortDisplayName: event.homeTeam.displayName,
              abbreviation: event.homeTeam.abbreviation,
              color: event.homeTeam.color || '1e293b',
              logo: event.homeTeam.logo,
              league: league
            });
          }
          if (event.awayTeam && event.awayTeam.id && event.awayTeam.id !== 'f1-session' && event.awayTeam.id !== 'f1-league') {
            uniqueTeams.set(event.awayTeam.id, {
              id: event.awayTeam.id,
              displayName: event.awayTeam.displayName,
              shortDisplayName: event.awayTeam.displayName,
              abbreviation: event.awayTeam.abbreviation,
              color: event.awayTeam.color || '1e293b',
              logo: event.awayTeam.logo,
              league: league
            });
          }
        }
      });
      teamList = Array.from(uniqueTeams.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else if (league === 'ufc') {
      teamList = Object.values(knownFighters).map(f => ({
        id: f.id,
        displayName: f.displayName,
        shortDisplayName: f.displayName,
        abbreviation: f.displayName,
        color: '1e293b',
        logo: f.logo,
        league: 'ufc' as League
      }));
    }

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
    // If any team or league has a toggle off, we show a badge
    const anyLeagueOff = Object.values(toggles.leagues).some(val => !val);
    const anyTeamOff = Object.values(toggles.teams).some(val => !val);
    return anyLeagueOff || anyTeamOff;
  }, [toggles]);

  // Helper to get team details by ID
  const getTeamById = (teamId: string) => {
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

  // Helper to render a compact card in the scoreboard ticker
  const renderTickerCard = (event: GameEvent, isLive: boolean) => {
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
        scoreString = `${event.awayTeam.score} - ${event.homeTeam.score}`;
      } else {
        const detail = event.status.detail;
        scoreString = detail.includes('PM') || detail.includes('AM') 
          ? detail.replace(' EST', '').replace(' EDT', '') 
          : new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }

    return (
      <div 
        key={`ticker-${event.id}`}
        className={`ticker-card ${event.league} ${isLive ? 'live' : ''}`}
        onClick={() => setSelectedEvent(event)}
        style={{
          background: event.league !== 'f1' && event.league !== 'ufc'
            ? `linear-gradient(135deg, rgba(30, 35, 45, 0.9) 0%, #${event.homeTeam.color}15 100%)`
            : undefined
        }}
      >
        <div className="ticker-card-top">
          <span className={`league-badge ${event.league}`}>{event.league}</span>
          <span className={`ticker-status ${isLive ? 'live' : ''}`}>
            {isLive && <span className="live-pulse-dot" />}
            {isLive ? (event.status.detail || 'LIVE') : (isFinal ? 'Final' : 'Upcoming')}
          </span>
        </div>
        
        <div className="ticker-card-matchup">
          {event.league === 'f1' ? (
            <div className="ticker-f1">
              <span className="ticker-team-name">{event.shortName.replace(' Grand Prix', ' GP')}</span>
              <span className="ticker-score">{scoreString}</span>
            </div>
          ) : event.league === 'ufc' ? (
            <div className="ticker-ufc">
              <span className="ticker-team-name">{event.awayTeam.abbreviation} vs {event.homeTeam.abbreviation}</span>
              <span className="ticker-score">{scoreString}</span>
            </div>
          ) : (
            <div className="ticker-teams-row">
              <div className="ticker-team">
                <img src={event.awayTeam.logo} alt="" className="ticker-logo" />
                <span className="ticker-team-abbr" style={{ borderBottom: `2px solid #${event.awayTeam.color || 'transparent'}` }}>{event.awayTeam.abbreviation}</span>
              </div>
              <span className={`ticker-vs-score ${isLive ? 'live' : ''}`}>{scoreString}</span>
              <div className="ticker-team">
                <span className="ticker-team-abbr" style={{ borderBottom: `2px solid #${event.homeTeam.color || 'transparent'}` }}>{event.homeTeam.abbreviation}</span>
                <img src={event.homeTeam.logo} alt="" className="ticker-logo" />
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
          <h3 className="section-title">My Favorites</h3>
          <div className="favorites-list">
            {favorites.leagues.length === 0 && favorites.teams.length === 0 ? (
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
                    <div key={`fav-league-${league}`} className="fav-item league-fav-item">
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

                {/* Favorited Teams */}
                {favorites.teams.map(teamId => {
                  const team = getTeamById(teamId);
                  if (!team) return null;
                  const isVisible = toggles.teams[teamId] !== false;
                  return (
                    <div key={`fav-team-${teamId}`} className="fav-item team-fav-item">
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
            {(['nfl', 'nba', 'mlb', 'nhl', 'mls', 'f1', 'ufc', 'worldcup', 'olympics', 'epl', 'laliga', 'champions'] as League[]).map(league => {
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
                    </div>
                  </div>

                  {/* League Teams Collapsible Content */}
                  <div className="league-teams-wrapper">
                    <div className="teams-list-container">
                      <div className="team-search-input-wrapper">
                        <input 
                          type="text" 
                          placeholder="Search teams..." 
                          className="team-search-input"
                          value={teamSearchQueries[league]}
                          onChange={e => setTeamSearchQueries(prev => ({ ...prev, [league]: e.target.value }))}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      
                      {leagueTeams.length === 0 ? (
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
                                    borderLeft: `2px solid #${team.color}`,
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
            
            {/* Search Input Box */}
            <div className="search-bar-container">
              <Search size={16} className="search-bar-icon" />
              <input 
                type="text" 
                placeholder="Search matchups, teams..."
                className="search-bar-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="search-clear-btn" 
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
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
            {/* View Mode Toggle */}
            <div className="view-toggle-group">
              <button 
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Calendar Grid"
              >
                <LayoutGrid size={16} />
                <span className="desktop-only">Grid</span>
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'agenda' ? 'active' : ''}`}
                onClick={() => setViewMode('agenda')}
                title="Agenda List"
              >
                <List size={16} />
                <span className="desktop-only">Agenda</span>
              </button>
            </div>
            
            <button className="btn" onClick={handleToday}>
              Today
            </button>
          </div>
        </header>

        <section className="dashboard-overview" aria-label="Calendar overview">
          <div className="overview-hero">
            <div>
              <div className="overview-kicker">
                <Sparkles size={14} />
                <span>Command Center</span>
              </div>
              <h2>{monthStats.total} matchups on deck</h2>
              <p>
                {monthStats.activeLeagues} active leagues, {monthStats.upcoming} upcoming, {monthStats.primeTime} prime time windows.
              </p>
            </div>
            <div className="overview-ring" aria-hidden="true">
              <span>{liveEvents.length}</span>
              <small>live</small>
            </div>
          </div>

          <div className="overview-stats-grid">
            <div className="overview-stat-card live">
              <span className="stat-label">Live Now</span>
              <strong>{liveEvents.length}</strong>
              <span className="stat-detail">{todayEvents.length} later today</span>
            </div>
            <div className="overview-stat-card">
              <span className="stat-label">Month Slate</span>
              <strong>{monthStats.total}</strong>
              <span className="stat-detail">{monthStats.completed} completed</span>
            </div>
            <div className="overview-stat-card">
              <span className="stat-label">Favorites</span>
              <strong>{favorites.leagues.length + favorites.teams.length}</strong>
              <span className="stat-detail">{showFavoritesOnly ? 'filtered view' : 'ready to pin'}</span>
            </div>
          </div>

          <div className="league-pulse-panel">
            <div className="league-pulse-header">
              <span>League Pulse</span>
              <Trophy size={15} />
            </div>
            <div className="league-pulse-list">
              {topLeagueRows.length === 0 ? (
                <span className="league-pulse-empty">No active leagues in this view</span>
              ) : (
                topLeagueRows.map(([league, count]) => (
                  <div key={league} className="league-pulse-row">
                    <span className={`league-indicator ${league}`} />
                    <span>{LEAGUE_DISPLAY_NAMES[league] || league.toUpperCase()}</span>
                    <strong>{count}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Live/Today Scoreboard Ticker */}
        {(liveEvents.length > 0 || todayEvents.length > 0) && (
          <div className="scoreboard-ticker">
            <div className="ticker-header">
              <div className="ticker-title">
                {liveEvents.length > 0 ? (
                  <>
                    <span className="live-pulse-dot" />
                    <span className="live-title-text">Live Matchups</span>
                  </>
                ) : (
                  <>
                    <TrendingUp size={14} className="ticker-icon" style={{ color: 'var(--primary)' }} />
                    <span>Today's Slate</span>
                  </>
                )}
              </div>
              <div className="ticker-count">
                {liveEvents.length > 0 ? `${liveEvents.length} Live` : `${todayEvents.length} Scheduled`}
              </div>
            </div>
            <div className="ticker-cards-scroll">
              {liveEvents.map(event => renderTickerCard(event, true))}
              {todayEvents.map(event => renderTickerCard(event, false))}
            </div>
          </div>
        )}

        {/* Main Content (Grid or Agenda) */}
        <section className={`calendar-view ${viewMode === 'agenda' ? 'agenda-mode' : ''}`}>
          {viewMode === 'agenda' ? (
            // Agenda View
            loading ? (
              <div className="skeleton-loader" style={{ padding: '24px' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton-line" style={{ height: '75px', marginBottom: '12px' }} />
                ))}
              </div>
            ) : agendaDays.length === 0 ? (
              <div className="agenda-empty-state">
                <Trophy size={48} className="agenda-empty-icon" />
                <h3>No matchups found</h3>
                <p>There are no games matching your active filters or search query in this month.</p>
                {(hasTogglesOff || searchQuery) && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      handleClearFilters();
                      setSearchQuery('');
                    }} 
                    style={{ marginTop: '16px' }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="agenda-days-list">
                {agendaDays.map(({ date, events: dayEvents }) => {
                  const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                  const isDayToday = isToday(date);
                  
                  return (
                    <div 
                      key={dateKey} 
                      className={`agenda-day-card ${isDayToday ? 'today' : ''}`}
                    >
                      <div className="agenda-day-header">
                        <div className="agenda-day-date">
                          <span className="agenda-day-name">
                            {date.toLocaleDateString([], { weekday: 'long' })}
                          </span>
                          <span className="agenda-day-number">
                            {date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {isDayToday && (
                          <span className="agenda-today-badge">
                            <Sparkles size={11} style={{ marginRight: '4px' }} />
                            Today
                          </span>
                        )}
                        <div className="agenda-day-games-count">
                          {dayEvents.length} {dayEvents.length === 1 ? 'matchup' : 'matchups'}
                        </div>
                      </div>
                      
                      <div className="agenda-day-events">
                        {dayEvents.map(event => {
                          const isLive = event.status.state === 'in';
                          const isFinal = event.status.state === 'post';
                          const isHomeWinner = event.homeTeam.winner;
                          const isAwayWinner = event.awayTeam.winner;

                          let scoreText = '';
                          if (event.league === 'f1') {
                            scoreText = isFinal ? event.homeTeam.score : (isLive ? 'LIVE' : new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                          } else if (event.league === 'ufc') {
                            scoreText = isFinal ? 'Final' : (isLive ? 'LIVE' : new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                          } else {
                            scoreText = (isLive || isFinal) 
                              ? `${event.awayTeam.score} - ${event.homeTeam.score}` 
                              : new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          }

                          return (
                            <div 
                              key={event.id}
                              className={`agenda-event-row ${event.league} ${isLive ? 'live' : ''}`}
                              onClick={() => setSelectedEvent(event)}
                              style={{
                                background: event.league !== 'f1' && event.league !== 'ufc'
                                  ? `linear-gradient(135deg, rgba(20, 24, 33, 0.3) 0%, #${event.homeTeam.color}0a 100%)`
                                  : undefined
                              }}
                            >
                              <div className="agenda-event-meta">
                                <span className={`league-badge ${event.league}`}>{event.league}</span>
                                <span className={`agenda-event-status ${isLive ? 'live' : ''}`}>
                                  {isLive && <span className="live-pulse-dot" />}
                                  {event.status.detail || (isLive ? 'LIVE' : isFinal ? 'Final' : 'Upcoming')}
                                </span>
                              </div>
                              
                              <div className="agenda-event-matchup">
                                {event.league === 'f1' ? (
                                  <div className="agenda-f1-layout">
                                    <img src={event.homeTeam.logo} alt="" className="agenda-team-logo" />
                                    <span className="agenda-event-name-text">{event.name}</span>
                                  </div>
                                ) : event.league === 'ufc' ? (
                                  <div className="agenda-ufc-layout">
                                    <img src={event.awayTeam.logo} alt="" className="agenda-ufc-logo" />
                                    <span className="agenda-event-name-text">{event.name}</span>
                                    <img src={event.homeTeam.logo} alt="" className="agenda-ufc-logo" />
                                  </div>
                                ) : (
                                  <div className="agenda-teams-layout">
                                    <div className={`agenda-team ${isAwayWinner ? 'winner' : ''}`}>
                                      <img src={event.awayTeam.logo} alt="" className="agenda-team-logo" />
                                      <span className="agenda-team-name">{event.awayTeam.displayName}</span>
                                    </div>
                                    <span className="agenda-vs">@</span>
                                    <div className={`agenda-team ${isHomeWinner ? 'winner' : ''}`}>
                                      <img src={event.homeTeam.logo} alt="" className="agenda-team-logo" />
                                      <span className="agenda-team-name">{event.homeTeam.displayName}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="agenda-event-score-time">
                                <span className={`agenda-score-value ${isLive ? 'live' : ''}`}>{scoreText}</span>
                                {event.tvBroadcasts.length > 0 && (
                                  <div className="agenda-broadcast-icons">
                                    <Tv size={12} />
                                    <span>{event.tvBroadcasts[0]}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            // Calendar Grid View
            <>
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
                              eventTeamsDisplay = `F1: ${event.shortName.replace(' Grand Prix', ' GP')}`;
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
            </>
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
                            {driver.logo && (
                              <img src={driver.logo} alt="" style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} />
                            )}
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {driver.name}
                            </span>
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
    </div>
  );
}
