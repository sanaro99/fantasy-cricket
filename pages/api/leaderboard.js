import { createServerSupabaseClient } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient();

  try {
    // Fetch available week_starts for dropdown
    const { data: weekStartsRaw, error: weekError } = await supabase
      .from('weekly_leaderboard')
      .select('week_start')
      .order('week_start', { ascending: false });
    if (weekError) throw weekError;
    const weekOptions = Array.from(new Set((weekStartsRaw || []).map(r => r.week_start)));

    // Fetch league leaderboard
    const { data: leagueRows, error: leagueError } = await supabase
      .from('league_leaderboard')
      .select('rank, user_name, total_score')
      .order('total_score', { ascending: false });
    if (leagueError) throw leagueError;

    // Fetch weekly leaderboard for a given week_start
    const { week_start } = req.query;
    let weeklyRows = [];
    if (week_start) {
      const { data: weekly, error: weeklyError } = await supabase
        .from('weekly_leaderboard')
        .select('rank, user_name, weekly_score')
        .eq('week_start', week_start)
        .order('weekly_score', { ascending: false });
      if (weeklyError) throw weeklyError;
      weeklyRows = weekly;
    }

    res.status(200).json({
      weekOptions,
      league: leagueRows ?? [],
      weekly: weeklyRows ?? [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}