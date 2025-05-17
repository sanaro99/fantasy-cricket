import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function Matches() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [yesterdayFixtures, setYesterdayFixtures] = useState([]);
  const [todayFixtures, setTodayFixtures] = useState([]);
  const [tomorrowFixtures, setTomorrowFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check authentication on mount
  useEffect(() => {
    let mounted = true;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (!session && mounted) {
          router.replace('/login');
        }
        setCheckingAuth(false);
      } else if (event === 'SIGNED_OUT' && mounted) {
        router.replace('/login');
      }
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [router]);

  // Fetch fixtures from our proxy API
  useEffect(() => {
    if (checkingAuth) return;
    async function fetchFixtures() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch('/api/fixtures');
        const data = await res.json();
        
        if (!data || !data.data) {
          throw new Error('Invalid response format');
        }

        const fixtures = data.data || [];
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const formatDate = (date) => date.toISOString().slice(0, 10);
        
        const yFixtures = fixtures.filter(fixture => 
          new Date(fixture.starting_at).toISOString().slice(0, 10) === formatDate(yesterday)
        );
        
        const tFixtures = fixtures.filter(fixture => 
          new Date(fixture.starting_at).toISOString().slice(0, 10) === formatDate(today)
        );
        
        const tmFixtures = fixtures.filter(fixture => 
          new Date(fixture.starting_at).toISOString().slice(0, 10) === formatDate(tomorrow)
        );

        setYesterdayFixtures(yFixtures);
        setTodayFixtures(tFixtures);
        setTomorrowFixtures(tmFixtures);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFixtures();
  }, [checkingAuth]);

  if (checkingAuth) return null;

    async function fetchFixtures() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch('/api/fixtures');
        const data = await res.json();
        
        if (!data || !data.data) {
          throw new Error('Invalid response format');
        }

        const fixtures = data.data || [];
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const formatDate = (date) => date.toISOString().slice(0, 10);
        
        const yFixtures = fixtures.filter(fixture => 
          new Date(fixture.starting_at).toISOString().slice(0, 10) === formatDate(yesterday)
        );
        
        const tFixtures = fixtures.filter(fixture => 
          new Date(fixture.starting_at).toISOString().slice(0, 10) === formatDate(today)
        );
        
        const tmFixtures = fixtures.filter(fixture => 
          new Date(fixture.starting_at).toISOString().slice(0, 10) === formatDate(tomorrow)
        );

        setYesterdayFixtures(yFixtures);
        setTodayFixtures(tFixtures);
        setTomorrowFixtures(tmFixtures);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    // (no-op: moved fetchFixtures to above, effect now uses [checkingAuth] as dependency)
  // Helper for rendering static fixture cards (yesterday and tomorrow)
  const renderStaticFixtureCard = (fixture) => (
    <div
      key={fixture.id}
      className="bg-black/40 backdrop-blur-md rounded-xl shadow-xl p-6 transform hover:scale-[1.02] transition-transform border border-navy-200/20 mb-6"
    >
      <h2 className="text-lg font-semibold mb-3 text-navy-100 text-shadow-sm">
        {fixture.round || "Match"}
      </h2>
      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <p className="font-bold uppercase text-lg text-white font-medium">
            {fixture.localteam.name}
          </p>
          <div className="mt-3 bg-navy-800/50 w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg">
            <img
              src={fixture.localteam.image_path}
              alt={fixture.localteam.name}
              className="w-12 h-12 object-contain"
            />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-sm text-navy-200 font-medium">Time</p>
          <p className="font-bold text-2xl text-white mt-1">
            {new Date(fixture.starting_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="text-center">
          <p className="font-bold uppercase text-lg text-white font-medium">
            {fixture.visitorteam.name}
          </p>
          <div className="mt-3 bg-navy-800/50 w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg">
            <img
              src={fixture.visitorteam.image_path}
              alt={fixture.visitorteam.name}
              className="w-12 h-12 object-contain"
            />
          </div>
        </div>
      </div>
      {fixture.note && (
        <p className="text-navy-200 mt-3 font-medium">Note: {fixture.note}</p>
      )}
    </div>
  );

  // TodayMatchCard: Handles interactive player selection for today's fixtures
  function TodayMatchCard({ fixture }) {
    const [userSelection, setUserSelection] = useState(null);
    const [loadingSelection, setLoadingSelection] = useState(true);
    const [errorSelection, setErrorSelection] = useState("");
    const [localSquad, setLocalSquad] = useState([]);
    const [visitorSquad, setVisitorSquad] = useState([]);
    // Now hold full player objects for id+name
    const [localSelected, setLocalSelected] = useState([]);
    const [visitorSelected, setVisitorSelected] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [squadLoaded, setSquadLoaded] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLocked, setIsLocked] = useState(new Date() >= new Date(fixture.starting_at));
    const [overrideEnabled, setOverrideEnabled] = useState(false);

    // Fetch current user from Supabase client (no API call)
    useEffect(() => {
      async function fetchUser() {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user || null);
      }
      fetchUser();
    }, []);

    // Check if user already submitted selection for this fixture
    useEffect(() => {
      async function checkUserSelection() {
        if (!currentUser) return;
        try {
          const res = await fetch(`/api/player-selections?user_id=${currentUser.id}&fixture_id=${fixture.id}`);
          if (!res.ok) throw new Error('Error fetching selection');
          const { selection } = await res.json();
          if (selection) setUserSelection(selection);
        } catch (err) {
          setErrorSelection(err.message);
        } finally {
          setLoadingSelection(false);
        }
      }
      checkUserSelection();
    }, [currentUser, fixture.id]);

    // timer to lock at start
    useEffect(() => {
      const now = new Date();
      const startTime = new Date(fixture.starting_at);
      if (now < startTime) {
        const delay = startTime.getTime() - now.getTime();
        const timer = setTimeout(() => setIsLocked(true), delay);
        return () => clearTimeout(timer);
      }
    }, [fixture.starting_at]);

    // fetch manual override status and poll every 1 min
    useEffect(() => {
      async function fetchOverride() {
        try {
          // Fetch the latest lock override status from Supabase
          const { data, error } = await supabase
            .from('selection_lock_override')
            .select('enabled')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
          if (error) throw error;
          if (data && typeof data.enabled === 'boolean') {
            setOverrideEnabled(data.enabled);
          }
        } catch (e) {
          console.error('Error fetching lock override status:', e);
        }
      }
      fetchOverride();
      const interval = setInterval(fetchOverride, 60000);
      return () => clearInterval(interval);
    }, []);

    // Fetch squad info using our proxy /api/squad
    useEffect(() => {
      async function fetchSquads() {
        if (!currentUser) return;  // Wait for currentUser to load
        if (userSelection) return; // Already selected
        try {
          const localRes = await fetch(
            `/api/squad?team_id=${fixture.localteam.id}&season_id=${fixture.season_id}`
          );
          if (!localRes.ok) throw new Error('Failed to fetch local team squad');
          const localData = await localRes.json();
          const ls = localData.data?.squad || [];
          setLocalSquad(ls);

          const visitorRes = await fetch(
            `/api/squad?team_id=${fixture.visitorteam.id}&season_id=${fixture.season_id}`
          );
          if (!visitorRes.ok) throw new Error('Failed to fetch visitor team squad');
          const visitorData = await visitorRes.json();
          const vs = visitorData.data?.squad || [];
          setVisitorSquad(vs);
        } catch (err) {
          console.error("Error fetching squads:", err);
          setErrorSelection(err.message);
        } finally {
          setLoadingSelection(false);
          setSquadLoaded(true);
        }
      }
      fetchSquads();
    }, [currentUser, userSelection, fixture]);

    // Now selecting full player objects
    const handleSelectPlayer = async (team, player) => {
      // refresh override status
      let oe = overrideEnabled;

      if (!oe && isLocked) {
        alert('Match has already started. Selections are closed.');
        return;
      }
      if (team === "local") {
        // Check if player is already selected (for deselection)
        if (localSelected.find(p => p.id === player.id)) {
          // Remove player if already selected (deselect)
          setLocalSelected(prev => prev.filter(p => p.id !== player.id));
        } else if (localSelected.length < 4) {
          // Add player if not at max selection
          setLocalSelected(prev => [...prev, player]);
        }
      } else {
        // Check if player is already selected (for deselection)
        if (visitorSelected.find(p => p.id === player.id)) {
          // Remove player if already selected (deselect)
          setVisitorSelected(prev => prev.filter(p => p.id !== player.id));
        } else if (visitorSelected.length < 4) {
          // Add player if not at max selection
          setVisitorSelected(prev => [...prev, player]);
        }
      }
    };

    // Submit stores ids and names
    const handleSubmitSelection = async () => {
      // refresh override status
      let oe = overrideEnabled;
      try {
        // Fetch the latest lock override status from Supabase
        const { data, error } = await supabase
          .from('selection_lock_override')
          .select('enabled')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        if (error) throw error;
        if (data && typeof data.enabled === 'boolean') {
          oe = data.enabled;
          setOverrideEnabled(data.enabled);
        }
      } catch (e) {
        console.error('Error fetching lock override status:', e);
      }

      if (!oe && isLocked) {
        alert('Match has already started. Selections are closed.');
        return;
      }
      if (localSelected.length !== 4 || visitorSelected.length !== 4) {
        alert("Please select exactly 4 players from each team.");
        return;
      }
      setSubmitting(true);
      try {
        // Get current user from state (already fetched)
        const user = currentUser;
        if (!user) {
          alert("User not authenticated.");
          setSubmitting(false);
          return;
        }
        
        // Extract player IDs and names as arrays for Supabase storage
        // Convert IDs to integers to ensure proper data type
        const teamAIds = localSelected.map(p => parseInt(p.id, 10));
        const teamANames = localSelected.map(p => p.fullname);
        const teamBIds = visitorSelected.map(p => parseInt(p.id, 10));
        const teamBNames = visitorSelected.map(p => p.fullname);

        console.log('Submitting player selection:', {
          fixture_id: fixture.id,
          team_a_ids: teamAIds,
          team_b_ids: teamBIds
        });

        const response = await fetch('/api/submit-selection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            fixture_id: parseInt(fixture.id, 10),
            fixture_starting_at: fixture.starting_at,
            team_a_ids: teamAIds,
            team_a_names: teamANames,
            team_b_ids: teamBIds,
            team_b_names: teamBNames
          })
        });
        const result = await response.json();
        if (!response.ok) {
          alert(result.message || 'Error saving selections.');
        } else {
          alert('Selection submitted successfully!');
          setUserSelection(result.data);
          console.log('Selection saved:', result.data);
        }
      } catch (err) {
        console.error('Error in submission:', err);
        alert('Error saving your selections. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    if (loadingSelection) return <div className="p-4 text-white"><p>Loading selection...</p></div>;
    if (userSelection) {
      // Get player image paths from the squad data if available
      const getPlayerImagePath = (playerName, teamType) => {
        const squad = teamType === 'local' ? localSquad : visitorSquad;
        const player = squad.find(p => p.fullname === playerName);
        return player?.image_path || '/images/player-placeholder.png';
      };
      
      return (
        <div className="p-4 text-white">
          <h3 className="text-xl font-semibold mb-4 text-shadow-sm">Your Selections</h3>
          
          <div className="bg-navy-100/30 backdrop-blur-sm rounded-lg border border-navy-500/20 p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Local Team Selection */}
              <div>
                <h4 className="font-semibold text-[#FFD700] mb-2">{fixture.localteam.name}</h4>
                <div className="flex flex-col space-y-2">
                  {userSelection.team_a_names?.map((playerName, index) => (
                    <div key={index} className="flex items-center bg-navy-500/30 rounded-lg p-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 mr-3">
                        <img 
                          src={getPlayerImagePath(playerName, 'local')} 
                          alt={playerName}
                          className="w-full h-full object-cover"
                          onError={(e) => {e.target.src = '/images/player-placeholder.png'}}
                        />
                      </div>
                      <span className="font-medium">{playerName}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Visitor Team Selection */}
              <div>
                <h4 className="font-semibold text-[#FFD700] mb-2">{fixture.visitorteam.name}</h4>
                <div className="flex flex-col space-y-2">
                  {userSelection.team_b_names?.map((playerName, index) => (
                    <div key={index} className="flex items-center bg-navy-500/30 rounded-lg p-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 mr-3">
                        <img 
                          src={getPlayerImagePath(playerName, 'visitor')} 
                          alt={playerName}
                          className="w-full h-full object-cover"
                          onError={(e) => {e.target.src = '/images/player-placeholder.png'}}
                        />
                      </div>
                      <span className="font-medium">{playerName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <p className="italic text-navy-200 text-center font-medium">Selections are locked for this match.</p>
        </div>
      );
    }
    if (!squadLoaded) return <div className="p-4 text-white"><p>Loading squads...</p></div>;

    return (
      <div className="p-4 text-white">
        <h3 className="text-xl font-semibold mb-4 text-shadow-sm">Select Players for {fixture.round}</h3>
        
        {/* Local Team Section */}
        <div className="mb-4 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
          <SquadSelector 
            teamName={fixture.localteam.name}
            squad={localSquad}
            selectedPlayers={localSelected}
            onSelectPlayer={(player) => handleSelectPlayer('local', player)}
          />
        </div>
        
        {/* Visitor Team Section */}
        <div className="mb-4 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
          <SquadSelector 
            teamName={fixture.visitorteam.name}
            squad={visitorSquad}
            selectedPlayers={visitorSelected}
            onSelectPlayer={(player) => handleSelectPlayer('visitor', player)}
          />
        </div>
        
        {/* Selection Summary */}
        <div className="mb-4 p-4 bg-black/40 backdrop-blur-sm rounded-lg border border-navy-500/20">
          <h4 className="font-semibold text-[#FFD700] mb-2 text-shadow-sm">Your Selections</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-white/80 mb-1 font-medium">{fixture.localteam.name}</p>
              {localSelected.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {localSelected.map(player => (
                    <span key={player.id} className="inline-flex items-center bg-navy-500/50 px-2 py-1 rounded-full text-xs">
                      <img src={player.image_path} alt={player.fullname} className="w-5 h-5 mr-1 rounded-full object-cover" />
                      <span className="font-medium">{player.fullname}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-xs font-medium">No players selected</p>
              )}
            </div>
            <div>
              <p className="text-sm text-white/80 mb-1 font-medium">{fixture.visitorteam.name}</p>
              {visitorSelected.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {visitorSelected.map(player => (
                    <span key={player.id} className="inline-flex items-center bg-navy-500/50 px-2 py-1 rounded-full text-xs">
                      <img src={player.image_path} alt={player.fullname} className="w-5 h-5 mr-1 rounded-full object-cover" />
                      <span className="font-medium">{player.fullname}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-xs font-medium">No players selected</p>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleSubmitSelection}
          disabled={submitting || (!overrideEnabled && isLocked) || localSelected.length !== 4 || visitorSelected.length !== 4}
          className={`mt-4 w-full py-3 rounded-lg transform hover:scale-[1.02] transition-all shadow-lg ${
            localSelected.length === 4 && visitorSelected.length === 4 && (overrideEnabled || !isLocked)
               ? 'bg-gradient-to-r from-navy-600 to-navy-700 text-white hover:from-navy-700 hover:to-navy-800'
               : 'bg-gray-500/50 text-white/70 cursor-not-allowed'
           }`}
        >
          {submitting ? 'Submitting...' : `Submit Selection (${localSelected.length + visitorSelected.length}/8)`}
        </button>
      </div>
    );
  }

  // SquadSelector component for expandable team sections
  function SquadSelector({ teamName, squad, selectedPlayers, onSelectPlayer }) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
      <>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 text-left bg-navy-900/50 hover:bg-navy-900/70 transition-colors"
        >
          <div className="flex items-center">
            <span className="font-semibold text-shadow-sm">{teamName}</span>
            <span className="ml-2 text-sm text-white/70 font-medium">
              {selectedPlayers.length}/4 selected
            </span>
          </div>
          <div className="flex items-center">
            {selectedPlayers.map(player => (
              <div key={player.id} className="w-6 h-6 -ml-2 first:ml-0 rounded-full overflow-hidden border border-white/20">
                <img 
                  src={player.image_path} 
                  alt={player.fullname} 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`w-5 h-5 ml-2 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {isExpanded && (
          <div className="p-4 bg-black/60">
            <div className="flex flex-wrap gap-2">
              {squad.map(player => (
                <button
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all flex items-center ${
                    selectedPlayers.find(p => p.id === player.id)
                      ? 'bg-navy-600 text-white shadow-lg scale-105'
                      : 'bg-navy-400/70 text-navy-100 hover:bg-navy-500/70'
                  } ${selectedPlayers.length >= 4 && !selectedPlayers.find(p => p.id === player.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={selectedPlayers.length >= 4 && !selectedPlayers.find(p => p.id === player.id)} >
                  <img 
                    src={player.image_path} 
                    alt={player.fullname} 
                    className="w-6 h-6 rounded-full mr-1.5 object-cover"
                  />
                  <span className="font-medium">{player.fullname}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen relative font-sans">
      <div className="w-full object-cover relative min-h-[40vh] max-h-[60vh]" style={{marginTop: '-5rem'}}>
        <img
          src="/images/game-banner.png"
          alt="Game banner"
        />
      </div>

      {/* Main Content with bg1 background */}
      <div 
        className="w-full relative min-h-[60vh]" 
        style={{
          backgroundImage: 'url(/images/green-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <main className="relative z-10 container mx-auto px-4 py-6">
          {/* Today's Fixtures - Full Width */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-xl p-6 transform hover:scale-[1.02] transition-transform mb-8">
            <h2 className="text-xl font-semibold text-navy-100 mb-4 text-shadow-sm">Today's Match</h2>
            {todayFixtures.length > 0 
              ? todayFixtures.map(fixture => (
                  <TodayMatchCard key={fixture.id} fixture={fixture} />
                ))
              : <p className="text-white font-medium">No matches found for today.</p>
            }
          </div>
          {/* Selection & Scoring Section */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-xl p-6 mb-8 text-white">
            <h2 className="text-xl font-semibold mb-4 text-shadow-sm">Selection & Scoring</h2>
            <p className="mb-2">Select 4 players from each team (8 total) per match:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Batting: 50 points for half-century (50+ runs), 150 points for century (100+ runs)</li>
              <li>Bowling: 30 points per wicket taken</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
