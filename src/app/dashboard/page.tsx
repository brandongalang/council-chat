'use client';

import { useEffect, useState } from 'react';
import { DashboardStats } from '@/components/analytics/dashboard-stats';
import { UsageChart } from '@/components/analytics/usage-chart';
import { ModelBreakdown } from '@/components/analytics/model-breakdown';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics/usage')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch analytics:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading analytics...</div>;
    }

    if (!data) {
        return <div className="flex h-screen items-center justify-center">Failed to load data.</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/chat">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight">Usage Dashboard</h2>
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
