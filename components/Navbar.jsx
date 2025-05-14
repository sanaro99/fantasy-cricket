import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Function to determine if a link is active
  const isActive = (path) => {
  return router.pathname === path
    ? 'text-navy-600 font-bold bg-navy-200'
    : 'text-navy-600 hover:text-navy-800';
};
  
  // Check if current page is login page
  const isLoginPage = router.pathname === '/login';
  
  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  // Close menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMenuOpen(false);
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      setIsMenuOpen(false); // Close menu before logout
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };
  
  // Handle navigation with menu closing
  const handleNavigation = (path) => {
    setIsMenuOpen(false);
    router.push(path);
  };
  
  return (
    <>
      <nav className="w-full bg-navy-100 shadow-lg h-[2.8rem] flex items-center justify-between px-5 z-[999] fixed top-0 left-0 right-0 border-b-2 border-[#FFD700]">
        <div className="w-20 h-[2rem] relative">
          <Image
            src="/images/logo.png"
            alt="VS logo"
            layout="fill"
            objectFit="contain"
          />
        </div>
        
        <div className="flex items-center text-navy-600">
          {!isLoginPage && (
            <div className="hidden md:flex items-center space-x-6 mr-6">
              <Link href="/matches">
  <span className={`${isActive('/matches')} ml-2 px-4 py-1 rounded-full bg-[#FFD700] text-navy-600 font-bold shadow-md hover:bg-navy-400 hover:text-white transition-all duration-200 cursor-pointer border-2 border-navy-600`}>
    Matches
  </span>
</Link>
              <Link href="/leaderboard">
  <span className={`${isActive('/leaderboard')} ml-2 px-4 py-1 rounded-full bg-[#FFD700] text-navy-600 font-bold shadow-md hover:bg-navy-400 hover:text-white transition-all duration-200 cursor-pointer border-2 border-navy-600`}>
    Leaderboard
  </span>
</Link>
              <Link href="/rules">
  <span className={`${isActive('/rules')} ml-2 px-4 py-1 rounded-full bg-[#FFD700] text-navy-600 font-bold shadow-md hover:bg-navy-400 hover:text-white transition-all duration-200 cursor-pointer border-2 border-navy-600`}>
    Rules
  </span>
</Link>
              <span 
  className="ml-4 px-4 py-1 text-navy-600 font-semibold hover:text-navy-400 transition-colors duration-200 cursor-pointer"
  onClick={handleLogout}
>
  Logout
</span>
            </div>
          )}
          
          {/* Mobile menu button - Only show on non-login pages and on mobile */}
          {!isLoginPage && (
            <button 
              className="md:hidden mr-4 text-navy-600 focus:outline-none"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </nav>
      
      {/* Mobile dropdown menu */}
      {!isLoginPage && isMenuOpen && (
        <div className="md:hidden fixed top-[2.8rem] left-0 right-0 bg-white z-[998] shadow-md">
          <div className="flex flex-col py-2">
            <span 
  className={`${isActive('/matches')} block my-1 mx-3 px-4 py-2 rounded-full bg-[#FFD700] text-navy-600 font-bold shadow-md hover:bg-navy-400 hover:text-white transition-all duration-200 cursor-pointer border-2 border-navy-600`}
  onClick={() => handleNavigation('/matches')}
>
  Matches
</span>
            <span 
  className={`${isActive('/leaderboard')} block my-1 mx-3 px-4 py-2 rounded-full bg-[#FFD700] text-navy-600 font-bold shadow-md hover:bg-navy-400 hover:text-white transition-all duration-200 cursor-pointer border-2 border-navy-600`}
  onClick={() => handleNavigation('/leaderboard')}
>
  Leaderboard
</span>
            <span 
  className={`${isActive('/rules')} block my-1 mx-3 px-4 py-2 rounded-full bg-[#FFD700] text-navy-600 font-bold shadow-md hover:bg-navy-400 hover:text-white transition-all duration-200 cursor-pointer border-2 border-navy-600`}
  onClick={() => handleNavigation('/rules')}
>
  Rules
</span>

            <span 
  className="block px-5 py-2 text-navy-300 font-semibold hover:text-navy-400 transition-colors duration-200 cursor-pointer"
  onClick={handleLogout}
>
  Logout
</span>
          </div>
        </div>
      )}
    </>
  );
}
