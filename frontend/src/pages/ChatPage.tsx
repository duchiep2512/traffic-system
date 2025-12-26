import ChatInterface from "@/modules/features/chat/components/ChatInterface";
import { useMultipleTrafficInfo } from "../hooks/useWebSocket";
import { useEffect, useState } from "react";
import { endpoints } from "@/config";

export default function ChatPage() {
  const [allowedRoads, setAllowedRoads] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoads = async () => {
      try {
        // roads_name endpoint không cần authentication
        const res = await fetch(endpoints.roadNames);
        if (!res.ok) {
          setAllowedRoads([]);
          return;
        }
        const json = await res.json();
        const names: string[] = json?.road_names ?? [];
        setAllowedRoads(names);
      } catch {
        setAllowedRoads([]);
      }
    };
    fetchRoads();
  }, []);

  // Disable body scroll when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const { trafficData } = useMultipleTrafficInfo(allowedRoads);
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950 px-16 sm:px-24 lg:px-28 pt-6 sm:pt-8 pb-6 sm:pb-8 flex flex-col">
      <div className="flex-1 min-h-0 flex items-start pb-6 sm:pb-8">
        <ChatInterface trafficData={trafficData} />
      </div>
    </div>
  );
}
