import type { League, Team } from './types';
import { TEAMS_DIRECTORY } from './teamsData';

const TEAM_CACHE_STORAGE_KEY = 'sportscal_team_cache_v2';

// In-memory cache loaded from localStorage
let inMemoryTeamCache: Record<string, Team> = {};

// Load cache from localStorage on module load
function loadTeamCache(): Record<string, Team> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(TEAM_CACHE_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Error reading team cache from localStorage:', err);
  }
  return {};
}

// Save cache to localStorage
function saveTeamCache(cache: Record<string, Team>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TEAM_CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.error('Error saving team cache to localStorage:', err);
  }
}

// Initialize in-memory cache
inMemoryTeamCache = loadTeamCache();

/**
 * Register or update a team in the persistent cache.
 */
export function registerTeam(team: Team): void {
  if (!team || !team.id || !team.league) return;
  
  const existing = inMemoryTeamCache[team.id];
  const isDifferentConf = existing && team.conference && existing.conference !== team.conference;
  const isBetterInfo = !existing || isDifferentConf || (team.conference && team.conference !== 'FCS' && existing.conference === 'FCS');

  if (!existing || isBetterInfo) {
    inMemoryTeamCache[team.id] = {
      ...existing,
      ...team
    };
    saveTeamCache(inMemoryTeamCache);
  }
}

/**
 * Register multiple teams at once.
 */
export function registerTeams(teams: Team[]): void {
  let updated = false;
  teams.forEach(team => {
    if (!team || !team.id || !team.league) return;
    const existing = inMemoryTeamCache[team.id];
    const isDifferentConf = existing && team.conference && existing.conference !== team.conference;
    const isBetterInfo = !existing || isDifferentConf || (team.conference && team.conference !== 'FCS' && existing.conference === 'FCS');

    if (!existing || isBetterInfo) {
      inMemoryTeamCache[team.id] = {
        ...existing,
        ...team
      };
      updated = true;
    }
  });

  if (updated) {
    saveTeamCache(inMemoryTeamCache);
  }
}

/**
 * Lookup a team by exact ID (e.g. 'ncaaf-193' for Miami OH, 'ncaaf-2390' for Miami Hurricanes).
 */
export function getTeamById(id: string): Team | undefined {
  if (inMemoryTeamCache[id]) {
    return inMemoryTeamCache[id];
  }
  
  // Search static directory
  for (const leagueKey in TEAMS_DIRECTORY) {
    const list = TEAMS_DIRECTORY[leagueKey as League] || [];
    const found = list.find(t => t.id === id);
    if (found) return found;
  }

  return undefined;
}

/**
 * Get all known teams for a specific league (combining static TEAMS_DIRECTORY + persistent cached teams).
 */
export function getAllTeamsForLeague(league: League): Team[] {
  const teamMap = new Map<string, Team>();

  // 1. Load static teams from TEAMS_DIRECTORY
  const staticTeams = TEAMS_DIRECTORY[league] || [];
  staticTeams.forEach(t => teamMap.set(t.id, t));

  // 2. Load dynamic teams from persistent cache
  Object.values(inMemoryTeamCache).forEach(t => {
    if (t.league === league && !teamMap.has(t.id)) {
      teamMap.set(t.id, t);
    }
  });

  return Array.from(teamMap.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
}
