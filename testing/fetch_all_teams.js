import fs from 'fs';
import path from 'path';

async function fetchAllTeams() {
  console.log('Fetching full team lists from ESPN API...');

  try {
    const cfbUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=1000';
    const cbbUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?limit=1000';

    const [cfbRes, cbbRes] = await Promise.all([fetch(cfbUrl), fetch(cbbUrl)]);

    const cfbData = await cfbRes.json();
    const cbbData = await cbbRes.json();

    const cfbTeams = (cfbData.sports?.[0]?.leagues?.[0]?.teams || []).map(t => t.team);
    const cbbTeams = (cbbData.sports?.[0]?.leagues?.[0]?.teams || []).map(t => t.team);

    // Ensure all D1 teams are included
    const existingCbbIds = new Set(cbbTeams.map(t => String(t.id)));
    const extraCbbIds = ['88', '2511', '2598', '2815'];
    for (const id of extraCbbIds) {
      if (!existingCbbIds.has(id)) {
        try {
          const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${id}`);
          const data = await res.json();
          if (data.team) {
            cbbTeams.push(data.team);
          }
        } catch (e) {
          console.error(`Failed to fetch extra team ${id}:`, e);
        }
      }
    }

    console.log(`Fetched ${cfbTeams.length} CFB Teams and ${cbbTeams.length} CBB Teams from ESPN API.`);

    const testingDir = path.resolve('./testing');
    if (!fs.existsSync(testingDir)) {
      fs.mkdirSync(testingDir, { recursive: true });
    }

    fs.writeFileSync(path.join(testingDir, 'espn_cfb_teams.json'), JSON.stringify(cfbTeams, null, 2));
    fs.writeFileSync(path.join(testingDir, 'espn_cbb_teams.json'), JSON.stringify(cbbTeams, null, 2));

    console.log('Saved espn_cfb_teams.json and espn_cbb_teams.json to testing/');
  } catch (err) {
    console.error('Error fetching teams:', err);
  }
}

fetchAllTeams();
