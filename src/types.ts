export type League = 'nfl' | 'nba' | 'mlb' | 'nhl' | 'ncaaf' | 'ncaab' | 'mls' | 'f1' | 'ufc' | 'worldcup' | 'olympics' | 'epl' | 'laliga' | 'champions';

export interface Team {
  id: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  color: string; // hex color without #
  alternateColor?: string; // hex color without #
  logo: string;
  league: League;
  conference?: string; // e.g. "SEC", "Big Ten", "Big 12", "ACC", "Pac-12", "Big East", "WCC", "Independent", etc.
}

export interface GameStatus {
  state: 'pre' | 'in' | 'post';
  completed: boolean;
  detail: string; // e.g. "Final", "7:30 PM", "3rd - 4:12"
  period?: number;
  displayClock?: string;
}

export interface F1Competitor {
  id: string;
  name: string;
  shortName: string;
  position: number;
  winner: boolean;
  logo?: string;
}

export interface UFCFight {
  id: string;
  name: string;
  status: string;
  competitors: {
    id: string;
    displayName: string;
    logo: string;
    winner?: boolean;
    score?: string;
  }[];
}

export interface GameEvent {
  id: string;
  date: string; // ISO Datetime
  name: string; // e.g. "New York Knicks at San Antonio Spurs"
  shortName: string; // e.g. "NYK @ SAS"
  league: League;
  status: GameStatus;
  homeTeam: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo: string;
    color: string;
    score: string;
    winner?: boolean;
    conference?: string;
  };
  awayTeam: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo: string;
    color: string;
    score: string;
    winner?: boolean;
    conference?: string;
  };
  tvBroadcasts: string[];
  espnLink: string;
  venue?: string;
  // F1 and UFC optional extensions
  f1SessionType?: string;
  f1Competitors?: F1Competitor[];
  ufcFights?: UFCFight[];
}

export interface FavoritesState {
  leagues: League[];
  conferences?: string[]; // Conference IDs, e.g. "ncaaf-SEC"
  teams: string[]; // Team IDs
}

export interface TogglesState {
  leagues: Record<League, boolean>;
  conferences?: Record<string, boolean>; // Conference ID -> boolean
  teams: Record<string, boolean>; // Team ID -> boolean
}


