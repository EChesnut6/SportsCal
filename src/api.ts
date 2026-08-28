import type { League, GameEvent } from './types';

const LEAGUE_MAP: Record<League, { sport: string; key: string } | null> = {
  nfl: { sport: 'football', key: 'nfl' },
  nba: { sport: 'basketball', key: 'nba' },
  mlb: { sport: 'baseball', key: 'mlb' },
  nhl: { sport: 'hockey', key: 'nhl' },
  ncaaf: { sport: 'football', key: 'college-football' },
  ncaab: { sport: 'basketball', key: 'mens-college-basketball' },
  mls: { sport: 'soccer', key: 'usa.1' },
  f1: { sport: 'racing', key: 'f1' },
  ufc: { sport: 'mma', key: 'ufc' },
  worldcup: { sport: 'soccer', key: 'fifa.world' },
  olympics: null,
  epl: { sport: 'soccer', key: 'eng.1' },
  laliga: { sport: 'soccer', key: 'esp.1' },
  champions: { sport: 'soccer', key: 'uefa.champions' },
};

const ESPN_CONFERENCE_MAP: Record<string, string> = {
  // FBS Power & Major Conferences
  '1': 'ACC',
  '4': 'Big 12',
  '5': 'Big Ten',
  '8': 'SEC',
  '9': 'Big Ten',
  '12': 'Pac-12',
  
  // Basketball Major
  '10': 'Big East',

  // FBS Group of 5
  '15': 'MAC', // Mid-American Conference (Miami OH, Ohio, Toledo, etc.)
  '17': 'Mountain West',
  '18': 'C-USA',
  '37': 'Sun Belt',
  '151': 'AAC',

  // Independents
  '184': 'Independent',

  // FCS Conferences -> all mapped directly to 'FCS'
  '20': 'FCS', // Big Sky
  '21': 'FCS', // Missouri Valley
  '22': 'FCS', // Ivy League
  '23': 'FCS', // CAA / Coastal Athletic
  '24': 'FCS', // MEAC
  '25': 'FCS', // Southland / NEC
  '26': 'FCS', // SWAC
  '27': 'FCS', // MEAC
  '28': 'FCS', // NEC
  '29': 'FCS', // SoCon / WCC
  '30': 'FCS', // Pioneer
  '31': 'FCS', // UAC
  '32': 'FCS', // Patriot
  '33': 'FCS', // Big South / OVC
  '48': 'FCS', // Division II / Non-FBS
  '62': 'FCS', // SWAC
  '81': 'FCS', // FCS Subdivision
  '179': 'FCS', // FCS Division
};

const resolveEspnConference = (teamObj: any): string | undefined => {
  const confId = String(teamObj?.conferenceId || teamObj?.groups?.id || teamObj?.conference?.id || '');
  if (confId && ESPN_CONFERENCE_MAP[confId]) {
    return ESPN_CONFERENCE_MAP[confId];
  }
  return undefined;
};

// In-memory cache for scoreboard fetches
const scoreboardCache: Record<string, { timestamp: number; data: GameEvent[] }> = {};
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes for scoreboard data

/**
 * Fetch all events (games) for a given league in a date range (YYYYMMDD-YYYYMMDD).
 */
