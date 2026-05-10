"use client";

import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import apiClient from '@/lib/api/client';
import { useSocket } from '@/hooks/useSocket';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';

interface RealtimeChartProps {
  title: string;
  description?: string;
  endpoint: string;
  socketEvent: string;
  type: 'line' | 'bar' | 'area' | 'pie' | 'radar';
  dataKey: string | string[];
  xAxisKey: string;
  color?: string;
  colors?: string[];
  dataProperty?: string;
}

const GLASS_STYLE = "bg-card border shadow-sm hover:shadow-md transition-shadow";

export const RealtimeChart: React.FC<RealtimeChartProps> = ({
  title,
  description,
  endpoint,
  socketEvent,
  type,
  dataKey,
  xAxisKey,
  color = "var(--primary)",
  colors = ["oklch(0.55 0.18 240)", "oklch(0.6 0.118 184)", "oklch(0.4 0.07 227)", "oklch(0.8 0.15 230)", "oklch(0.7 0.15 200)"],
  dataProperty
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      const response = await apiClient.get(endpoint);
      const result = response.data;
      
      if (result.success || result.trend || result.data) {
        // Handle specific data property if provided, otherwise fallback to standard keys
        let plotData = [];
        if (dataProperty && result[dataProperty]) {
          plotData = result[dataProperty];
        } else {
          plotData = result.trend || result.data || result.performance || result.marks ||
            result.categories || result.attendanceTrend || result.leaveDistribution ||
            result.modes || result.subjectAverages || result.stats || [];
        }
        setData(plotData);
      }
    } catch (error) {
      console.error(`Error fetching graph data for ${title}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.on(socketEvent, () => {
        fetchData(); // Simplest approach for consistency
      });
    }

    return () => {
      if (socket) {
        socket.off(socketEvent);
      }
    };
  }, [socket, endpoint, socketEvent, title]);

  const renderChart = () => {
    const textColor = 'var(--muted-foreground)';
    const gridColor = 'var(--border)';

    switch (type) {
      case 'line':
        const lineDataKeys = Array.isArray(dataKey) ? dataKey : [dataKey];
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'var(--card)' }} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
            {lineDataKeys.map((key, index) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={colors[index % colors.length] || color} 
                strokeWidth={3} 
                dot={{ r: 4, fill: colors[index % colors.length] || color, strokeWidth: 2, stroke: 'var(--card)' }} 
                activeDot={{ r: 6, strokeWidth: 0 }} 
                animationDuration={1500} 
              />
            ))}
          </LineChart>
        );
      case 'bar':
        const barDataKeys = Array.isArray(dataKey) ? dataKey : [dataKey];
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
            <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'var(--card)' }} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
            {barDataKeys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={colors[index % colors.length] || color} 
                radius={[4, 4, 0, 0]} 
                barSize={barDataKeys.length > 1 ? 20 : 40} 
                animationDuration={1500} 
              />
            ))}
          </BarChart>
        );
      case 'area':
        const areaDataKeys = Array.isArray(dataKey) ? dataKey : [dataKey];
        const mainId = Array.isArray(dataKey) ? dataKey[0] : dataKey;
        return (
          <AreaChart data={data}>
            <defs>
              {areaDataKeys.map((key, index) => (
                <linearGradient key={`grad-${key}`} id={`colorGradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[index % colors.length] || color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[index % colors.length] || color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'var(--card)' }} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
            {areaDataKeys.map((key, index) => (
              <Area 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={colors[index % colors.length] || color} 
                strokeWidth={3} 
                fillOpacity={1} 
                fill={`url(#colorGradient-${key})`} 
                animationDuration={1500} 
              />
            ))}
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={8}
              dataKey={Array.isArray(dataKey) ? dataKey[0] : (dataKey as any)}
              nameKey={xAxisKey}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="var(--card)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'var(--card)' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        );
      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis dataKey={xAxisKey} tick={{ fill: textColor, fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            {Array.isArray(dataKey) ? (
              dataKey.map((key: string, index: number) => (
                <Radar 
                  key={key} 
                  name={key} 
                  dataKey={key} 
                  stroke={colors[index % colors.length] || color} 
                  fill={colors[index % colors.length] || color} 
                  fillOpacity={0.4} 
                  animationDuration={1500} 
                />
              ))
            ) : (
              <Radar name={title} dataKey={dataKey as any} stroke={color} fill={color} fillOpacity={0.4} animationDuration={1500} />
            )}
            <Tooltip contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'var(--card)' }} />
          </RadarChart>
        );
      default:
        return <></>;
    }
  };

  const hasData = data.length > 0;

  return (
    <Card className={cn(GLASS_STYLE, "overflow-hidden group")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-foreground">
          {title}
        </CardTitle>
        {description && <CardDescription className="text-muted-foreground">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full mt-4 flex items-center justify-center">
          {loading ? (
            <Skeleton className="h-[280px] w-full rounded-xl bg-muted/50" />
          ) : !hasData ? (
            <div className="flex items-center justify-center h-full text-muted-foreground italic">
              No data available for visualization
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart() as React.ReactElement}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
