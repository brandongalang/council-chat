'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, MessageSquare, Zap } from 'lucide-react';

interface AnalyticsData {
    summary: {
        totalPromptTokens: number;
        totalCompletionTokens: number;
        totalCost: number;
        messageCount: number;
    };
    byModel: {
        model: string;
        count: number;
        cost: number;
    }[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="p-8">Loading analytics...</div>;
    }

    if (!data) {
        return <div className="p-8">Failed to load analytics.</div>;
    }

    const { summary, byModel } = data;

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">Usage and cost overview.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                        <Coins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${summary.totalCost?.toFixed(4) || '0.0000'}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {((summary.totalPromptTokens || 0) + (summary.totalCompletionTokens || 0)).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {summary.totalPromptTokens?.toLocaleString()} prompt + {summary.totalCompletionTokens?.toLocaleString()} completion
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Messages</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.messageCount?.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usage by Model</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {byModel.map((item) => (
                            <div key={item.model} className="flex items-center justify-between border-b pb-2 last:border-0">
                                <div>
                                    <div className="font-medium">{item.model}</div>
                                    <div className="text-sm text-muted-foreground">{item.count} messages</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">${item.cost?.toFixed(5) || '0.00000'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
