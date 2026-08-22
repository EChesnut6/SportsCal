import fs from 'fs';
import path from 'path';

async function fetchCfbSep12() {
  const dateStr = '20260912'; // September 12th, 2026
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${dateStr}&limit=500`;
  
  console.log(`Fetching raw ESPN CFB scoreboard data from:\n${url}\n`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const testingDir = path.resolve('./testing');

    if (!fs.existsSync(testingDir)) {
      fs.mkdirSync(testingDir, { recursive: true });
    }

    const jsonPath = path.join(testingDir, 'cfb_sep12_raw.json');
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`Successfully saved raw JSON response to:\n${jsonPath}\n`);

    // Print a quick summary of events and competitor team structures
    const events = data.events || [];
    console.log(`Total Events Found on Sep 12th: ${events.length}`);
    console.log('--------------------------------------------------');

    events.slice(0, 10).forEach((event, i) => {
      const comp = event.competitions?.[0] || {};
      const competitors = comp.competitors || [];
      const home = competitors.find(c => c.homeAway === 'home') || {};
      const away = competitors.find(c => c.homeAway === 'away') || {};

      console.log(`[Game ${i + 1}] ${event.name}`);
      console.log(`   ID: ${event.id} | Date: ${event.date}`);
      console.log(`   Away Team: ${away.team?.displayName} (ID: ${away.team?.id}, ConfID: ${away.team?.conferenceId || away.team?.groups?.id || 'N/A'})`);
      console.log(`   Home Team: ${home.team?.displayName} (ID: ${home.team?.id}, ConfID: ${home.team?.conferenceId || home.team?.groups?.id || 'N/A'})`);
      console.log('--------------------------------------------------');
    });

  } catch (err) {
    console.error('Error fetching CFB data:', err);
  }
}

fetchCfbSep12();
