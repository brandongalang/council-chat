'use client';

import { useEffect, useState } from 'react';
import { DashboardStats } from '@/components/analytics/dashboard-stats';
import { UsageChart } from '@/components/analytics/usage-chart';
import { ModelBreakdown } from '@/components/analytics/model-breakdown';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AnalyticsData {
    totalChats: number;
    totalTokens: number;
    totalCost: number;
    dailyUsage: Array<{ date: string; tokens: number; cost: number }>;
    modelBreakdown: Array<{ modelId: string; cost: number; count: number }>;
}

export default function DashboardPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/analytics/usage');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <div className="text-muted-foreground">Failed to load data.</div>
                <Link href="/chat">
                    <Button variant="outline">Back to Chat</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div className="flex items-center gap-4">
                    <Link href="/chat">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                </div>
            </div>

            <DashboardStats
                totalCost={data.totalCost}
                totalTokens={data.totalTokens}
                totalChats={data.totalChats}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <UsageChart data={data.dailyUsage} />
                <ModelBreakdown data={data.modelBreakdown} />
            </div>
        </div>
    );
}
