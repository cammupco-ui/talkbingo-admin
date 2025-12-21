'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { DetailedRelationStat } from '@/app/actions';

interface StatsChartProps {
    data: DetailedRelationStat[];
    onBarClick: (subValue: string, level?: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function StatsChart({ data, onBarClick }: StatsChartProps) {
    const chartData = data.map(item => ({
        name: item.label,
        subValue: item.subValue,
        L1: item.levelCounts.L1,
        L2: item.levelCounts.L2,
        L3: item.levelCounts.L3,
        L4: item.levelCounts.L4,
        L5: item.levelCounts.L5,
        total: item.total
    })).filter(d => d.total > 0);

    return (
        <div className="h-[500px] w-full rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-semibold">관계별 질문 통계 (친밀도 1~5)</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                    barGap={2}
                    barCategoryGap="15%"
                    onClick={(state: any) => {
                        // Reliable click handler for the entire chart area
                        if (state && state.activePayload && state.activePayload.length > 0) {
                            const payload = state.activePayload[0].payload;
                            if (payload && payload.subValue) {
                                onBarClick(payload.subValue);
                            }
                        }
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={100}
                        fontSize={11}
                        style={{ cursor: 'pointer' }}
                        tick={{ fill: '#666' }}
                        onClick={(data: any) => {
                            if (data && data.value) {
                                const entry = chartData.find(d => d.name === data.value);
                                if (entry) onBarClick(entry.subValue);
                            }
                        }}
                    />
                    <YAxis tick={{ fill: '#666' }} fontSize={12} />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px', pointerEvents: 'none' }}
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        isAnimationActive={false}
                    />
                    <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="L1" fill="#3b82f6" stroke="#fff" strokeWidth={1} name="친밀도 1" cursor="pointer" radius={[2, 2, 0, 0]} onClick={(data: any) => onBarClick(data?.subValue || data?.payload?.subValue)} />
                    <Bar dataKey="L2" fill="#10b981" stroke="#fff" strokeWidth={1} name="친밀도 2" cursor="pointer" radius={[2, 2, 0, 0]} onClick={(data: any) => onBarClick(data?.subValue || data?.payload?.subValue)} />
                    <Bar dataKey="L3" fill="#f59e0b" stroke="#fff" strokeWidth={1} name="친밀도 3" cursor="pointer" radius={[2, 2, 0, 0]} onClick={(data: any) => onBarClick(data?.subValue || data?.payload?.subValue)} />
                    <Bar dataKey="L4" fill="#ef4444" stroke="#fff" strokeWidth={1} name="친밀도 4" cursor="pointer" radius={[2, 2, 0, 0]} onClick={(data: any) => onBarClick(data?.subValue || data?.payload?.subValue)} />
                    <Bar dataKey="L5" fill="#8b5cf6" stroke="#fff" strokeWidth={1} name="친밀도 5" cursor="pointer" radius={[2, 2, 0, 0]} onClick={(data: any) => onBarClick(data?.subValue || data?.payload?.subValue)} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
