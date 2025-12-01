'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ModelBreakdownProps {
    data: Array<{
        modelId: string;
        cost: number;
        count: number;
    }>;
}

export function ModelBreakdown({ data }: ModelBreakdownProps) {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Cost by Model</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Model</TableHead>
                            <TableHead className="text-right">Calls</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow key={item.modelId}>
                                <TableCell className="font-medium text-xs font-mono">{item.modelId.split('/').pop()}</TableCell>
                                <TableCell className="text-right">{item.count}</TableCell>
                                <TableCell className="text-right">${item.cost.toFixed(4)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
