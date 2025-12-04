import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX } from 'react-icons/hi';
import { useAuth } from "../context/AuthContext";

// Modern orbit-style logo SVG
const OrbitLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" stroke="url(#gradient1)" strokeWidth="2" opacity="0.6" />
    <circle cx="20" cy="20" r="12" stroke="url(#gradient2)" strokeWidth="1.5" opacity="0.4" />
    <circle cx="20" cy="20" r="6" fill="url(#gradient3)" />
    <circle cx="20" cy="4" r="3" fill="#7d3cff">
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 20 20"
        to="360 20 20"
        dur="20s"
        repeatCount="indefinite"
      />
    </circle>
    <defs>
      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7d3cff" />
        <stop offset="100%" stopColor="#00c6ff" />
      </linearGradient>
      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00c6ff" />
        <stop offset="100%" stopColor="#7d3cff" />
      </linearGradient>
      <radialGradient id="gradient3">
        <stop offset="0%" stopColor="#7d3cff" />
        <stop offset="100%" stopColor="#00c6ff" />
      </radialGradient>
    </defs>
  </svg>
);

const routes = [
  { to: '/', label: 'Home' },
  { to: '/satellites', label: 'Satellites' },
  { to: '/map', label: 'Map' },
  { to: '/disaster-support', label: 'Disaster' },
  { to: '/health', label: 'Health' },
  { to: '/self-reliance', label: 'Self-Reliance' },
  { to: '/learn', label: 'Learning' },
  { to: '/about', label: 'About' },
  { to: '/feedback', label: 'Feedback' },
];

// Public pages where logout button should NOT appear
const publicRoutes = ["/login", "/signup"];

const NavBar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActiveRoute = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.header
      className="sticky top-0 z-50 bg-white/10 backdrop-blur-3xl border-b border-white/10 h-20"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-full">

          {/* LOGO */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-3"
          >
            <NavLink to="/" className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.3 }}
              >
                <OrbitLogo />
              </motion.div>
              <span className="text-base font-semibold tracking-tight text-white">
                Swadeshi Space Innovation
              </span>
            </NavLink>
          </motion.div>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden lg:flex items-center gap-8">
            {isAuthenticated && routes.map((route) => {
              const isActive = isActiveRoute(route.to);

              return (
                <NavLink key={route.to} to={route.to} className="relative px-2 py-1">
                  <motion.span
                    className={`text-base font-medium tracking-tight transition-all duration-150 ${
                      isActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
                    }`}
                    whileHover={{ scale: 1.03 }}
                  >
                    {route.label}
                  </motion.span>

                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                      layoutId="nav-active-indicator"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-4">

            {/* LOGOUT BUTTON (Desktop) */}
            {isAuthenticated && !publicRoutes.includes(location.pathname) && (
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg transition-all"
              >
                Logout
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <motion.div
                animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.25 }}
              >
                {mobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
              </motion.div>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="lg:hidden border-t border-white/10 bg-white/10 backdrop-blur-2xl rounded-2xl mx-4 mb-4 shadow-xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <nav className="py-6 px-4 space-y-2">

              {/* Mobile Links */}
              {isAuthenticated && routes.map((route, index) => {
                const isActive = isActiveRoute(route.to);

                return (
                  <motion.div
                    key={route.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <NavLink
                      to={route.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white/10 text-white font-semibold border border-white/20'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {route.label}
                    </NavLink>
                  </motion.div>
                );
              })}

              {/* Mobile Logout Button */}
              {isAuthenticated && !publicRoutes.includes(location.pathname) && (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 font-medium mt-3"
                >
                  Logout
                </button>
              )}

            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default NavBar;
