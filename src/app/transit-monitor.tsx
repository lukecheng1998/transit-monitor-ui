'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Agency, AgencyData, GroupedRoute, TransitLine } from './assets/types';
const S3_BUCKET_URL = 'https://your-bucket-name.s3.amazonaws.com/'; // TODO: Fill in with actual S3 bucket URL
const REFRESH_INTERVAL = 60000; // 1 minute in milliseconds
const IS_LOCAL = process.env.NODE_ENV === 'development'; // Toggle based on 
export default function TransitMonitor() {
    //Array of arrivals
  const [activeAgency, setActiveAgency] = useState<Agency>('Muni');
  const [data, setData] = useState<AgencyData>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
      const times = item.arrival_time || item.departure_time || [];
      const isDeparture = !!item.departure_time;
      if (!groups[routeId]) {
        groups[routeId] = {
          routeId,
          routeName,
          directions: [],
        };
      }
      groups[routeId].directions.push({
        destination: item.destination,
        times: times.sort((a, b) => a - b),
        isDeparture,
      });
    });
    return Object.values(groups);
  }
  const groupedRoutes = getGroupedRoutes();

      return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50 text-gray-900">
      <header className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">SF Transit Monitor</h1>
        <span className="text-sm font-medium text-gray-600">
          Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
        </span>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-2 mb-6">
        {(['Muni', 'BART', 'Caltrain', 'GGT'] as Agency[]).map((agency) => (
          <button
            key={agency}
            onClick={() => setActiveAgency(agency)}
            className={`px-4 py-2 font-semibold text-sm rounded-md transition-colors ${
              activeAgency === agency 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {agency}
          </button>
        ))}
      </nav>

      {/* Grouped Cards Main Main */}
      <main className="space-y-6">
        {groupedRoutes.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No live route schedules found for this station.</p>
        ) : (
          groupedRoutes.map((route) => (
            <div key={route.routeId} className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
              {/* Card Header: Consolidated Line Identifier */}
              <div className="bg-gray-900 text-white px-5 py-3 flex justify-between items-center">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black bg-blue-600 text-white px-2.5 py-0.5 rounded shadow-sm">
                    {route.routeId}
                  </span>
                  <span className="text-md font-bold tracking-wide text-gray-100 uppercase">
                    {route.routeName}
                  </span>
                </div>
                <span className="text-xs font-mono text-gray-400">ROUTE ID: {route.routeId}</span>
              </div>
              
              {/* Card Body: Map over each unique direction block */}
              <div className="divide-y divide-gray-100">
                {route.directions.map((dir, dIdx) => (
                  <div key={dIdx} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        To
                      </span>
                      <span className="text-md font-semibold text-gray-800">
                        {dir.destination}
                      </span>
                    </div>
                    
                    {/* Arrival Times Row */}
                    <div className="flex gap-2 items-center flex-wrap">
                      {dir.times.length === 0 ? (
                        <span className="text-sm text-gray-400 italic">No scheduled times</span>
                      ) : (
                        dir.times.map((time, tIdx) => (
                          <span 
                            key={tIdx} 
                            className={`px-3 py-1 rounded-md font-bold text-sm shadow-xs ${
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
          ))
        )}
      </main>
    </div>
  );
};
