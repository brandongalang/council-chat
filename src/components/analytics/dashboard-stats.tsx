import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, MessageSquare, Zap } from "lucide-react";

interface DashboardStatsProps {
    totalCost: number;
    totalTokens: number;
    totalChats: number;
}

export function DashboardStats({ totalCost, totalTokens, totalChats }: DashboardStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
                    <p className="text-xs text-muted-foreground">
                        Estimated cost from Council usage
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(totalTokens / 1000).toFixed(1)}k</div>
                    <p className="text-xs text-muted-foreground">
                        Across all models
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalChats}</div>
                    <p className="text-xs text-muted-foreground">
                        Active sessions
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
