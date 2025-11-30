import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ModelBreakdownProps {
    data: { modelId: string; cost: number; count: number }[];
}

export function ModelBreakdown({ data }: ModelBreakdownProps) {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Top Models by Cost</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {data.map((item) => (
                        <div key={item.modelId} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>{item.modelId[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{item.modelId.split('/').pop()}</p>
                                <p className="text-xs text-muted-foreground">
                                    {item.count} responses
                                </p>
                            </div>
                            <div className="ml-auto font-medium">
                                ${item.cost.toFixed(4)}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
