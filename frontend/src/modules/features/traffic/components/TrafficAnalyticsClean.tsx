import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AlertCircle,
} from "lucide-react";

type VehicleData = {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
};
type TrafficData = Record<string, VehicleData>;
export type HistoricalData = { time: string; [key: string]: string | number };

interface Props {
  trafficData: TrafficData;
  allowedRoads: string[];
  historicalData?: HistoricalData[]; // optional external history from store
}

const INTERNAL_MAX = 60; // fallback cap for component-local history

const TrafficAnalytics: React.FC<Props> = ({
  trafficData,
  allowedRoads,
  historicalData,
}) => {
  // internal fallback history used only when `historicalData` prop isn't provided
  const [internalHistory, setInternalHistory] = useState<HistoricalData[]>([]);

  useEffect(() => {
    if (historicalData && Array.isArray(historicalData)) return; // store provides history
    if (Object.keys(trafficData).length === 0) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const newPoint: HistoricalData = {
      time: timeString,
      ...Object.entries(trafficData).reduce((acc, [road, d]) => {
        acc[`${road}_cars`] = d.count_car;
        acc[`${road}_motors`] = d.count_motor;
        acc[`${road}_car_speed`] = d.speed_car;
        acc[`${road}_motor_speed`] = d.speed_motor;
        acc[`${road}_total`] = d.count_car + d.count_motor;
        return acc;
      }, {} as Record<string, number>),
    };

    setInternalHistory((prev) => {
      // avoid duplicate consecutive points
      const last = prev[prev.length - 1];
      if (last && JSON.stringify(last) === JSON.stringify(newPoint))
        return prev;
      const next = [...prev, newPoint].slice(-INTERNAL_MAX);
      return next;
    });
  }, [trafficData, historicalData]);

  const trendsData =
    historicalData && Array.isArray(historicalData)
      ? historicalData
      : internalHistory;

  const vehicleCountData = useMemo(
    () =>
      allowedRoads.map((road) => {
        const d = trafficData[road];
        return {
          road: road.length > 12 ? `${road.slice(0, 12)}...` : road,
          fullRoad: road,
          cars: d?.count_car || 0,
          motors: d?.count_motor || 0,
          total: (d?.count_car || 0) + (d?.count_motor || 0),
        };
      }),
    [allowedRoads, trafficData]
  );

  const speedData = useMemo(
    () =>
      allowedRoads.map((road) => {
        const d = trafficData[road];
        return {
          road: road.length > 12 ? `${road.slice(0, 12)}...` : road,
          fullRoad: road,
          carSpeed: d?.speed_car || 0,
          motorSpeed: d?.speed_motor || 0,
        };
      }),
    [allowedRoads, trafficData]
  );

  const pieData = useMemo(
    () =>
      allowedRoads
        .map((road) => {
          const d = trafficData[road];
          const total = (d?.count_car || 0) + (d?.count_motor || 0);
          return {
            name: road,
            value: total,
            cars: d?.count_car || 0,
            motors: d?.count_motor || 0,
          };
        })
        .filter((i) => i.value > 0),
    [allowedRoads, trafficData]
  );

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <AlertCircle className="h-16 w-16 text-purple-400 mb-4" />
      </motion.div>
      <p className="text-gray-300 dark:text-gray-400 text-lg font-semibold">
        {message}
      </p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
        Dữ liệu sẽ xuất hiện khi hệ thống bắt đầu thu thập
      </p>
    </motion.div>
  );

  const hasData = Object.keys(trafficData).length > 0;

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8 sm:pb-12 overflow-y-auto custom-scrollbar">
      <div className="space-y-6 sm:space-y-8">
        <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-gradient-to-r from-slate-800/90 via-purple-900/90 to-slate-800/90 backdrop-blur-xl border border-purple-500/20 rounded-xl p-1 shadow-xl">
              <TabsTrigger
                value="overview"
                className="flex items-center space-x-2 text-xs sm:text-sm text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Tổng quan</span>
                <span className="sm:hidden">Tổng</span>
              </TabsTrigger>
              <TabsTrigger
                value="trends"
                className="flex items-center space-x-2 text-xs sm:text-sm text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                <LineChartIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Xu hướng</span>
                <span className="sm:hidden">Xu hướng</span>
              </TabsTrigger>
              <TabsTrigger
                value="distribution"
                className="flex items-center space-x-2 text-xs sm:text-sm text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                <PieChartIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Phân bố</span>
                <span className="sm:hidden">Phân bố</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {!hasData ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-0 bg-gradient-to-br from-slate-800/90 via-purple-900/90 to-slate-800/90 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.2),transparent)]"></div>
                <CardContent className="relative pt-6">
                  <EmptyState message="Chưa có dữ liệu giao thông" />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-0 bg-gradient-to-br from-slate-800/90 via-purple-900/90 to-slate-800/90 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden h-full">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.2),transparent)]"></div>
                  <CardHeader className="relative pb-4 border-b border-purple-500/20">
                    <CardTitle className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                      Số lượng xe theo tuyến đường
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative flex justify-center px-2 sm:px-4 py-4">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={vehicleCountData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#6B7280" opacity={0.2} />
                        <XAxis
                          dataKey="road"
                          tick={{ fontSize: 12, fill: "#E5E7EB" }}
                          angle={-15}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12, fill: "#E5E7EB" }} />
                        <Tooltip
                          formatter={(value, name) => [
                            value,
                            name === "cars" ? "Ô tô" : "Xe máy",
                          ]}
                          labelFormatter={(label) =>
                            vehicleCountData.find((d) => d.road === label)
                              ?.fullRoad || label
                          }
                          contentStyle={{
                            backgroundColor: "rgba(30, 41, 59, 0.95)",
                            border: "1px solid rgba(168, 85, 247, 0.3)",
                            borderRadius: 8,
                            color: "#E5E7EB",
                          }}
                        />
                        <Bar
                          dataKey="cars"
                          fill="#3B82F6"
                          name="cars"
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="motors"
                          fill="#10B981"
                          name="motors"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 bg-gradient-to-br from-slate-800/90 via-purple-900/90 to-slate-800/90 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden h-full">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.2),transparent)]"></div>
                  <CardHeader className="relative pb-4 border-b border-purple-500/20">
                    <CardTitle className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                      Tốc độ trung bình (km/h)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative flex justify-center px-2 sm:px-4 py-4">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={speedData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#6B7280" opacity={0.2} />
                        <XAxis
                          dataKey="road"
                          tick={{ fontSize: 12, fill: "#E5E7EB" }}
                          angle={-15}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12, fill: "#E5E7EB" }} />
                        <Tooltip
                          formatter={(value, name) => [
                            `${Number(value).toFixed(1)} km/h`,
                            name === "carSpeed" ? "Ô tô" : "Xe máy",
                          ]}
                          labelFormatter={(label) =>
                            speedData.find((d) => d.road === label)?.fullRoad ||
                            label
                          }
                          contentStyle={{
                            backgroundColor: "rgba(30, 41, 59, 0.95)",
                            border: "1px solid rgba(168, 85, 247, 0.3)",
                            borderRadius: 8,
                            color: "#E5E7EB",
                          }}
                        />
                        <Bar
                          dataKey="carSpeed"
                          fill="#F59E0B"
                          name="carSpeed"
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="motorSpeed"
                          fill="#8B5CF6"
                          name="motorSpeed"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 bg-gradient-to-br from-slate-800/90 via-purple-900/90 to-slate-800/90 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.2),transparent)]"></div>
              <CardHeader className="relative pb-4 border-b border-purple-500/20">
                <CardTitle className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                  Xu hướng giao thông theo thời gian
                </CardTitle>
              </CardHeader>
              <CardContent className="relative px-2 sm:px-4 py-4">
                {trendsData.length === 0 ? (
                  <EmptyState message="Chưa có dữ liệu lịch sử" />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trendsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#6B7280" opacity={0.2} />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#E5E7EB" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#E5E7EB" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(30, 41, 59, 0.95)",
                          border: "1px solid rgba(168, 85, 247, 0.3)",
                          borderRadius: 8,
                          color: "#E5E7EB",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#E5E7EB" }} />
                      {allowedRoads.map((road, index) => (
                        <Line
                          key={road}
                          type="monotone"
                          dataKey={`${road}_total`}
                          stroke={COLORS[index % COLORS.length]}
                          name={road}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="distribution">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 bg-gradient-to-br from-slate-800/90 via-purple-900/90 to-slate-800/90 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.2),transparent)]"></div>
              <CardHeader className="relative pb-4 border-b border-purple-500/20">
                <CardTitle className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                  Phân bố xe theo tuyến đường
                </CardTitle>
              </CardHeader>
              <CardContent className="relative px-2 sm:px-4 py-4">
                {pieData.length === 0 ? (
                  <EmptyState message="Chưa có dữ liệu phân bố" />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={window.innerWidth < 640 ? 100 : 130}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, _, props) => [
                          `${value} xe (${props.payload.cars} ô tô, ${props.payload.motors} xe máy)`,
                          "Tổng số xe",
                        ]}
                        contentStyle={{
                          backgroundColor: "rgba(30, 41, 59, 0.95)",
                          border: "1px solid rgba(168, 85, 247, 0.3)",
                          borderRadius: 8,
                          color: "#E5E7EB",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default TrafficAnalytics;
