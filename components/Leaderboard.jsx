import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Pagination from './Pagination';
import Image from 'next/image';

const ITEMS_PER_PAGE = 20;

export default function Leaderboard() {
  // helper to compute week start (UTC Sunday)
  const computeWeekStart = () => {
    const now = new Date();
    const day = now.getUTCDay();
    const lastSun = new Date(now);
    lastSun.setUTCDate(now.getUTCDate() - day);
    lastSun.setUTCHours(0, 0, 0, 0);
    return lastSun.toISOString().slice(0,10);
  };

  // format week range label (Monday – Sunday)
  const formatWeekLabel = ws => {
    const [year, month, day] = ws.split('-').map(Number);
    const sunday = new Date(Date.UTC(year, month - 1, day));
    const monday = new Date(sunday);
    monday.setUTCDate(sunday.getUTCDate() + 1);
    const sundayEnd = new Date(sunday);
    sundayEnd.setUTCDate(sunday.getUTCDate() + 7);
    const options = { day: 'numeric', month: 'long' };
    return `${monday.toLocaleDateString(undefined, options)} - ${sundayEnd.toLocaleDateString(undefined, options)}`;
  };

  const [activeTab, setActiveTab] = useState('weekly');
  const [leagueData, setLeagueData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(computeWeekStart());
  const [weekOptions, setWeekOptions] = useState([]);

  // Pagination state
  const [leaguePage, setLeaguePage] = useState(1);
  const [weeklyPage, setWeeklyPage] = useState(1);

  // initial load: league leaderboard and week options
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      // fetch available week_starts
      const { data: weekStartsRaw } = await supabase
        .from('weekly_leaderboard')
        .select('week_start')
        .order('week_start', { ascending: false });
      const weekStarts = Array.from(new Set((weekStartsRaw || []).map(r => r.week_start)));
      setWeekOptions(weekStarts);
      // fetch league leaderboard
      const { data: leagueRows } = await supabase
        .from('league_leaderboard')
        .select('rank, user_name, total_score')
        .order('total_score', { ascending: false });
      setLeagueData(leagueRows ?? []);
      setLoading(false);
    }
    fetchInitialData();
  }, []);

  // fetch weekly leaderboard when selectedWeek changes
  useEffect(() => {
    async function fetchWeeklyData() {
      setWeeklyLoading(true);
      const { data: weeklyRows } = await supabase
        .from('weekly_leaderboard')
        .select('rank, user_name, weekly_score')
        .eq('week_start', selectedWeek)
        .order('weekly_score', { ascending: false });
      setWeeklyData(weeklyRows ?? []);
      setWeeklyLoading(false);
    }
    fetchWeeklyData();
  }, [selectedWeek]);

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-white text-lg font-medium">Loading leaderboards...</p>
      </div>
    );
  }

  // Calculate pages and slices
  const filteredLeagueData = leagueData.filter(item => 
    item.user_name.toLowerCase().includes(nameFilter.toLowerCase())
  );
  
  const filteredWeeklyData = weeklyData.filter(item => 
    item.user_name.toLowerCase().includes(nameFilter.toLowerCase())
  );
  
  const leagueTotalPages = Math.ceil((filteredLeagueData?.length ?? 0) / ITEMS_PER_PAGE);
  const weeklyTotalPages = Math.ceil((filteredWeeklyData?.length ?? 0) / ITEMS_PER_PAGE);

  const leagueSlice = filteredLeagueData.slice(
    (leaguePage - 1) * ITEMS_PER_PAGE,
    leaguePage * ITEMS_PER_PAGE
  );
  const weeklySlice = filteredWeeklyData.slice(
    (weeklyPage - 1) * ITEMS_PER_PAGE,
    weeklyPage * ITEMS_PER_PAGE
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center">
        {/* Centered and wider leaderboard section */}
        <div className="order-1 max-w-4xl w-full lg:order-2">
          {/* Tabs */}
          <div className="bg-navy-100 backdrop-blur-sm rounded-t-xl overflow-hidden">
            <div className="flex">
              <button
                className={`flex-1 py-4 font-semibold transition-colors duration-200 text-[11px] sm:text-base md:text-lg relative ${
                  activeTab === 'weekly'
                    ? 'bg-navy-600 text-white font-bold shadow-[0_0_15px_rgba(0,0,139,0.7)]'
                    : 'bg-navy-400 text-white/50 hover:text-white hover:bg-navy-500'
                }`}
                onClick={() => setActiveTab('weekly')}
              >
                WEEKLY TOP SCORERS
                {activeTab === 'weekly' && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FFD700]"></div>
                )}
              </button>
              <button
                className={`flex-1 py-4 font-semibold transition-colors duration-200 text-[11px] sm:text-base md:text-lg relative ${
                  activeTab === 'league'
                    ? 'bg-navy-600 text-white font-bold shadow-[0_0_15px_rgba(0,0,139,0.7)]'
                    : 'bg-navy-400 text-white/50 hover:text-white hover:bg-navy-500'
                }`}
                onClick={() => setActiveTab('league')}
              >
                TOP SCORES
                {activeTab === 'league' && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FFD700]"></div>
                )}
              </button>
            </div>
          </div>

          {/* Filter Input */}
          <div className="bg-navy-500 backdrop-blur-sm p-4 border-t-0 border-x border-white/10">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by name..."
                value={nameFilter}
                onChange={(e) => {
                  setNameFilter(e.target.value);
                  setLeaguePage(1); // Reset to first page when filtering
                  setWeeklyPage(1);
                }}
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
              />
              {nameFilter && (
                <button
                  onClick={() => {
                    setNameFilter('');
                    setLeaguePage(1);
                    setWeeklyPage(1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-navy-500 backdrop-blur-sm rounded-b-xl p-6 border-t-0 border border-[#FFD700]/20">
            {activeTab === 'league' ? (
              <div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#FFD700]/20">
                      <th className="px-4 py-3 text-center font-semibold text-lg text-white w-1/4">Points</th>
                      <th className="px-4 py-3 text-left font-semibold text-lg text-white w-3/4">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leagueSlice.map(({ rank, user_name, total_score }, index) => (
                      <tr 
                        key={rank} 
                        className="border-b border-white/10 hover:bg-white/5 transition-colors duration-150"
                      >
                        <td className="px-4 py-4">
                          <div className={`rounded-full h-12 w-12 flex items-center justify-center mx-auto ${index < 3 ? 'bg-[#FFD700]' : 'bg-navy-200'}`}>
                            <span className={`font-bold text-lg ${index < 3 ? 'text-black' : 'text-white'}`}>{total_score}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white font-medium">
                          <div className="bg-white/[0.03] rounded-md px-3 py-1">{user_name}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-6">
                  <Pagination
                    currentPage={leaguePage}
                    totalPages={leagueTotalPages}
                    onPageChange={setLeaguePage}
                  />
                </div>
              </div>
            ) : (
              <div>
                {/* Week selector inside Weekly Top Scorers */}
                <div className="mb-4 flex items-center gap-2">
                  <label htmlFor="weekSelect" className="text-white font-medium">Week:</label>
                  <select
                    id="weekSelect"
                    value={selectedWeek}
                    onChange={(e) => { setSelectedWeek(e.target.value); setWeeklyPage(1); }}
                    className="bg-navy-400 text-white py-2 px-3 rounded-lg"
                  >
                    {weekOptions.map(ws => (
                      <option key={ws} value={ws} className="bg-navy-600">{formatWeekLabel(ws)}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#FFD700]/20">
                        <th className="px-4 py-3 text-center font-semibold text-lg text-white w-1/4">Points</th>
                        <th className="px-4 py-3 text-left font-semibold text-lg text-white w-3/4">Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklySlice.map(({ rank, user_name, weekly_score }, index) => (
                        <tr 
                          key={rank} 
                          className="border-b border-white/10 hover:bg-white/5 transition-colors duration-150"
                        >
                          <td className="px-4 py-4">
                            <div className={`rounded-full h-12 w-12 flex items-center justify-center mx-auto ${index < 3 ? 'bg-[#FFD700]' : 'bg-navy-200'}`}>
                              <span className={`font-bold text-lg ${index < 3 ? 'text-black' : 'text-white'}`}>{weekly_score}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white font-medium">
                            <div className="bg-white/[0.03] rounded-md px-3 py-1">{user_name}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {weeklyLoading && (
                    <>
                      <div className="absolute inset-0 bg-navy-800 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <p className="text-white text-lg font-medium">Loading weekly leaderboard...</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-6">
                  <Pagination
                    currentPage={weeklyPage}
                    totalPages={weeklyTotalPages}
                    onPageChange={setWeeklyPage}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        

      </div>
      {/* flutter animation styling */}
      <style jsx>{`
        .ribbon {
          display: inline-block;
          position: relative;
          clip-path: polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%);
          animation: flutter 3s ease-in-out infinite;
          filter: drop-shadow(0 -6px 6px rgba(255,255,255,0.7)) drop-shadow(0 6px 6px rgba(255,255,255,0.7));
        }
        @keyframes flutter { 0%,100% { transform: skewX(-5deg); } 50% { transform: skewX(5deg); } }
      `}</style>
    </div>
  );
}
