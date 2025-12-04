import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Circle, Rectangle } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import { HiGlobeAlt, HiLocationMarker, HiClock } from 'react-icons/hi';
import api from '../services/api';
import disasterPayload from '../data/disasterSatellites.json';
import ToggleGroup from '../components/ToggleGroup';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import SectionHeader from '../components/ui/SectionHeader';
import SatelliteGrid from '../components/ui/SatelliteGrid';
import SatelliteCard from '../components/ui/SatelliteCard';
import NextPassCard from '../components/ui/NextPassCard';
import MapContainerStyled from '../components/ui/MapContainerStyled';
import Loader from '../components/ui/Loader';
import ErrorState from '../components/ui/ErrorState';
import Select from '../components/ui/Select';

const { watchList = [] } = disasterPayload;

const INDIA_BOUNDS = {
  north: 37.5,
  south: 5.0,
  east: 97.5,
  west: 67.0,
};

// Custom SVG Icon for Satellite
const createCustomIcon = (color = '#8b5cf6') => {
  return L.divIcon({
    className: 'custom-satellite-marker',
    html: `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="8" fill="${color}" stroke="white" stroke-width="2" opacity="0.9"/>
        <circle cx="16" cy="16" r="3" fill="white"/>
        <path d="M16 8 L16 4 M16 28 L16 24 M8 16 L4 16 M28 16 L24 16" 
              stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const MapView = () => {
  const [satellites, setSatellites] = useState([]);
  const [selected, setSelected] = useState('');
  const [position, setPosition] = useState(null);
  const [orbitPath, setOrbitPath] = useState([]);
  const [error, setError] = useState('');
  const [trail, setTrail] = useState([]);
  const [activeLayers, setActiveLayers] = useState(['footprint']);
  const [isVisibleFromIndia, setIsVisibleFromIndia] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  
  // Live Satellites Above India state
  const [livePositions, setLivePositions] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');

  useEffect(() => {
    const loadSatellites = async () => {
      try {
        const response = await api.get('/satellites');
        console.log('[MapView] Raw API response:', response);
        console.log('[MapView] Response data:', response.data);
        console.log('[MapView] Response data type:', Array.isArray(response.data) ? 'array' : typeof response.data);
        
        // Handle both array response and { satellites: [...] } response
        const satellitesData = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.satellites || []);
        
        console.log('[MapView] Processed satellites data:', satellitesData);
        console.log('[MapView] Number of satellites:', satellitesData.length);
        
        if (satellitesData.length > 0) {
          console.log('[MapView] First satellite keys:', Object.keys(satellitesData[0]));
          console.log('[MapView] First satellite:', satellitesData[0]);
        }
        
        setSatellites(satellitesData);
        setError('');
        if (satellitesData.length) {
          setTrail([]);
          // Backend maps _id to id in response, so use id as primary identifier
          const firstSatId = satellitesData[0].id || satellitesData[0]._id || satellitesData[0].norad_id;
          console.log('[MapView] Setting selected satellite ID:', firstSatId);
          setSelected(firstSatId);
        } else {
          console.warn('[MapView] No satellites found in response!');
          if ((watchList || []).length > 0) {
            const fallbackId = watchList[0].identifier;
            console.log('[MapView] Using fallback watchList, setting selected:', fallbackId);
            setSelected(fallbackId);
          }
        }
      } catch (err) {
        console.error('[MapView] Failed to load satellites:', err);
        console.error('[MapView] Error details:', err.response?.data || err.message);
        setError('Failed to load satellites.');
        if ((watchList || []).length > 0) {
          const fallbackId = watchList[0].identifier;
          console.log('[MapView] API error, using fallback watchList, setting selected:', fallbackId);
          setSelected(fallbackId);
        }
      }
    };
    loadSatellites();
  }, []);

  useEffect(() => {
    if (!selected) return;

    let interval;
    const fetchPosition = async () => {
      try {
        const { data } = await api.get(`/position/${selected}`);
        setPosition(data.currentPosition);
        setOrbitPath(data.orbitPath || []);
        setIsVisibleFromIndia(data.is_visible_from_india || false);
        setLastUpdate(data.timestamp || new Date().toISOString());
        setTrail((prev) => {
          const next = [
            ...prev,
            {
              latitude: data.currentPosition.latitude,
              longitude: data.currentPosition.longitude,
              timestamp: Date.now(),
            },
          ];
          return next.slice(-40);
        });
        setError('');
        setMapLoading(false);
      } catch {
        setError('Unable to fetch satellite position.');
        setMapLoading(false);
      }
    };

    fetchPosition();
    interval = setInterval(fetchPosition, 5000);
    return () => clearInterval(interval);
  }, [selected]);

  const coordinates = useMemo(
    () =>
      orbitPath.map((point) => [
        Number(point.latitude),
        Number(point.longitude),
      ]),
    [orbitPath]
  );

  const activeSatellite = satellites.find(
    (sat) =>
      String(sat.id || sat._id || sat.norad_id) === String(selected ?? '')
  );

  const footprintRadiusMeters = useMemo(() => {
    if (!position?.altitudeKm) return 400000;
    const radiusKm = Math.min(Math.max(position.altitudeKm * 3, 400), 2500);
    return radiusKm * 1000;
  }, [position]);

  const toggleLayer = (value) => {
    setActiveLayers((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleSelectionChange = (value) => {
    // Reset transient state to avoid stale UI while loading new satellite
    setTrail([]);
    setSelected(value);
    setPosition(null);
    setOrbitPath([]);
    setIsVisibleFromIndia(false);
    setLastUpdate(null);
    setError('');
    setMapLoading(true);
  };

  // Fetch live satellite positions
  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const fetchLivePositions = async () => {
      setLiveLoading(true);
      try {
        const results = await Promise.allSettled(
          watchList.map(async (sat) => {
            const { data } = await api.get(`/position/${sat.identifier}`);
            const { currentPosition, is_visible_from_india, visibility_details, next_pass } = data;
            
            const isOverIndia = is_visible_from_india || false;
            let nextPassData = next_pass || null;

            // If not visible and no next_pass, request it (limit to first 3 to avoid too many requests)
            if (!isOverIndia && !nextPassData && watchList.indexOf(sat) < 3) {
              try {
                const passResponse = await api.get(`/position/${sat.identifier}?lookaheadMinutes=30`);
                nextPassData = passResponse.data.next_pass || null;
              } catch (passErr) {
                console.warn(`Failed to fetch next pass for ${sat.label}:`, passErr);
              }
            }

            return {
              ...sat,
              position: currentPosition,
              isOverIndia,
              visibilityDetails: visibility_details || null,
              nextPass: nextPassData,
            };
          })
        );

        if (isMounted) {
          setLivePositions(results.filter((r) => r.status === 'fulfilled').map((r) => r.value));
          setLiveError('');
        }
      } catch (err) {
        if (isMounted) {
          setLiveError(err.message || 'Failed to load satellite positions');
        }
      } finally {
        if (isMounted) {
          setLiveLoading(false);
        }
      }
    };

    fetchLivePositions();
    intervalId = setInterval(fetchLivePositions, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const satellitesOverIndia = useMemo(
    () => livePositions.filter((item) => item.isOverIndia),
    [livePositions]
  );

  const satellitesNotVisible = useMemo(
    () => livePositions.filter((item) => !item.isOverIndia),
    [livePositions]
  );

  return (
    <motion.div 
      className="mx-auto max-w-7xl px-8 pt-24 pb-20 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-12"
      >
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Real-Time Tracking</p>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
          <span className="text-gradient">Satellite</span> Orbit Map
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl">
          Follow satellite orbits with live position updates every 5 seconds
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2 relative">
          <Card className="p-0" style={{ boxShadow: '0 0 30px rgba(110, 159, 255, 0.3)' }}>
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4 relative z-10">
              <div className="min-w-[200px]">
                <Select
                  value={selected}
                  onChange={handleSelectionChange}
                  options={(() => {
                    const apiOptions = Array.isArray(satellites)
                      ? satellites
                          .filter((sat) => sat && (sat.id || sat._id || sat.norad_id))
                          .map((sat) => ({
                            value: sat.id || sat._id || sat.norad_id,
                            label:
                              sat.name ||
                              sat.title ||
                              (sat.norad_id ? `NORAD ${sat.norad_id}` : 'Satellite'),
                          }))
                      : [];

                    if (apiOptions.length > 0) {
                      console.log('[MapView] Dropdown options (API):', apiOptions);
                      return apiOptions;
                    }

                    const fallbackOptions = (watchList || []).map((item) => ({
                      value: item.identifier,
                      label: item.label || (item.identifier ? `NORAD ${item.identifier}` : 'Satellite'),
                    }));
                    console.log('[MapView] Dropdown options (fallback watchList):', fallbackOptions);
                    return fallbackOptions;
                  })()}
                  placeholder="Select satellite..."
                />
              </div>
              <div className="flex items-center gap-3">
                <ToggleGroup
                  options={[
                    { value: 'footprint', label: 'Footprint' },
                    { value: 'heatmap', label: 'Heatmap' },
                  ]}
                  active={activeLayers}
                  onToggle={toggleLayer}
                />
                {/* Floating Status Badge */}
                <motion.div
                  className="px-3 py-1 rounded-full backdrop-blur-xl text-xs font-semibold tracking-wide animate-pulse"
                  style={{ 
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    color: '#4ade80',
                    borderColor: 'rgba(74, 222, 128, 0.3)',
                    border: '1px solid rgba(74, 222, 128, 0.3)',
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  Live Tracking ON
                </motion.div>
              </div>
            </div>

            <div className="overflow-hidden">
              {mapLoading && !position ? (
                <Skeleton variant="rect" height={500} className="rounded-none" />
              ) : (
                <MapContainer
                  key={selected}
                  center={
                    position
                      ? [position.latitude, position.longitude]
                      : [20.5937, 78.9629]
                  }
                  zoom={position ? 4 : 2}
                  style={{ height: '500px', width: '100%' }}
                  scrollWheelZoom
                >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {position && (
                  <Marker
                    position={[position.latitude, position.longitude]}
                    icon={createCustomIcon(isVisibleFromIndia ? '#10b981' : '#8b5cf6')}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold text-slate-900">
                          {activeSatellite?.name ?? 'Satellite'}
                        </p>
                        <p className="text-sm text-slate-600">
                          Lat: {position.latitude.toFixed(2)}°<br />
                          Lon: {position.longitude.toFixed(2)}°<br />
                          Alt: {position.altitudeKm?.toFixed(2)} km
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                {coordinates.length > 0 && (
                  <Polyline
                    color="#8b5cf6"
                    weight={2}
                    opacity={0.6}
                    positions={coordinates}
                  />
                )}
                {position && activeLayers.includes('footprint') && (
                  <Circle
                    center={[position.latitude, position.longitude]}
                    radius={footprintRadiusMeters}
                    pathOptions={{
                      color: '#8b5cf6',
                      fillColor: '#8b5cf6',
                      fillOpacity: 0.1,
                      weight: 2,
                    }}
                  />
                )}
                {activeLayers.includes('heatmap') &&
                  trail.map((point, index) => (
                    <Circle
                      key={`${point.timestamp}-${index}`}
                      center={[point.latitude, point.longitude]}
                      radius={250000}
                      pathOptions={{
                        color: '#8b5cf6',
                        fillColor: '#8b5cf6',
                        fillOpacity: Math.max(0.05, 0.3 - index * 0.005),
                      }}
                    />
                  ))}
              </MapContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Info Panel */}
        <AnimatePresence mode="wait">
          {position && activeSatellite && (
            <motion.div
              key={selected}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <HiLocationMarker style={{ color: '#8b5cf6' }} />
                  Satellite Info
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Satellite</p>
                    <p className="text-lg font-semibold text-white">{activeSatellite.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Latitude</p>
                      <p className="text-sm font-medium text-slate-200">
                        {position.latitude.toFixed(4)}°
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Longitude</p>
                      <p className="text-sm font-medium text-slate-200">
                        {position.longitude.toFixed(4)}°
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Altitude</p>
                      <p className="text-sm font-medium text-slate-200">
                        {position.altitudeKm?.toFixed(2)} km
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <p className={`text-sm font-medium ${isVisibleFromIndia ? '' : 'text-slate-400'}`} style={isVisibleFromIndia ? { color: '#8b5cf6' } : {}}>
                        {isVisibleFromIndia ? 'Visible' : 'Not Visible'}
                      </p>
                    </div>
                  </div>

                  {lastUpdate && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <HiClock />
                        <span>
                          Updated: {new Date(lastUpdate).toLocaleTimeString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })} IST
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          className="text-red-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}

      {/* Live Satellites Above India Section */}
      <Card variant="large" className="mt-10">
        <SectionHeader
          title="Live Satellites Above India"
          subtitle="Real-time tracking of monitored satellites. Refresh occurs every 30 seconds."
          icon={HiLocationMarker}
          className="mb-6"
        />

        {liveError && (
          <div className="mb-6">
            <ErrorState message={liveError} />
          </div>
        )}

        {liveLoading && (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        )}

        {!liveLoading && (
          <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
            {/* Satellites List */}
            <div className="space-y-6">
              {satellitesOverIndia.length > 0 ? (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Currently Visible ({satellitesOverIndia.length})
                    </h3>
                    <SatelliteGrid>
                      {satellitesOverIndia.map((entry) => (
                        <SatelliteCard
                          key={entry.identifier}
                          satellite={entry}
                          position={entry.position}
                          visibilityDetails={entry.visibilityDetails}
                          nextPass={entry.nextPass}
                        />
                      ))}
                    </SatelliteGrid>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-lg mb-4">
                      None of the monitored satellites are currently above India.
                    </p>
                    {satellitesNotVisible.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-300 mb-3">
                          Upcoming Passes
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          {satellitesNotVisible.slice(0, 4).map((entry) => (
                            <NextPassCard
                              key={entry.identifier}
                              nextPass={entry.nextPass}
                              satelliteName={entry.label}
                            />
                          ))}
                        </div>
                        {satellitesNotVisible.slice(0, 4).every((e) => !e.nextPass) && (
                          <p className="text-slate-500 text-sm mt-4">
                            No passes predicted in the next 30 minutes
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* All Satellites Grid (if some are visible) */}
              {satellitesOverIndia.length > 0 && livePositions.length > satellitesOverIndia.length && (
                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    All Monitored Satellites
                  </h3>
                  <SatelliteGrid>
                    {livePositions.map((entry) => (
                      <SatelliteCard
                        key={entry.identifier}
                        satellite={entry}
                        position={entry.position}
                        visibilityDetails={entry.visibilityDetails}
                        nextPass={entry.nextPass}
                      />
                    ))}
                  </SatelliteGrid>
                </div>
              )}
            </div>

            {/* Map Panel */}
            <div className="lg:sticky lg:top-6 h-fit">
              <MapContainerStyled
                center={[22, 80]}
                zoom={4}
                className="w-full"
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <Rectangle
                  bounds={[
                    [INDIA_BOUNDS.south, INDIA_BOUNDS.west],
                    [INDIA_BOUNDS.north, INDIA_BOUNDS.east],
                  ]}
                  pathOptions={{ color: '#8b5cf6', weight: 2, opacity: 0.6 }}
                />
                <AnimatePresence>
                  {satellitesOverIndia.map((entry) => (
                    <Marker
                      key={`marker-${entry.identifier}`}
                      position={[entry.position.latitude, entry.position.longitude]}
                      icon={createCustomIcon('#8b5cf6')}
                    >
                      <Popup className="custom-popup">
                        <div className="p-2">
                          <p className="font-semibold text-slate-900 mb-1">{entry.label}</p>
                          <p className="text-xs text-slate-600">
                            Alt: {entry.position.altitudeKm?.toFixed(1)} km
                          </p>
                          {entry.visibilityDetails?.city && (
                            <p className="text-xs text-slate-600">
                              Visible from {entry.visibilityDetails.city.name}
                            </p>
                          )}
                          {entry.visibilityDetails?.centerElevation > 0 && (
                            <p className="text-xs text-slate-600">
                              Elevation: {entry.visibilityDetails.centerElevation.toFixed(1)}°
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </AnimatePresence>
              </MapContainerStyled>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default MapView;
