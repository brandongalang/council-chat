import { NextResponse } from 'next/server';
import { ModelRate, INITIAL_PRICING } from '@/lib/model-pricing';

type PricingFields = {
    prompt?: string | number;
    completion?: string | number;
};

type OpenRouterPricingModel = {
    id: string;
    pricing?: PricingFields;
};

type OpenRouterPricingResponse = {
    data?: OpenRouterPricingModel[];
};

// Simple in-memory cache
let pricingCache: Record<string, ModelRate> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET() {
    const now = Date.now();

    // Return cached data if valid
    if (pricingCache && (now - lastFetchTime < CACHE_TTL)) {
        return NextResponse.json(pricingCache);
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models');

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json() as OpenRouterPricingResponse;
        const newPricing: Record<string, ModelRate> = { ...INITIAL_PRICING };

        // Parse OpenRouter response
        if (data.data && Array.isArray(data.data)) {
            data.data.forEach((model) => {
                if (model.pricing) {
                    const promptRate = typeof model.pricing.prompt === 'number'
                        ? model.pricing.prompt
                        : parseFloat(model.pricing.prompt ?? '');
                    const completionRate = typeof model.pricing.completion === 'number'
                        ? model.pricing.completion
                        : parseFloat(model.pricing.completion ?? '');

                    // OpenRouter pricing is usually per token string, need to convert to per 1M
                    // But wait, their API usually returns something like "0.000001" per token
                    // Let's check the format. Usually it's:
                    // pricing: { prompt: "0.000005", completion: "0.000015" }

                    const inputRate = promptRate * 1_000_000;
                    const outputRate = completionRate * 1_000_000;

                    if (Number.isFinite(inputRate) && Number.isFinite(outputRate)) {
                        newPricing[model.id] = {
                            input: inputRate,
                            output: outputRate
                        };
                    }
                }
            });
        }

        // Update cache
        pricingCache = newPricing;
        lastFetchTime = now;

        return NextResponse.json(newPricing);
    } catch (error) {
        console.error('Failed to fetch pricing:', error);
        // Return initial pricing as fallback
        return NextResponse.json(INITIAL_PRICING);
    }
}
