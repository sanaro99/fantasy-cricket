// Dummy endpoint to provide leaderboard data

export default async function handler(req, res) {
    if (req.method === 'GET') {
      const dummyWeekly = [
        { id: 1, name: 'User 1', weeklyScore: 120 },
        { id: 2, name: 'User 2', weeklyScore: 110 },
        { id: 3, name: 'User 3', weeklyScore: 90 }
      ];
      const dummyLeague = [
        { id: 1, name: 'User 1', leagueScore: 450 },
        { id: 2, name: 'User 2', leagueScore: 430 },
        { id: 3, name: 'User 3', leagueScore: 400 }
      ];
      res.status(200).json({ weekly: dummyWeekly, league: dummyLeague });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
}