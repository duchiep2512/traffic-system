import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Checkbox } from "@/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/collapsible";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  CheckSquare,
  Square,
  ChevronDown,
  Car,
  Bike,
  Gauge,
  MapPin,
} from "lucide-react";
import VideoMonitor from "../../video/components/VideoMonitor";
import { motion } from "framer-motion";
import {
  useMultipleTrafficInfo,
  useMultipleFrameStreams,
} from "../../../../hooks/useWebSocket";
import { endpoints } from "../../../../config";
import { getThresholdForRoad } from "../../../../config/trafficThresholds";

// Import types from the WebSocket hook
type VehicleData = {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
};

type TrafficBackendData = VehicleData & {
  density_status?: string;
  speed_status?: string;
};

const TrafficDashboard = () => {
  const [selectedRoad, setSelectedRoad] = useState<string | null>(null);
  const [localFullscreen] = useState(false);

  const [allowedRoads, setAllowedRoads] = useState<string[]>([]);
  const [isFetchingRoads, setIsFetchingRoads] = useState(true);
  const [selectedRoads, setSelectedRoads] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchRoads = async () => {
      setIsFetchingRoads(true);
      let retryCount = 0;
      const maxRetries = 5;
      const retryDelay = 2000;

      const attemptFetch = async (): Promise<void> => {
        try {
          console.log(`🔄 Attempting to fetch roads (attempt ${retryCount + 1}/${maxRetries})...`);
          console.log(`   URL: ${endpoints.roadNames}`);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/2c6c6511-3798-41e8-8f0b-7892484d9367', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'H1',
              location: 'TrafficDashboard.tsx:fetchRoads',
              message: 'fetch roads attempt',
              data: { url: endpoints.roadNames, attempt: retryCount + 1 },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion agent log

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const res = await fetch(endpoints.roadNames, {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
          });
          clearTimeout(timeoutId);
          
          console.log(`   Response status: ${res.status} ${res.statusText}`);

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          const json = await res.json();
          const names: string[] = json?.road_names ?? [];
          console.log("Fetched road names:", names);

          if (names.length > 0) {
            setAllowedRoads(names);
            // Select all roads by default
            setSelectedRoads(new Set(names));
            setIsFetchingRoads(false);
            return;
          } else {
            throw new Error("Backend returned empty road names");
          }
        } catch (error) {
          console.error(`Error fetching roads (attempt ${retryCount + 1}):`, error);
          
          if (retryCount < maxRetries - 1) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return attemptFetch();
          } else {
            console.warn("Max retries reached, using fallback road names");
            setAllowedRoads(["Ngã Tư Sở"]);
            setIsFetchingRoads(false);
          }
        }
      };

      attemptFetch();
    };
    fetchRoads();
  }, []);

  // Filter roads based on selection
  const filteredRoads = allowedRoads.filter(road => selectedRoads.has(road));

  // Use WebSocket for traffic data (only for selected roads)
  const { trafficData, isAnyConnected } = useMultipleTrafficInfo(filteredRoads);
  const { frameData: frames } = useMultipleFrameStreams(filteredRoads);

  const loading = !isAnyConnected;

  // Handle checkbox toggle
  const handleRoadToggle = (road: string) => {
    setSelectedRoads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(road)) {
        newSet.delete(road);
      } else {
        newSet.add(road);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRoads.size === allowedRoads.length) {
      setSelectedRoads(new Set());
    } else {
      setSelectedRoads(new Set(allowedRoads));
    }
  };

  const allSelected = selectedRoads.size === allowedRoads.length && allowedRoads.length > 0;
  const someSelected = selectedRoads.size > 0 && selectedRoads.size < allowedRoads.length;
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const getTrafficStatus = (roadName: string) => {
    const data = trafficData[roadName] as VehicleData | undefined;
    if (!data) return { status: "unknown", color: "gray", icon: Clock };
    const densityFromBackend = (data as TrafficBackendData).density_status;
    if (densityFromBackend) {
      if (densityFromBackend === "Tắc nghẽn")
        return { status: "congested", color: "red", icon: AlertTriangle };
      if (densityFromBackend === "Đông đúc")
        return { status: "busy", color: "yellow", icon: Clock };
      if (densityFromBackend === "Thông thoáng")
        return { status: "clear", color: "green", icon: CheckCircle };
    }
    const threshold = getThresholdForRoad(roadName);
    const totalVehicles = (data.count_car ?? 0) + (data.count_motor ?? 0);
    if (totalVehicles > threshold.c2)
      return { status: "congested", color: "red", icon: AlertTriangle };
    if (totalVehicles > threshold.c1)
      return { status: "busy", color: "yellow", icon: Clock };
    return { status: "clear", color: "green", icon: CheckCircle };
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "congested":
        return "Tắc nghẽn";
      case "busy":
        return "Đông đúc";
      case "clear":
        return "Thông thoáng";
      default:
        return "Không rõ";
    }
  };

  const getSpeedStatus = (roadName: string) => {
    const data = trafficData[roadName] as VehicleData | undefined;
    if (!data) return { speedText: "Không rõ", speedColor: "gray" };
    const speedFromBackend = (data as TrafficBackendData).speed_status;
    if (speedFromBackend) {
      if (speedFromBackend === "Nhanh chóng")
        return { speedText: "Nhanh chóng", speedColor: "green" };
      if (speedFromBackend === "Chậm chạp")
        return { speedText: "Chậm chạp", speedColor: "orange" };
    }
    const threshold = getThresholdForRoad(roadName);
    const avgSpeed = ((data.speed_car ?? 0) + (data.speed_motor ?? 0)) / 2;
    if (avgSpeed >= threshold.v)
      return { speedText: "Nhanh chóng", speedColor: "green" };
    return { speedText: "Chậm chạp", speedColor: "orange" };
  };


  // Hiển thị loading
  if (isFetchingRoads || allowedRoads.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
            <div className="absolute inset-4 rounded-full border-4 border-transparent border-r-pink-500 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-xl font-bold mb-2"
          >
            {isFetchingRoads ? "Đang tải danh sách đường..." : "Đang khởi tạo hệ thống..."}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-purple-300 text-sm"
          >
            Vui lòng đợi backend khởi động xong...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-4">
        {/* Compact Filter Section - Smaller */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3"
        >
          <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <Card className="border-0 bg-gradient-to-br from-slate-800/90 via-purple-900/90 to-slate-800/90 backdrop-blur-xl rounded-lg shadow-lg overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.2),transparent)]"></div>
              <CollapsibleTrigger asChild>
                <CardHeader className="relative py-2.5 px-4 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 border-b border-purple-500/20 cursor-pointer hover:from-purple-600/30 hover:via-pink-600/30 hover:to-blue-600/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                        <Filter className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                        Lọc Tuyến Đường
                      </span>
                      <Badge className="ml-2 bg-purple-500/30 text-purple-300 border-purple-400/50 text-xs px-2 py-0.5">
                        {selectedRoads.size}/{allowedRoads.length}
                      </Badge>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 text-purple-300 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="relative p-3 max-h-72 overflow-y-auto custom-scrollbar">
                  {allowedRoads.length > 0 ? (
                    <div className="space-y-2">
                      {/* Select All */}
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex items-center space-x-2 p-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 cursor-pointer transition-all hover:border-purple-400/50"
                        onClick={handleSelectAll}
                      >
                        <div className="flex items-center justify-center w-5 h-5">
                          {allSelected ? (
                            <CheckSquare className="h-5 w-5 text-purple-300" />
                          ) : someSelected ? (
                            <div className="w-5 h-5 border-2 border-purple-300 rounded bg-purple-500/30 flex items-center justify-center">
                              <div className="w-2.5 h-0.5 bg-purple-300"></div>
                            </div>
                          ) : (
                            <Square className="h-5 w-5 text-purple-300" />
                          )}
                        </div>
                        <span className="font-semibold text-white text-sm">Chọn tất cả</span>
                      </motion.div>

                      {/* Individual Road Checkboxes - Vertical List */}
                      <div className="space-y-2">
                        {allowedRoads.map((road, index) => {
                          const isChecked = selectedRoads.has(road);
                          const { status, color } = getTrafficStatus(road);
                          const data = trafficData[road];

                          return (
                            <motion.div
                              key={road}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              whileHover={{ scale: 1.01, x: 4 }}
                              whileTap={{ scale: 0.99 }}
                              className={`flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                                isChecked
                                  ? "bg-gradient-to-r from-purple-600/40 to-pink-600/40 border-purple-400 shadow-md shadow-purple-500/20"
                                  : "bg-slate-700/20 border-slate-600/30 hover:border-purple-500/50 hover:bg-slate-700/30"
                              }`}
                              onClick={() => handleRoadToggle(road)}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleRoadToggle(road)}
                                className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                              />
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <span className={`font-semibold text-sm truncate ${isChecked ? "text-white" : "text-gray-300"}`}>
                                  {road}
                                </span>
                                <div className="flex items-center space-x-2 ml-2">
                                  {data && (
                                    <>
                                      <span className="text-xs text-gray-400">{data.count_car + data.count_motor} xe</span>
                                      <Badge
                                        className={`text-xs h-4 px-1.5 ${
                                          color === "red"
                                            ? "bg-red-500/30 text-red-300 border-red-400/50"
                                            : color === "yellow"
                                            ? "bg-yellow-500/30 text-yellow-300 border-yellow-400/50"
                                            : "bg-green-500/30 text-green-300 border-green-400/50"
                                        }`}
                                      >
                                        {getStatusText(status)}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Clock className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                      <p className="text-purple-300 text-xs">Không có tuyến đường nào</p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </motion.div>

        {/* Main Content Area - Video Monitor (Left) and Traffic Status (Right) */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Video Monitor - Takes more space, more prominent */}
          <div className="flex-1 lg:flex-[2] min-w-0">
            <VideoMonitor
              frameData={frames}
              trafficData={trafficData}
              allowedRoads={filteredRoads}
              selectedRoad={selectedRoad}
              setSelectedRoad={setSelectedRoad}
              loading={loading}
              isFullscreen={localFullscreen}
            />
          </div>

          {/* Traffic Status Cards Section - Right side, smaller */}
          {filteredRoads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:w-80 xl:w-96 flex-shrink-0"
            >
              <Card className="border-0 bg-gradient-to-br from-slate-800/90 via-purple-900/90 to-slate-800/90 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden h-full">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.2),transparent)]"></div>
                <CardHeader className="relative py-3 px-4 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 border-b border-purple-500/20">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                      Tình Trạng Giao Thông
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="relative p-4 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
                  <div className="space-y-3">
                    {filteredRoads.map((road, index) => {
                      const data = trafficData[road] as VehicleData | undefined;
                      const { status, color, icon: StatusIcon } = getTrafficStatus(road);
                      const { speedText, speedColor } = getSpeedStatus(road);

                      return (
                        <motion.div
                          key={road}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gradient-to-br from-slate-700/80 to-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 hover:border-purple-400/40 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                        >
                          <h3 className="font-bold text-white text-base mb-3 truncate">{road}</h3>
                          
                          {/* Vehicle Counts */}
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-2">
                              <Car className="h-4 w-4 text-blue-400" />
                              <span className="text-white text-sm font-semibold">
                                {data?.count_car ?? 0}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Bike className="h-4 w-4 text-green-400" />
                              <span className="text-white text-sm font-semibold">
                                {data?.count_motor ?? 0}
                              </span>
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 font-semibold ${
                                color === "red"
                                  ? "bg-red-500/30 text-red-300 border-red-400/50"
                                  : color === "yellow"
                                  ? "bg-yellow-500/30 text-yellow-300 border-yellow-400/50"
                                  : "bg-green-500/30 text-green-300 border-green-400/50"
                              }`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              <span>{getStatusText(status)}</span>
                            </Badge>
                            {data && (
                              <Badge
                                className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 font-semibold ${
                                  speedColor === "green"
                                    ? "bg-green-500/30 text-green-300 border-green-400/50"
                                    : "bg-orange-500/30 text-orange-300 border-orange-400/50"
                                }`}
                              >
                                <Gauge className="h-3 w-3" />
                                <span>{speedText}</span>
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrafficDashboard;
