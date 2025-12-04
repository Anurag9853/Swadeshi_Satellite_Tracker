import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import CosmicBackground from "./components/ui/CosmicBackground";
import PrivateRoute from "./components/PrivateRoute";

// pages
import Home from "./pages/Home";
import SatelliteList from "./pages/SatelliteList";
import SatelliteDetails from "./pages/SatelliteDetails";
import MapView from "./pages/MapView";
import About from "./pages/About";
import Feedback from "./pages/Feedback";
import DisasterSupport from "./pages/DisasterSupport";
import HealthDashboard from "./pages/HealthDashboard";
import SelfReliance from "./pages/SelfReliance";
import LearningHub from "./pages/learn/LearningHub";
import Orbits from "./pages/learn/Orbits";
import LaunchVehicles from "./pages/learn/LaunchVehicles";
import Gaganyaan from "./pages/learn/Gaganyaan";
import ISROHistory from "./pages/learn/ISROHistory";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  const location = useLocation();

  return (
    <CosmicBackground>
      <div className="min-h-screen text-white flex flex-col relative">
        <NavBar />

        <main className="flex-1 w-full relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <Routes location={location}>

                {/* Public */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Home />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/satellites"
                  element={
                    <PrivateRoute>
                      <SatelliteList />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/satellites/:id"
                  element={
                    <PrivateRoute>
                      <SatelliteDetails />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/map"
                  element={
                    <PrivateRoute>
                      <MapView />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/disaster-support"
                  element={
                    <PrivateRoute>
                      <DisasterSupport />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/health"
                  element={
                    <PrivateRoute>
                      <HealthDashboard />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/self-reliance"
                  element={
                    <PrivateRoute>
                      <SelfReliance />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/learn"
                  element={
                    <PrivateRoute>
                      <LearningHub />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/learn/orbits"
                  element={
                    <PrivateRoute>
                      <Orbits />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/learn/launchers"
                  element={
                    <PrivateRoute>
                      <LaunchVehicles />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/learn/gaganyaan"
                  element={
                    <PrivateRoute>
                      <Gaganyaan />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/learn/history"
                  element={
                    <PrivateRoute>
                      <ISROHistory />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/about"
                  element={
                    <PrivateRoute>
                      <About />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/feedback"
                  element={
                    <PrivateRoute>
                      <Feedback />
                    </PrivateRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<div>404 Not Found</div>} />

              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </CosmicBackground>
  );
}

export default App;
