'use client';

import { useState, useEffect, useRef } from 'react';

interface CodeNameGeneratorProps {
    initialCodes: string[];
    onCodeChange: (codes: string[]) => void;
}

import { GENDER_PAIRS, RELATION_MAP, INTIMACY_LEVELS } from '@/app/constants';

export default function CodeNameGenerator({ initialCodes, onCodeChange }: CodeNameGeneratorProps) {
    const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
    const [selectedRels, setSelectedRels] = useState<string[]>([]);
    const [selectedSubs, setSelectedSubs] = useState<string[]>([]); // Multi-select SubRels now
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

    const [unmanagedCodes, setUnmanagedCodes] = useState<string[]>([]);
    const isInitializedString = useRef(false);

    // Initialization: Parse existing codes
    useEffect(() => {
        if (isInitializedString.current) return;

        const pairs = new Set<string>();
        const rels = new Set<string>();
        const subs = new Set<string>();
        const levels = new Set<string>();
        const unmanaged: string[] = [];

        initialCodes.forEach(code => {
            // Format: [MP]-[CP]-[IR]-[SubRel]-[Intimacy]
            const parts = code.split('-');

            if (parts.length === 5) {
                const pair = `${parts[0]}-${parts[1]}`;
                const rel = parts[2];
                const sub = parts[3];
                const level = parts[4];

                const validPair = GENDER_PAIRS.some(p => p.value === pair);
                const validRel = !!RELATION_MAP[rel];
                const validLevel = INTIMACY_LEVELS.includes(level);

                if (validPair && validRel && validLevel) {
                    pairs.add(pair);
                    rels.add(rel);
                    subs.add(sub);
                    levels.add(level);
                } else {
                    unmanaged.push(code);
                }
            } else {
                unmanaged.push(code);
            }
        });

        if (pairs.size > 0) setSelectedPairs(Array.from(pairs));
        if (rels.size > 0) setSelectedRels(Array.from(rels));
        if (subs.size > 0) setSelectedSubs(Array.from(subs));
        if (levels.size > 0) setSelectedLevels(Array.from(levels));

        setUnmanagedCodes(unmanaged);
        isInitializedString.current = true;
    }, [initialCodes]);

    // Validation: Clean up Selected Subs if Relation changes
    useEffect(() => {
        if (!isInitializedString.current) return;

        const validSubs = new Set<string>();
        selectedRels.forEach(r => {
            RELATION_MAP[r]?.subs.forEach(s => validSubs.add(s.value));
        });

        // Only update if we would actually remove something
        const filtered = selectedSubs.filter(s => validSubs.has(s));
        if (filtered.length !== selectedSubs.length) {
            setSelectedSubs(filtered);
        }
    }, [selectedRels, selectedSubs]);


    // Regeneration Effect
    useEffect(() => {
        if (!isInitializedString.current) return;

        const generated: string[] = [];
        const uniqueSet = new Set<string>(); // To prevent dupes if multiple paths yield same result

        selectedPairs.forEach(pair => {
            selectedRels.forEach(rel => {
                const relDef = RELATION_MAP[rel];
                if (!relDef) return;

                const applicableSubs = selectedSubs.filter(s =>
                    relDef.subs.some(def => def.value === s)
                );

                if (applicableSubs.length === 0) return;

                applicableSubs.forEach(sub => {
                    // Check Logic: Is this sub valid for this specific pair?
                    const subDef = relDef.subs.find(d => d.value === sub);
                    if (subDef?.validPairs && !subDef.validPairs.includes(pair)) {
                        return; // Skip invalid combination (e.g. M-M with Sister)
                    }

                    selectedLevels.forEach(level => {
                        const code = `${pair}-${rel}-${sub}-${level}`;
                        if (!uniqueSet.has(code)) {
                            uniqueSet.add(code);
                            generated.push(code);
                        }
                    });
                });
            });
        });

        const allCodes = [...unmanagedCodes, ...generated];

        // Final duplicate check
        const uniqueCodes = Array.from(new Set(allCodes));

        onCodeChange(uniqueCodes);

    }, [selectedPairs, selectedRels, selectedSubs, selectedLevels, unmanagedCodes, onCodeChange]);


    const toggleSelection = (list: string[], item: string, setList: (l: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    // Unified Button Styles - Smaller, Compact
    const baseBtnClass = "transition-all border shadow-sm font-medium text-xs px-3 py-1.5 rounded-md"; // Reduced padding and font size
    const selectedBtnClass = "bg-blue-600 border-blue-600 text-white shadow-md ring-1 ring-blue-100";
    const unselectedBtnClass = "bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400";

    return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-sm mt-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-800 text-sm">
                    Targeting Generator
                </h4>
            </div>

            <p className="text-xs text-gray-500 mb-4">
                Select options below to auto-generate code combinations.
            </p>

            <div className="space-y-6">
                {/* 1. GENDER */}
                <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">
                        1. Select Gender Pair(s)
                    </h5>
                    <div className="flex flex-wrap gap-2">
                        {GENDER_PAIRS.map(item => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => toggleSelection(selectedPairs, item.value, setSelectedPairs)}
                                className={`${baseBtnClass} ${selectedPairs.includes(item.value) ? selectedBtnClass : unselectedBtnClass}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. RELATION + SUB */}
                <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">
                        2. Select Relationship & Context
                    </h5>

                    {/* Relation Types */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(RELATION_MAP).map(([key, def]) => {
                            let isDisabled = false;
                            if (key === 'Lo' && selectedPairs.length > 0) {
                                const hasMixed = selectedPairs.some(p => ['M-F', 'F-M'].includes(p));
                                if (!hasMixed) isDisabled = true;
                            }

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => !isDisabled && toggleSelection(selectedRels, key, setSelectedRels)}
                                    className={`${baseBtnClass} 
                                        ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed' :
                                            selectedRels.includes(key) ? selectedBtnClass : unselectedBtnClass}`}
                                >
                                    {selectedRels.includes(key) && <span className="mr-1">✓</span>}
                                    {def.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Sub Relations (Dynamic) */}
                    {selectedRels.length > 0 && (
                        <div className="bg-white p-3 rounded-lg border border-dashed border-slate-300 animate-in fade-in zoom-in-95 duration-300">
                            <div className="text-[11px] font-medium text-slate-500 mb-2">
                                Specific Situations:
                            </div>

                            <div className="space-y-3">
                                {selectedRels.map(relKey => {
                                    const def = RELATION_MAP[relKey];
                                    const isFamily = relKey === 'Fa';

                                    return (
                                        <div key={relKey}>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{def.label} Situations</div>
                                            <div className={isFamily ? "grid grid-cols-5 gap-2 w-full" : "flex flex-wrap gap-2 w-full"}>
                                                {def.subs.map(sub => {
                                                    const isValid = selectedPairs.length === 0 || selectedPairs.some(p => !sub.validPairs || sub.validPairs.includes(p));

                                                    return (
                                                        <button
                                                            key={sub.value}
                                                            type="button"
                                                            disabled={!isValid}
                                                            onClick={() => isValid && toggleSelection(selectedSubs, sub.value, setSelectedSubs)}
                                                            className={`${baseBtnClass} 
                                                                ${!isValid ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-300 border-slate-100' :
                                                                    selectedSubs.includes(sub.value) ? selectedBtnClass : unselectedBtnClass} 
                                                                whitespace-normal text-left h-full flex items-center justify-center text-center`}
                                                        >
                                                            {sub.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. INTIMACY */}
                <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">
                        3. Select Intimacy Level(s)
                    </h5>
                    <div className="flex flex-wrap gap-2">
                        {INTIMACY_LEVELS.map(level => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => toggleSelection(selectedLevels, level, setSelectedLevels)}
                                className={`flex-1 min-w-[3rem] ${baseBtnClass} ${selectedLevels.includes(level) ? selectedBtnClass : unselectedBtnClass}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {unmanagedCodes.length > 0 && (
                    <div className="bg-amber-50 text-amber-800 px-3 py-2 rounded-md text-[11px] border border-amber-100">
                        <span className="font-bold block mb-0.5">Manual Codes Detected:</span>
                        We are preserving {unmanagedCodes.length} codes that don't match the current generator logic.
                    </div>
                )}
            </div>
        </div>
    );
}
