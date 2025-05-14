import Head from 'next/head';
import Navbar from '../components/Navbar';
import Image from 'next/image';

export default function Rules() {
  return (
    <>
      <Head>
        <title>Rules | Fantasy Cricket</title>
        <meta name="description" content="Rules and scoring system for Fantasy Cricket" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Navbar />
      
      <div className="min-h-screen relative pt-[2.8rem]">
        {/* Main Content with bg1 background */}
        <div 
          className="relative min-h-screen" 
          style={{
            backgroundImage: 'url(/images/green-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <main className="relative z-10 container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              {/* Rules Card */}
              <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-xl p-8 border border-navy-200/20">
                <h1 className="text-4xl font-bold text-[#FFD700] mb-8 text-center text-shadow-sm">Rules & Scoring</h1>
                
                {/* How to Play Section */}
                <div className="mb-12">
                  <h2 className="text-[#FFD700] text-2xl font-bold mb-6 inline-block bg-black/50 px-6 py-2 rounded-lg text-shadow-sm">
                    Getting Started
                  </h2>
                  <ul className="space-y-4 text-white">
                    <li className="flex items-start space-x-3">
                      <span className="text-[#FFD700] text-xl">•</span>
                      <span className="font-medium">Jump in before each match and lock in your predictions for the day.</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-[#FFD700] text-xl">•</span>
                      <span className="font-medium">Choose two standout batsmen from each side who you believe will shine on the batting field.</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-[#FFD700] text-xl">•</span>
                      <span className="font-medium">Once you’re happy with your picks, hit submit to lock them in—no going back!</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-[#FFD700] text-xl">•</span>
                      <span className="font-medium">Remember, after submission, your choices are final for that match.</span>
                    </li>
                  </ul>
                </div>
                
                {/* Score Points Section */}
                <div className="mb-12">
                  <h2 className="text-[#FFD700] text-2xl font-bold mb-6 inline-block bg-black/50 px-6 py-2 rounded-lg text-shadow-sm">
                    Scoring System
                  </h2>
                  <ul className="space-y-4 text-white">
                    <li className="flex items-start space-x-3">
                      <span className="text-[#FFD700] text-xl">•</span>
                      <span className="font-medium">Rack up points as your chosen players rack up runs and achievements during the game.</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-[#FFD700] text-xl">•</span>
                      <span className="font-medium">Snag 100 points every time one of your picks notches up a half-century (50 runs) in a match.</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-[#FFD700] text-xl">•</span>
                      <span className="font-medium">If your chosen star batsman hits a century (100 runs), you’ll bag a whopping 200 points!</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-[#FFD700] text-xl">•</span>
                      <span className="font-medium">Watch your score climb after every match—check the Leaderboard to see where you stand!</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Footnote about upcoming scoring rules */}
            <div className="max-w-4xl mx-auto mt-8">
              <div className="text-center text-[#FFD700] text-base italic bg-black/50 rounded-lg px-6 py-4 shadow-md border border-[#FFD700]/30">
                Note: Additional scoring rules and features will be introduced soon! Stay tuned for updates.
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
