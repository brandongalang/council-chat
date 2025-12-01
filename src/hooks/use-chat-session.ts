import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CouncilMember, Preset } from '@/types/council';
import { DEFAULT_JUDGE_MODEL } from '@/constants/council';

export function useChatSession() {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

    useEffect(() => {
        fetchPresets();
    }, []);

    const fetchPresets = async () => {
        try {
            const res = await fetch('/api/councils');
            if (res.ok) {
                const data = await res.json();
                setPresets(data);
            }
        } catch (error) {
            console.error('Failed to fetch presets:', error);
        }
    };

    const savePreset = async (
        name: string,
        judgeModel: string,
        judgePrompt: string,
        members: CouncilMember[]
    ) => {
        try {
            const res = await fetch('/api/councils', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description: '',
                    judgeModel,
                    members,
                    judgePrompt
                })
            });

            if (res.ok) {
                const newPreset = await res.json();
                toast.success('Preset saved');
                await fetchPresets();
                setSelectedPresetId(newPreset.id);
                return true;
            } else {
                toast.error('Failed to save preset');
                return false;
            }
        } catch (error) {
            toast.error('Error saving preset');
            return false;
        }
    };

    const deletePreset = async (presetId: string) => {
        try {
            const res = await fetch(`/api/councils/${presetId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Preset deleted');
                fetchPresets();
                if (selectedPresetId === presetId) {
                    setSelectedPresetId(null);
                }
            }
        } catch (error) {
            toast.error('Error deleting preset');
        }
    };

    return {
        presets,
        selectedPresetId,
        setSelectedPresetId,
        fetchPresets,
        savePreset,
        deletePreset
    };
}
