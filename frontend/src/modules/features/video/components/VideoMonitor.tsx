import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import {
  Video,
  Car,
  Bike,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  Wifi,
  WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoModal from "./VideoModal";
import { getThresholdForRoad } from "../../../../config/trafficThresholds";

interface VehicleData {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
}

interface FrameData {
  [roadName: string]: {
    frame: string; // Now contains blob URL
  };
}

interface TrafficData {
  [roadName: string]: VehicleData;
}

interface VideoMonitorProps {
  frameData: FrameData;
  trafficData: TrafficData;
  allowedRoads: string[];
  selectedRoad: string | null;
  setSelectedRoad: (road: string | null) => void;
  loading: boolean;
  isFullscreen: boolean;
}

const VideoMonitor = ({
  frameData,
  trafficData,
  allowedRoads,
  selectedRoad,
  setSelectedRoad,
  loading,
  isFullscreen,
}: VideoMonitorProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRoadName, setModalRoadName] = useState<string>("");

  const getTrafficStatus = (roadName: string) => {
    const data = trafficData[roadName];
    if (!data)
      return {
        status: "unknown",
        color: "gray",
        icon: Clock,
        text: "Không rõ",
      };

    // Prefer backend-provided classification when available
    const densityFromBackend = (data as any)?.density_status;
    if (densityFromBackend) {
      if (densityFromBackend === "Tắc nghẽn")
        return {
          status: "congested",
          color: "red",
          icon: AlertTriangle,
          text: densityFromBackend,
        };
      if (densityFromBackend === "Đông đúc")
        return {
          status: "busy",
          color: "yellow",
          icon: Clock,
          text: densityFromBackend,
        };
      if (densityFromBackend === "Thông thoáng")
        return {
          status: "clear",
          color: "green",
          icon: CheckCircle,
          text: densityFromBackend,
        };
    }

    // Fallback to previous local thresholds if backend not providing
    const threshold = getThresholdForRoad(roadName);
    const totalVehicles = data.count_car + data.count_motor;

    if (totalVehicles > threshold.c2)
      return {
        status: "congested",
        color: "red",
        icon: AlertTriangle,
        text: "Tắc nghẽn",
      };
    if (totalVehicles > threshold.c1)
      return { status: "busy", color: "yellow", icon: Clock, text: "Đông đúc" };
    return {
      status: "clear",
      color: "green",
      icon: CheckCircle,
      text: "Thông thoáng",
    };
  };

  const getSpeedStatus = (roadName: string) => {
    const data = trafficData[roadName];
    if (!data) return { speedText: "Không rõ", speedColor: "gray" };

    const speedFromBackend = (data as any)?.speed_status;
    if (speedFromBackend) {
      if (speedFromBackend === "Nhanh chóng")
        return { speedText: "Nhanh chóng", speedColor: "green" };
      if (speedFromBackend === "Chậm chạp")
        return { speedText: "Chậm chạp", speedColor: "orange" };
    }

    // Fallback
    const threshold = getThresholdForRoad(roadName);
    const avgSpeed = (data.speed_car + data.speed_motor) / 2;

    if (avgSpeed >= threshold.v)
      return { speedText: "Nhanh chóng", speedColor: "green" };
    return { speedText: "Chậm chạp", speedColor: "orange" };
  };

  const getStatusBadgeVariant = (color: string) => {
    switch (color) {
      case "red":
        return "destructive";
      case "yellow":
        return "secondary";
      case "green":
        return "default";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
              <Video className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-sm sm:text-base font-bold">Giám Sát Video</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div
            className={`grid gap-3 sm:gap-4 ${
              isFullscreen
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1 lg:grid-cols-2"
            }`}
          >
            {allowedRoads.map((road, index) => (
              <motion.div
                key={road}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2 sm:space-y-3"
              >
                <Skeleton className="aspect-[3/2] w-full max-w-sm mx-auto rounded-xl" />
                <Skeleton className="h-3 sm:h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-3 sm:h-4 w-1/2 rounded-lg" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-2 border-blue-200/50 dark:border-blue-700/50 shadow-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-500/20"></div>
      <CardHeader className="relative px-4 sm:px-6 py-5 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 dark:from-blue-500/30 dark:via-indigo-500/30 dark:to-purple-500/30 border-b-2 border-blue-200/50 dark:border-blue-700/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-xl ring-2 ring-blue-300/50 dark:ring-blue-600/50">
              <Video className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-sm sm:text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Camera Giao Thông</span>
          </CardTitle>
          {/* Connection Status */}
          {Object.keys(frameData).length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md backdrop-blur-sm ${
                Object.keys(trafficData).length > 0
                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 dark:from-green-500/30 dark:to-emerald-500/30 text-green-700 dark:text-green-400 border border-green-300/50 dark:border-green-600/50"
                  : "bg-gradient-to-r from-red-500/20 to-rose-500/20 dark:from-red-500/30 dark:to-rose-500/30 text-red-700 dark:text-red-400 border border-red-300/50 dark:border-red-600/50"
              }`}
            >
              {Object.keys(trafficData).length > 0 ? (
                <>
                  <Wifi className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>
                    Đang kết nối với {Object.keys(trafficData).length}/
                    {allowedRoads.length} camera
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Đang kết nối...</span>
                </>
              )}
            </motion.div>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative px-4 sm:px-6 py-4 max-h-[calc(100vh-12rem)] overflow-y-auto overscroll-contain custom-scrollbar">
        <div
          className={`grid gap-3 sm:gap-4 ${
            isFullscreen
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 lg:grid-cols-2"
          }`}
        >
          <AnimatePresence>
            {allowedRoads.map((roadName, index) => {
              const frame = frameData[roadName];
              const data = trafficData[roadName];
              const { color, icon: Icon, text } = getTrafficStatus(roadName);
              const { speedText, speedColor } = getSpeedStatus(roadName);
              const isSelected = selectedRoad === roadName;

              return (
                <motion.div
                  key={roadName}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{
                    opacity: 1,
                    scale: isSelected ? 1.03 : 1,
                    y: 0,
                    transition: { delay: index * 0.05, duration: 0.3 },
                  }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-300 cursor-pointer inline-block w-full mx-auto group ${
                    isSelected
                      ? "border-blue-500 dark:border-blue-400 shadow-2xl shadow-blue-500/40 ring-4 ring-blue-300/40 dark:ring-blue-600/40 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/30 dark:to-indigo-900/30"
                      : "border-blue-200/60 dark:border-gray-700/60 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-2xl hover:ring-2 hover:ring-blue-300/30 dark:hover:ring-blue-600/30 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
                  }`}
                  onClick={() => {
                    setModalRoadName(roadName);
                    setModalOpen(true);
                    if (setSelectedRoad) setSelectedRoad(roadName);
                  }}
                >
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${
                    isSelected
                      ? "opacity-100 from-blue-500/20 via-indigo-500/20 to-purple-500/20"
                      : "opacity-0 group-hover:opacity-100 from-blue-500/10 via-indigo-500/10 to-purple-500/10"
                  }`}></div>

                  {/* Video Frame (responsive) */}
                  <div className="relative w-full mx-auto max-w-lg aspect-[3/2] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                    {frame?.frame ? (
                      <motion.img
                        src={frame.frame}
                        alt={`Camera ${roadName}`}
                        className="w-full h-full object-contain block"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Video className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                        </motion.div>
                      </div>
                    )}

                    {/* Click to expand hint */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileHover={{ scale: 1, opacity: 1 }}
                        className="bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-md shadow-lg border border-gray-200/50 dark:border-gray-700/50"
                      >
                        Click để phóng to
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Info Panel (responsive) */}
                  <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-3 sm:p-4 border-t-2 border-blue-200/50 dark:border-blue-700/50">
                    <h3 className="font-bold text-sm sm:text-lg mb-3 flex items-center space-x-2">
                      <span className="truncate text-gray-900 dark:text-white">{roadName}</span>
                    </h3>

                    {/* Status Badges */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      {/* Mật độ Badge */}
                      <Badge
                        variant={getStatusBadgeVariant(color)}
                        className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 font-semibold shadow-sm ${
                          color === "red"
                            ? "bg-red-500 text-white"
                            : color === "yellow"
                            ? "bg-yellow-500 text-white"
                            : "bg-green-500 text-white"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{text}</span>
                      </Badge>

                      {/* Tốc độ Badge */}
                      {data && (
                        <Badge
                          variant="outline"
                          className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 font-semibold shadow-sm ${
                            speedColor === "green"
                              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                              : "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700"
                          }`}
                        >
                          <Gauge className="h-3.5 w-3.5" />
                          <span>{speedText}</span>
                        </Badge>
                      )}
                    </div>

                    {data ? (
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {/* Car Stats */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center space-x-2 sm:space-x-3 p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
                        >
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                            <Car className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Ô tô
                            </p>
                            <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                              {data.count_car}
                            </p>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {data.speed_car.toFixed(1)} km/h
                            </p>
                          </div>
                        </motion.div>

                        {/* Motorbike Stats */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center space-x-2 sm:space-x-3 p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl border border-green-200/50 dark:border-green-700/50"
                        >
                          <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
                            <Bike className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Xe máy
                            </p>
                            <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                              {data.count_motor}
                            </p>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {data.speed_motor.toFixed(1)} km/h
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-4 sm:py-6">
                        <div className="text-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Gauge className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mx-auto mb-2" />
                          </motion.div>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Đang tải dữ liệu...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>

      {/* Video Modal */}
      <VideoModal
        isOpen={modalOpen && !!modalRoadName}
        onClose={() => {
          setModalOpen(false);
          setModalRoadName("");
        }}
        roadName={modalRoadName}
        frameData={
          modalRoadName ? frameData[modalRoadName]?.frame || null : null
        }
        trafficData={modalRoadName ? trafficData[modalRoadName] : undefined}
      />
    </Card>
  );
};

export default VideoMonitor;
