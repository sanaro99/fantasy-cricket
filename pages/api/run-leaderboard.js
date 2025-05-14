// pages/api/run-leaderboard.js
import { createClient } from '@supabase/supabase-js';

// Use the service role key to bypass RLS and write to all tables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // 1) Compute this week's bounds (UTC Sunday to next Sunday)
    const now = new Date();
    const day = now.getUTCDay(); // 0=Sun,1=Mon…
    const lastSun = new Date(now);
    lastSun.setUTCDate(now.getUTCDate() - day);
    lastSun.setUTCHours(0, 0, 0, 0);
    const nextSun = new Date(lastSun);
    nextSun.setUTCDate(lastSun.getUTCDate() + 7);
    const weekStartISO = lastSun.toISOString();
    const weekEndISO = nextSun.toISOString();

    // 2) Fetch this week's selections
    const { data: weeklySel = [] } = await supabase
      .from('player_selections')
      .select('user_id,fixture_id,team_a_ids,team_b_ids')
      .gte('created_at', weekStartISO)
      .lt('created_at', weekEndISO);

    // 3) Fetch ALL selections for league
    const { data: leagueSel = [] } = await supabase
      .from('player_selections')
      .select('user_id,fixture_id,team_a_ids,team_b_ids');

    // 4) Distinct fixture IDs
    const fixtureIds = Array.from(
      new Set([
        ...weeklySel.map(r => r.fixture_id),
        ...leagueSel.map(r => r.fixture_id),
      ])
    );

    const apiToken = process.env.SPORTMONKS_API_TOKEN;
    console.log("apiToken", apiToken);

    // 5) Fetch and map batting data per fixture
    const fixtureBatting = {};
    for (const fid of fixtureIds) {
      // try {
      //   const resp = await fetch(
      //     `https://cricket.sportmonks.com/api/v2.0/fixtures/${fid}?include=batting.batsman&api_token=${process.env.SPORTSMONKS_API_TOKEN}`
      //   );

      try{
      const baseUrl = 'https://cricket.sportmonks.com/api/v2.0/fixtures/'+fid;
      const params = new URLSearchParams({
        'api_token': apiToken,
        'include': 'batting.batsman'
      });
    
      const apiUrl = `${baseUrl}?${params.toString()}`;

      console.log(apiUrl);
      
      // Fetch data from SportMonks
      const response = await fetch(apiUrl);
        if (!response.ok) {
          console.error(`Failed to fetch fixture ${fid}:`, response.statusText);
          fixtureBatting[fid] = {};
          continue;
        }
        const json = await response.json();

        // Extract the actual batting array
        let battingArr = [];
        if (Array.isArray(json.data.batting)) {
          battingArr = json.data.batting;
          console.log(battingArr);
        } else if (
          json.data.batting &&
          Array.isArray(json.data.batting.data)
        ) {
          battingArr = json.data.batting.data;
          console.log("In if condition...");

        }

        // Map player_id -> total runs
        const map = {};
        for (const b of battingArr) {
          if (b && b.player_id != null) {
            const pid = Number(b.player_id);
            const runs = Number(b.score || 0);
            map[pid] = (map[pid] || 0) + runs;
          }
        }
        fixtureBatting[fid] = map;
      } catch (e) {
        console.error(`Error fetching fixture ${fid}:`, e);
        fixtureBatting[fid] = {};
      }
    }

    // Helper: points by runs
    const playerPoints = runs => runs >= 100 ? 150 : runs >= 50 ? 50 : 0;

    // 6) Aggregate scores
    const weeklyScores = {};
    for (const sel of weeklySel) {
      const bats = fixtureBatting[sel.fixture_id] || {};
      let pts = 0;
      const teamA = Array.isArray(sel.team_a_ids) ? sel.team_a_ids : [];
      const teamB = Array.isArray(sel.team_b_ids) ? sel.team_b_ids : [];
      for (const pid of [...teamA, ...teamB]) pts += playerPoints(bats[pid] || 0);
      weeklyScores[sel.user_id] = (weeklyScores[sel.user_id] || 0) + pts;
    }
    const leagueScores = {};
    for (const sel of leagueSel) {
      const bats = fixtureBatting[sel.fixture_id] || {};
      let pts = 0;
      const teamA = Array.isArray(sel.team_a_ids) ? sel.team_a_ids : [];
      const teamB = Array.isArray(sel.team_b_ids) ? sel.team_b_ids : [];
      for (const pid of [...teamA, ...teamB]) pts += playerPoints(bats[pid] || 0);
      leagueScores[sel.user_id] = (leagueScores[sel.user_id] || 0) + pts;
    }

    // 7) Load user names
    const userIds = Array.from(new Set([...Object.keys(weeklyScores), ...Object.keys(leagueScores)]));
    let { data: users = [] } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .in('id', userIds);
    if (users.length === 0) {
      const { data: authUsers = [] } = await supabase
        .from('auth.users')
        .select('id, email')
        .in('id', userIds);
      users = authUsers;
    }

    // 8) Upsert weekly_leaderboard
    const weekStartDate = lastSun.toISOString().slice(0,10);
    const weeklyRows = users.map(u => ({
      week_start:   weekStartDate,
      user_id:      u.id,
      user_name:    u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : (u.email || 'Unknown'),
      weekly_score: weeklyScores[u.id] || 0,
      rank:         null
    }));
    await supabase
      .from('weekly_leaderboard')
      .upsert(weeklyRows, { onConflict: ['week_start','user_id'] });

    // 9) Upsert league_leaderboard
    const leagueRows = users.map(u => ({
      user_id:     u.id,
      user_name:   u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : (u.email || 'Unknown'),
      total_score: leagueScores[u.id] || 0,
      rank:        null
    }));
    await supabase
      .from('league_leaderboard')
      .upsert(leagueRows, { onConflict: ['user_id'] });

    // 10) Debug output for runs
    const debugRuns = {};
    for (const uid of userIds) {
      debugRuns[uid] = [];
      for (const sel of [...weeklySel, ...leagueSel].filter(s => s.user_id === uid)) {
        const map = fixtureBatting[sel.fixture_id] || {};
        for (const pid of [...(sel.team_a_ids||[]), ...(sel.team_b_ids||[])]) {
          debugRuns[uid].push({ fixture_id: sel.fixture_id, player_id: pid, runs: map[pid] || 0 });
        }
      }
    }

    return res.status(200).json({
      success: true,
      fixturesProcessed: fixtureIds.length,
      usersProcessed: userIds.length,
      weeklyRowsInserted: weeklyRows.length,
      leagueRowsUpserted: leagueRows.length,
      debugWeekly: weeklyRows,
      debugLeague: leagueRows,
      debugRuns
    });
  } catch (err) {
    console.error('Error in run-leaderboard:', err);
    return res.status(500).json({ error: err.message });
  }
}
