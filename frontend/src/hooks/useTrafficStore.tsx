/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useRef, useState } from "react";
import { endpoints } from "@/config";
import { useMultipleTrafficInfo } from "./useWebSocket";
import { TrafficContext } from "./TrafficContext";
import type { HistoricalDataPoint, TrafficStore } from "./TrafficContext";

const MAX_HISTORY = 60; // keep at most 60 recent points

export function TrafficProvider({ children }: { children: React.ReactNode }) {
  const [allowedRoads, setAllowedRoads] = useState<string[]>([]);

  // fetch roads when token is present (or on mount if public)
  useEffect(() => {
    let mounted = true;

    const fetchRoads = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTrafficStore.tsx:fetchRoads',message:'fetchRoads called',data:{url:endpoints.roadNames},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      try {
        const res = await fetch(endpoints.roadNames);
        if (!mounted) return;
        if (!res.ok) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTrafficStore.tsx:fetchRoads',message:'fetchRoads failed',data:{status:res.status,statusText:res.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setAllowedRoads([]);
          return;
        }
        const json = await res.json();
        const names: string[] = json?.road_names ?? [];
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTrafficStore.tsx:fetchRoads',message:'fetchRoads success',data:{roadCount:names.length,roads:names},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        setAllowedRoads(names);
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTrafficStore.tsx:fetchRoads',message:'fetchRoads error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (!mounted) return;
        setAllowedRoads([]);
      }
    };

    fetchRoads();

    return () => {
      mounted = false;
    };
  }, []);

  // Use existing hook to open ws connections for all roads
  const { trafficData, connections, isAnyConnected, areAllConnected } =
    useMultipleTrafficInfo(allowedRoads);
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTrafficStore.tsx:wsStatus',message:'WebSocket status',data:{allowedRoadsCount:allowedRoads.length,isAnyConnected,areAllConnected,trafficDataKeys:Object.keys(trafficData||{}),connectionsCount:Object.keys(connections||{}).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }, [allowedRoads, isAnyConnected, areAllConnected, trafficData, connections]);
  // #endregion

  // Build and maintain historical data capped to MAX_HISTORY
  const historyRef = useRef<HistoricalDataPoint[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>(
    []
  );
  const lastTrafficRef = useRef<Record<string, string>>({});

  useEffect(() => {
    // When trafficData changes, push a new point
    if (!trafficData || Object.keys(trafficData).length === 0) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Avoid pushing duplicate consecutive points (string compare)
    const stateKey = JSON.stringify(trafficData);
    if (lastTrafficRef.current["__full"] === stateKey) return;
    lastTrafficRef.current["__full"] = stateKey;

    const point: HistoricalDataPoint = { time: timeString };
    allowedRoads.forEach((road) => {
      const d = trafficData[road];
      const total = (d?.count_car || 0) + (d?.count_motor || 0);
      point[`${road}_cars`] = d?.count_car || 0;
      point[`${road}_motors`] = d?.count_motor || 0;
      point[`${road}_car_speed`] = d?.speed_car || 0;
      point[`${road}_motor_speed`] = d?.speed_motor || 0;
      point[`${road}_total`] = total;
    });

    historyRef.current = [...historyRef.current, point].slice(-MAX_HISTORY);
    // publish a new array reference so consumers re-render
    setHistoricalData([...historyRef.current]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(trafficData), JSON.stringify(allowedRoads)]);

  const value: TrafficStore = {
    allowedRoads,
    trafficData,
    historicalData,
    isAnyConnected,
    areAllConnected,
    connections,
  };

  return (
    <TrafficContext.Provider value={value}>{children}</TrafficContext.Provider>
  );
}

export function useTrafficStore() {
  const ctx = React.useContext(TrafficContext);
  if (!ctx) {
    throw new Error("useTrafficStore must be used within <TrafficProvider />");
  }
  return ctx;
}

export default TrafficProvider;