export async function fetchScoreboard(
  league: League,
  startDate: string,
  endDate: string
): Promise<GameEvent[]> {
  const cacheKey = `${league}_${startDate}_${endDate}`;
  const now = Date.now();
  
  if (scoreboardCache[cacheKey] && now - scoreboardCache[cacheKey].timestamp < CACHE_TTL) {
    return scoreboardCache[cacheKey].data;
  }

  if (league === 'olympics') {
    const subLeagues: { sport: string; key: string }[] = [
      { sport: 'basketball', key: 'mens-olympics-basketball' },
      { sport: 'basketball', key: 'womens-olympics-basketball' },
      { sport: 'soccer', key: 'fifa.olympics' },
      { sport: 'soccer', key: 'fifa.w.olympics' },
    ];
    
    try {
      const results = await Promise.all(
        subLeagues.map(async ({ sport, key }) => {
          const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${key}/scoreboard?dates=${startDate}-${endDate}&limit=100`;
          try {
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return data.events || [];
          } catch (e) {
            console.error(`Failed to fetch Olympics sub-league ${key}:`, e);
            return [];
          }
        })
      );
      
      const rawEvents = results.flat();
      const events: GameEvent[] = rawEvents.map((event: any) => {
        const comp = event.competitions?.[0] || {};
        const competitors = comp.competitors || [];
        const home = competitors.find((c: any) => c.homeAway === 'home') || {};
        const away = competitors.find((c: any) => c.homeAway === 'away') || {};

        const tvBroadcasts = comp.broadcasts?.flatMap((b: any) => b.names || []) || [];
        const espnLink = event.links?.find((l: any) => l.rel?.includes('desktop'))?.href || event.links?.[0]?.href || 'https://www.espn.com';

        let eventName = event.name;
        if (event.links?.[0]?.href?.includes('basketball')) {
          eventName = `[Olympics Basketball] ${event.name}`;
        } else if (event.links?.[0]?.href?.includes('soccer')) {
          eventName = `[Olympics Soccer] ${event.name}`;
        }

        return {
          id: event.id,
          date: event.date,
          name: eventName,
          shortName: event.shortName || event.name,
          league,
          status: {
            state: event.status?.type?.state || 'pre',
            completed: event.status?.type?.completed || false,
            detail: event.status?.type?.detail || '',
            period: event.status?.period,
            displayClock: event.status?.displayClock,
          },
          homeTeam: {
            id: `${league}-${home.team?.id || ''}`,
            displayName: home.team?.displayName || 'Home Team',
            abbreviation: home.team?.abbreviation || 'HOME',
            logo: home.team?.logo || home.team?.logos?.[0]?.href || 'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png',
            color: home.team?.color || '4b5563',
            score: home.score || '0',
            winner: home.winner,
          },
          awayTeam: {
            id: `${league}-${away.team?.id || ''}`,
            displayName: away.team?.displayName || 'Away Team',
            abbreviation: away.team?.abbreviation || 'AWAY',
            logo: away.team?.logo || away.team?.logos?.[0]?.href || 'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png',
            color: away.team?.color || '4b5563',
            score: away.score || '0',
            winner: away.winner,
          },
          tvBroadcasts,
          espnLink,
          venue: comp.venue?.fullName,
        };
      });

      // Cache the result
      scoreboardCache[cacheKey] = {
        timestamp: now,
        data: events,
      };

      return events;
    } catch (error) {
      console.error(`Failed to fetch Olympics scoreboards (${startDate}-${endDate}):`, error);
      return [];
    }
  }

  const leagueConfig = LEAGUE_MAP[league];
  if (!leagueConfig) return [];
  const { sport, key } = leagueConfig;
  // Increase limit for MLB and other dense leagues
  const limit = league === 'mlb' ? 1000 : 500;
  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${key}/scoreboard?dates=${startDate}-${endDate}&limit=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    
const F1_COUNTRY_MAP: Record<string, string> = {
  'australia': 'aus', 'australian': 'aus', 'melbourne': 'aus',
  'china': 'chn', 'chinese': 'chn', 'shanghai': 'chn',
  'japan': 'jpn', 'japanese': 'jpn', 'suzuka': 'jpn',
  'bahrain': 'brn', 'bahraini': 'brn', 'sakhir': 'brn',
  'saudi': 'ksa', 'jeddah': 'ksa',
  'united states': 'usa', 'american': 'usa', 'usa': 'usa', 'miami': 'usa', 'austin': 'usa', 'las vegas': 'usa',
  'italy': 'ita', 'italian': 'ita', 'imola': 'ita', 'monza': 'ita',
  'monaco': 'mon', 'monte carlo': 'mon',
  'spain': 'esp', 'spanish': 'esp', 'barcelona': 'esp', 'madrid': 'esp',
  'canada': 'can', 'canadian': 'can', 'montreal': 'can',
  'austria': 'aut', 'austrian': 'aut', 'spielberg': 'aut',
  'great britain': 'gbr', 'british': 'gbr', 'united kingdom': 'gbr', 'uk': 'gbr', 'silverstone': 'gbr',
  'hungary': 'hun', 'hungarian': 'hun', 'budapest': 'hun',
  'belgium': 'bel', 'belgian': 'bel', 'spa': 'bel',
  'netherlands': 'ned', 'dutch': 'ned', 'zandvoort': 'ned',
  'azerbaijan': 'aze', 'baku': 'aze',
  'singapore': 'sgp',
  'mexico': 'mex', 'mexican': 'mex',
  'brazil': 'bra', 'brazilian': 'bra', 'sao paulo': 'bra', 'interlagos': 'bra',
  'qatar': 'qat',
  'united arab emirates': 'uae', 'uae': 'uae', 'abu dhabi': 'uae'
};

const resolveF1CountryFlag = (locationStr: string): string => {
  const clean = (locationStr || '').toLowerCase();
  for (const [key, code] of Object.entries(F1_COUNTRY_MAP)) {
    if (clean.includes(key)) {
      return `https://a.espncdn.com/i/teamlogos/countries/500/${code}.png`;
    }
  }
  return '';
};

const F1_DRIVER_TEAMS_MAP: Record<string, { teamName: string; teamColor: string }> = {
  // Ferrari (Hamilton + Leclerc)
  'leclerc': { teamName: 'Ferrari', teamColor: '#DC0000' },
  'c. leclerc': { teamName: 'Ferrari', teamColor: '#DC0000' },
  'hamilton': { teamName: 'Ferrari', teamColor: '#DC0000' },
  'l. hamilton': { teamName: 'Ferrari', teamColor: '#DC0000' },
  'beganovic': { teamName: 'Ferrari', teamColor: '#DC0000' },

  // McLaren (Norris + Piastri)
  'norris': { teamName: 'McLaren', teamColor: '#FF8700' },
  'l. norris': { teamName: 'McLaren', teamColor: '#FF8700' },
  'piastri': { teamName: 'McLaren', teamColor: '#FF8700' },
  'o. piastri': { teamName: 'McLaren', teamColor: '#FF8700' },
  'hirakawa': { teamName: 'McLaren', teamColor: '#FF8700' },

  // Red Bull Racing (Verstappen + Lawson + Lindblad)
  'verstappen': { teamName: 'Red Bull', teamColor: '#00327D' },
  'm. verstappen': { teamName: 'Red Bull', teamColor: '#00327D' },
  'lindblad': { teamName: 'Red Bull', teamColor: '#00327D' },

  // Mercedes (Russell + Antonelli)
  'russell': { teamName: 'Mercedes', teamColor: '#00D2BE' },
  'g. russell': { teamName: 'Mercedes', teamColor: '#00D2BE' },
  'antonelli': { teamName: 'Mercedes', teamColor: '#00D2BE' },
  'k. antonelli': { teamName: 'Mercedes', teamColor: '#00D2BE' },
  'vesti': { teamName: 'Mercedes', teamColor: '#00D2BE' },

  // Aston Martin (Alonso + Stroll + Crawford)
  'alonso': { teamName: 'Aston Martin', teamColor: '#006F62' },
  'f. alonso': { teamName: 'Aston Martin', teamColor: '#006F62' },
  'stroll': { teamName: 'Aston Martin', teamColor: '#006F62' },
  'l. stroll': { teamName: 'Aston Martin', teamColor: '#006F62' },
  'crawford': { teamName: 'Aston Martin', teamColor: '#006F62' },

  // Williams (Sainz + Albon)
  'sainz': { teamName: 'Williams', teamColor: '#64C4FF' },
  'c. sainz': { teamName: 'Williams', teamColor: '#64C4FF' },
  'albon': { teamName: 'Williams', teamColor: '#64C4FF' },
  'a. albon': { teamName: 'Williams', teamColor: '#64C4FF' },
  'browning': { teamName: 'Williams', teamColor: '#64C4FF' },

  // Alpine (Gasly + Colapinto + Aron)
  'gasly': { teamName: 'Alpine', teamColor: '#0093CC' },
  'p. gasly': { teamName: 'Alpine', teamColor: '#0093CC' },
  'colapinto': { teamName: 'Alpine', teamColor: '#0093CC' },
  'f. colapinto': { teamName: 'Alpine', teamColor: '#0093CC' },
  'aron': { teamName: 'Alpine', teamColor: '#0093CC' },
  'doohan': { teamName: 'Alpine', teamColor: '#0093CC' },

  // Haas (Ocon + Bearman)
  'ocon': { teamName: 'Haas', teamColor: '#E6002B' },
  'e. ocon': { teamName: 'Haas', teamColor: '#E6002B' },
  'bearman': { teamName: 'Haas', teamColor: '#E6002B' },
  'o. bearman': { teamName: 'Haas', teamColor: '#E6002B' },
  'magnussen': { teamName: 'Haas', teamColor: '#E6002B' },

  // Racing Bulls / RB (Tsunoda + Lawson + Hadjar + Iwasa)
  'tsunoda': { teamName: 'RB', teamColor: '#6692FF' },
  'y. tsunoda': { teamName: 'RB', teamColor: '#6692FF' },
  'lawson': { teamName: 'RB', teamColor: '#6692FF' },
  'l. lawson': { teamName: 'RB', teamColor: '#6692FF' },
  'hadjar': { teamName: 'RB', teamColor: '#6692FF' },
  'i. hadjar': { teamName: 'RB', teamColor: '#6692FF' },
  'iwasa': { teamName: 'RB', teamColor: '#6692FF' },
  'ricciardo': { teamName: 'RB', teamColor: '#6692FF' },

  // Audi (Hülkenberg + Bortoleto + Bottas + Zhou)
  'hulkenberg': { teamName: 'Audi', teamColor: '#FF2D00' },
  'hülkenberg': { teamName: 'Audi', teamColor: '#FF2D00' },
  'n. hulkenberg': { teamName: 'Audi', teamColor: '#FF2D00' },
  'bortoleto': { teamName: 'Audi', teamColor: '#FF2D00' },
  'g. bortoleto': { teamName: 'Audi', teamColor: '#FF2D00' },
  // 'bottas': { teamName: 'Audi', teamColor: '#FF2D00' },
  'zhou': { teamName: 'Audi', teamColor: '#FF2D00' },

  // Cadillac F1 (Pérez + Herta + Fornaroli)
  'pérez': { teamName: 'Cadillac', teamColor: '#A2AAAD' },
  'perez': { teamName: 'Cadillac', teamColor: '#A2AAAD' },
  'botta': { teamName: 'Cadillac', teamColor: '#A2AAAD' },
  's. perez': { teamName: 'Cadillac', teamColor: '#A2AAAD' },
  'herta': { teamName: 'Cadillac', teamColor: '#A2AAAD' },
  'fornaroli': { teamName: 'Cadillac', teamColor: '#A2AAAD' },
};

const resolveF1DriverTeam = (driverName: string): { teamName: string; teamColor: string } => {
  const clean = (driverName || '').toLowerCase();
  for (const [key, info] of Object.entries(F1_DRIVER_TEAMS_MAP)) {
    if (clean.includes(key)) return info;
  }
  return { teamName: '', teamColor: '#e10600' };
};

    const rawEvents = data.events || [];
    const f1LogoFromApi = data.leagues?.[0]?.logos?.[0]?.href || 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/f1.png';
    const events: GameEvent[] = [];

    for (const event of rawEvents) {
      if (league === 'f1') {
        const competitions = event.competitions || [];
        for (const comp of competitions) {
          const sessionType = comp.type?.abbreviation || 'Race';
          const sessionDate = comp.date || event.date;
          
          const tvBroadcasts = comp.broadcasts?.flatMap((b: any) => b.names || []) || [];
          const espnLink = event.links?.find((l: any) => l.rel?.includes('desktop'))?.href || event.links?.[0]?.href || 'https://www.espn.com';
          
          const circuitLocation = `${event.name} ${event.circuit?.name || ''} ${event.circuit?.address?.country || ''} ${event.circuit?.address?.city || ''}`;
          const f1HostFlag = resolveF1CountryFlag(circuitLocation);

          const parsedCompetitors = (comp.competitors || []).map((c: any) => {
            const driverName = c.athlete?.displayName || c.athlete?.fullName || 'Driver';
            const flagUrl = c.athlete?.flag?.href || '';
            const teamInfo = resolveF1DriverTeam(driverName);

            return {
              id: c.id,
              name: driverName,
              shortName: c.athlete?.shortName || driverName,
              position: c.order || 0,
              winner: c.winner || false,
              logo: flagUrl || f1HostFlag || f1LogoFromApi,
              countryFlag: flagUrl || f1HostFlag,
              teamName: teamInfo.teamName,
              teamColor: teamInfo.teamColor,
            };
          }).sort((a: any, b: any) => a.position - b.position);

          const winnerDriver = parsedCompetitors.find((c: any) => c.winner) || parsedCompetitors[0];

          events.push({
            id: `${event.id}-${sessionType}`,
            date: sessionDate,
            name: `${event.name} - ${sessionType}`,
            shortName: `${event.shortName || event.name} - ${sessionType}`,
            league,
            status: {
              state: comp.status?.type?.state || 'pre',
              completed: comp.status?.type?.completed || false,
              detail: comp.status?.type?.detail || comp.status?.type?.description || '',
              period: comp.status?.period,
              displayClock: comp.status?.displayClock,
            },
            homeTeam: {
              id: `f1-session`,
              displayName: sessionType,
              abbreviation: sessionType,
              logo: f1LogoFromApi,
              color: 'e10600',
              score: winnerDriver ? winnerDriver.shortName : 'F1',
              winner: false,
            },
            awayTeam: {
              id: `f1-league`,
              displayName: 'Formula 1',
              abbreviation: 'F1',
              logo: f1LogoFromApi,
              color: 'e10600',
              score: '',
              winner: false,
            },
            tvBroadcasts,
            espnLink,
            venue: event.circuit?.name || comp.venue?.fullName,
            f1SessionType: sessionType,
            f1CountryFlag: f1HostFlag,
            f1Competitors: parsedCompetitors,
          });
        }
      } else if (league === 'ufc') {
        const competitions = event.competitions || [];
        const mainEventComp = competitions[competitions.length - 1]; // Main event is last fight
        const comp1 = mainEventComp?.competitors?.[0];
        const comp2 = mainEventComp?.competitors?.[1];
        
        const tvBroadcasts = mainEventComp?.broadcasts?.flatMap((b: any) => b.names || []) || [];
        const espnLink = event.links?.find((l: any) => l.rel?.includes('desktop'))?.href || event.links?.[0]?.href || 'https://www.espn.com';
        
        const parsedFights = competitions.map((c: any) => {
          const f1 = c.competitors?.[0];
          const f2 = c.competitors?.[1];
          return {
            id: c.id,
            name: `${f1?.athlete?.displayName || 'Fighter'} vs ${f2?.athlete?.displayName || 'Fighter'}`,
            status: c.status?.type?.detail || c.status?.type?.description || '',
            competitors: [
              {
                id: f1?.id || '',
                displayName: f1?.athlete?.displayName || 'Fighter',
                logo: f1?.athlete?.flag?.href || 'https://a.espncdn.com/i/teamlogos/mma/500/ufc.png',
                winner: f1?.winner,
                score: f1?.winner ? 'W' : (f1?.winner === false ? 'L' : '')
              },
              {
                id: f2?.id || '',
                displayName: f2?.athlete?.displayName || 'Fighter',
                logo: f2?.athlete?.flag?.href || 'https://a.espncdn.com/i/teamlogos/mma/500/ufc.png',
                winner: f2?.winner,
                score: f2?.winner ? 'W' : (f2?.winner === false ? 'L' : '')
              }
            ]
          };
        });

        events.push({
          id: event.id,
          date: event.date,
          name: event.name,
          shortName: event.shortName || event.name,
          league,
          status: {
            state: event.status?.type?.state || 'pre',
            completed: event.status?.type?.completed || false,
            detail: event.status?.type?.detail || '',
          },
          homeTeam: {
            id: comp1 ? `ufc-${comp1.id}` : 'ufc-home',
            displayName: comp1?.athlete?.displayName || 'Fighter 1',
            abbreviation: comp1?.athlete?.shortName || comp1?.athlete?.displayName || 'FTR',
            logo: comp1?.athlete?.flag?.href || 'https://a.espncdn.com/i/teamlogos/mma/500/ufc.png',
            color: '1e293b',
            score: comp1?.winner ? 'W' : (comp1?.winner === false ? 'L' : ''),
            winner: comp1?.winner,
          },
          awayTeam: {
            id: comp2 ? `ufc-${comp2.id}` : 'ufc-away',
            displayName: comp2?.athlete?.displayName || 'Fighter 2',
            abbreviation: comp2?.athlete?.shortName || comp2?.athlete?.displayName || 'FTR',
            logo: comp2?.athlete?.flag?.href || 'https://a.espncdn.com/i/teamlogos/mma/500/ufc.png',
            color: '1e293b',
            score: comp2?.winner ? 'W' : (comp2?.winner === false ? 'L' : ''),
            winner: comp2?.winner,
          },
          tvBroadcasts,
          espnLink,
          venue: mainEventComp?.venue?.fullName || event.venues?.[0]?.fullName,
          ufcFights: parsedFights,
        });
      } else {
        const comp = event.competitions?.[0] || {};
        const competitors = comp.competitors || [];
        const home = competitors.find((c: any) => c.homeAway === 'home') || {};
        const away = competitors.find((c: any) => c.homeAway === 'away') || {};

        const tvBroadcasts = comp.broadcasts?.flatMap((b: any) => b.names || []) || [];
        const espnLink = event.links?.find((l: any) => l.rel?.includes('desktop'))?.href || event.links?.[0]?.href || 'https://www.espn.com';
        const homeConf = resolveEspnConference(home.team);
        const awayConf = resolveEspnConference(away.team);

        events.push({
          id: event.id,
          date: event.date,
          name: event.name,
          shortName: event.shortName,
          league,
          status: {
            state: event.status?.type?.state || 'pre',
            completed: event.status?.type?.completed || false,
            detail: event.status?.type?.detail || '',
            period: event.status?.period,
            displayClock: event.status?.displayClock,
          },
          homeTeam: {
            id: `${league}-${home.team?.id || ''}`,
            displayName: home.team?.displayName || 'Home Team',
            abbreviation: home.team?.abbreviation || 'HOME',
            logo: home.team?.logo || home.team?.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/${key}/500/${home.team?.abbreviation?.toLowerCase()}.png`,
            color: home.team?.color || '4b5563',
            score: home.score || '0',
            winner: home.winner,
            conference: homeConf,
          },
          awayTeam: {
            id: `${league}-${away.team?.id || ''}`,
            displayName: away.team?.displayName || 'Away Team',
            abbreviation: away.team?.abbreviation || 'AWAY',
            logo: away.team?.logo || away.team?.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/${key}/500/${away.team?.abbreviation?.toLowerCase()}.png`,
            color: away.team?.color || '4b5563',
            score: away.score || '0',
            winner: away.winner,
            conference: awayConf,
          },
          tvBroadcasts,
          espnLink,
          venue: comp.venue?.fullName,
        });
      }
    }

    // Cache the result
    scoreboardCache[cacheKey] = {
      timestamp: now,
      data: events,
    };

    return events;
  } catch (error) {
    console.error(`Failed to fetch scoreboard for ${league} (${startDate}-${endDate}):`, error);
    return [];
  }
}

