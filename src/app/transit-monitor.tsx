'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Agency, AgencyData, GroupedRoute, TransitLine } from './assets/types';
const S3_BUCKET_URL = 'https://your-bucket-name.s3.amazonaws.com/'; // TODO: Fill in with actual S3 bucket URL
const REFRESH_INTERVAL = 60000; // 1 minute in milliseconds
const AUTO_CYCLE_DELAY = 15000; // ADJUST THIS: Time in ms of idle stillness before switching tabs (e.g., 15s)
const IS_LOCAL = process.env.NODE_ENV === 'development'; // Toggle based on 
const AGENCIES: Agency[] = ['Muni', 'BART', 'Caltrain', 'GGT'];
const AGENCY_STYLES: Record<Agency, { activeBtn: string; headerBg: string; accentBg: string  }> = {
  Muni: { 
    activeBtn: 'bg-red-600 text-white shadow-sm', 
    headerBg: 'bg-red-600',
    accentBg: 'bg-red-700'
  },
  BART: { 
    activeBtn: 'bg-blue-600 text-white shadow-sm', 
    headerBg: 'bg-slate-800', // Default dark header; lines inside will have colored badges
    accentBg: 'bg-blue-600'
  },
  Caltrain: { 
    activeBtn: 'bg-red-700 text-white shadow-sm', 
    headerBg: 'bg-red-700',
    accentBg: 'bg-gray-900'
  },
  GGT: { 
    activeBtn: 'bg-teal-600 text-white shadow-sm', 
    headerBg: 'bg-teal-600',
    accentBg: 'bg-teal-700'
  }
};
const BART_COLOR_MAP: Record<string, string> = {
  Red: 'bg-red-600',
  Orange: 'bg-orange-500',
  Yellow: 'bg-yellow-500 text-black', // Add black text contrast for yellow!
  Green: 'bg-green-600',
  Blue: 'bg-blue-600'
};
export default function TransitMonitor() {
    //Array of arrivals
  const [activeAgency, setActiveAgency] = useState<Agency>('Muni');
  const [data, setData] = useState<AgencyData>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const autoCycleTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const activeAgencyRef = React.useRef<Agency>(activeAgency);

  const fetchData = useCallback(async () => {
    const fileMap: Record<Agency, string> = {
      'Muni': 'sf_muni.json',
      'BART': 'bart.json',
      'Caltrain': 'caltrain.json',
      'GGT': 'ggt.json',
    };
    const baseUrl = IS_LOCAL ? '/json-files/' : S3_BUCKET_URL;
    try{
      const response = await fetch(`${baseUrl}${fileMap[activeAgency]}`);
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  },[activeAgency]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchData]);

  const resetAutoCycleTimer = useCallback(() => {
    if (autoCycleTimerRef.current) {
      clearTimeout(autoCycleTimerRef.current);
    }
    autoCycleTimerRef.current = setTimeout(() => {
      const currentIndex = AGENCIES.indexOf(activeAgencyRef.current);
      const nextIndex = (currentIndex + 1) % AGENCIES.length;
      setActiveAgency(AGENCIES[nextIndex]);
    }, AUTO_CYCLE_DELAY);
  }, []);

  useEffect(() => {
    activeAgencyRef.current = activeAgency;
  }, [activeAgency]);
  useEffect(() => {
    resetAutoCycleTimer();
    const activitySignals = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    const handleUserInteraction = () => {
      resetAutoCycleTimer();
    };
    activitySignals.forEach(signal => {
      window.addEventListener(signal, handleUserInteraction, { passive: true });
    });
    return () => {
      if(autoCycleTimerRef.current) {
        clearTimeout(autoCycleTimerRef.current);
        activitySignals.forEach(signal => {
          window.removeEventListener(signal, handleUserInteraction);
        });
      }
    }
  }, [resetAutoCycleTimer, activeAgency]);

  const getGroupedRoutes = (): GroupedRoute[] => {
    const rawLines = data.flat();
    const groups: Record<string, GroupedRoute> = {};
    rawLines.forEach((item: TransitLine) => {
      let routeId = item.line;
      if(routeId.includes('-')){
        const parts = routeId.split('-');
        const suffix = parts[parts.length - 1].toUpperCase();
        if(['N', 'S', 'I', 'O', 'NB', 'SB'].includes(suffix)){
          routeId = parts.slice(0, -1).join('-');
        }
      }
      let routeName = item.line_name || `Line ${routeId}`;
      if (activeAgency === 'BART') {
        routeName = `${routeId.replace('LINE ', '')} Line`;
      }
      let badgeColor = AGENCY_STYLES[activeAgency].accentBg; // Default badge color
      if(activeAgency === 'BART' && BART_COLOR_MAP[routeId]){
        badgeColor = BART_COLOR_MAP[routeId];
      }
      const times = item.arrival_time || item.departure_time || [];
      const isDeparture = !!item.departure_time;
      if (!groups[routeId]) {
        groups[routeId] = {
          routeId,
          routeName,
          badgeColor,
          directions: [],
        };
      }
      groups[routeId].directions.push({
        destination: item.destination,
        times: times.sort((a, b) => a - b),
        isDeparture,
      });
    });
   return Object.values(groups).sort((a, b) => {
      const numA = parseInt(a.routeId, 10);
      const numB = parseInt(b.routeId, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.routeId.localeCompare(b.routeId);
    });
  }
  const groupedRoutes = getGroupedRoutes();
  const currentStyles = AGENCY_STYLES[activeAgency];

     return (
    // 💡 ANTI-SCROLLING FIX: set max bounds to full screen view height (h-screen) and hide window scrollbars
    <div className="p-6 w-full h-screen max-w-5xl mx-auto flex flex-col bg-gray-50 text-gray-900 overflow-hidden select-none">
      
      <header className="flex justify-between items-center mb-4 border-b pb-3 flex-none">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">SF Transit Monitor</h1>
        <span className="text-xs font-medium text-gray-500">
          Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
        </span>
      </header>

      {/* Navigation Tabs Container */}
      <nav className="flex gap-2 mb-4 flex-none">
        {AGENCIES.map((agency) => (
          <button
            key={agency}
            onClick={() => {
              setActiveAgency(agency);
              resetAutoCycleTimer(); // Immediately reset timer on clicking tab directly
            }}
            className={`px-4 py-1.5 font-semibold text-xs rounded-md transition-all ${
              activeAgency === agency 
                ? AGENCY_STYLES[agency].activeBtn 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {agency}
          </button>
        ))}
      </nav>

      {/* 💡 FLEX RE-FLOW CONTAINER: Spreads objects dynamically into an auto-wrapping layout matrix */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {groupedRoutes.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No live route schedules found for this station.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full content-start overflow-y-auto pr-1 pb-4">
            {groupedRoutes.map((route) => (
              <div key={route.routeId} className="border border-gray-200 rounded-xl shadow-xs bg-white flex flex-col justify-between h-fit overflow-hidden">
                {/* Header Sub-Component */}
                <div className={`${currentStyles.headerBg} text-white px-4 py-2 flex justify-between items-center flex-none`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black px-2 py-0.5 rounded shadow-xs uppercase tracking-wider ${route.badgeColor}`}>
                      {route.routeId}
                    </span>
                    <span className="text-sm font-bold tracking-wide text-gray-100 uppercase truncate max-w-[180px]">
                      {route.routeName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/60">ROUTE: {route.routeId}</span>
                </div>
                
                {/* Internal Directional Matrix */}
                <div className="divide-y divide-gray-100 bg-white flex-1">
                  {route.directions.map((dir, dIdx) => (
                    <div key={dIdx} className="p-2.5 flex items-center justify-between gap-2 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-none">
                          To
                        </span>
                        <span className="text-xs font-semibold text-gray-800 truncate">
                          {dir.destination}
                        </span>
                      </div>
                      
                      {/* Live Prediction Arrival Badges */}
                      <div className="flex gap-1.5 items-center flex-wrap flex-none">
                        {dir.times.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">No times</span>
                        ) : (
                          dir.times.map((time, tIdx) => (
                            <span 
                              key={tIdx} 
                              className={`px-2 py-0.5 rounded font-bold text-xs shadow-xs ${
                                time <= 2 
                                  ? 'bg-red-100 text-red-800 animate-pulse' 
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {time} {dir.isDeparture ? 'dep' : 'min'}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
