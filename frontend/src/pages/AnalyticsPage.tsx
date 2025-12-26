import TrafficAnalytics from "../modules/features/traffic/components/TrafficAnalyticsClean";
import { useEffect } from "react";
import { useTrafficStore } from "@/hooks/useTrafficStore";

const AnalyticsPage = () => {
  // Use central traffic store which starts fetching after login
  const { trafficData, allowedRoads, historicalData } = useTrafficStore();

  // small defensive hook: ensure allowedRoads is stable
  useEffect(() => {}, [allowedRoads]);

  // Disable body scroll when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden w-full">
      <TrafficAnalytics
        trafficData={trafficData}
        allowedRoads={allowedRoads}
        historicalData={historicalData}
      />
    </div>
  );
};

export default AnalyticsPage;
