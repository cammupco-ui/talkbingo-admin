'use client';

import { useState } from 'react';
import { checkSpelling } from '@/app/actions';

interface SpellCheckInputProps {
    label?: string; // Optional because sometimes layout handles label
    value: string;
    onChange: (value: string) => void;
    name?: string;
    multiline?: boolean;
    required?: boolean;
    placeholder?: string;
    rows?: number;
    className?: string;
    labelClassName?: string;
}

export default function SpellCheckInput({
    label,
    value,
    onChange,
    name,
    multiline = false,
    required = false,
    placeholder,
    rows = 3,
    className = "",
    labelClassName = "block text-sm font-medium text-gray-700"
}: SpellCheckInputProps) {
    const [isChecking, setIsChecking] = useState(false);
    const [errors, setErrors] = useState<{ token: string, suggestions: string[], info: string }[]>([]);

    const handleCheck = async () => {
        if (!value.trim()) return;
        setIsChecking(true);
        setErrors([]);
        try {
            const res = await checkSpelling(value);
            setErrors(res);
            if (res.length === 0) {
                alert("맞춤법 오류가 없습니다!");
            }
        } catch (e) {
            console.error("Spell Check Error", e);
            alert("검사 중 오류가 발생했습니다.");
        } finally {
            setIsChecking(false);
        }
    };

    const applyCorrection = (original: string, correction: string) => {
        // Naive replace: replaces first occurrence. 
        // Can be improved if we had indices, but PNU/Daum result context is limited.
        const newValue = value.replace(original, correction);
        onChange(newValue);

        // Remove corrected error
        setErrors(prev => prev.filter(e => e.token !== original));
    };

    return (
        <div className={className}>
            {label && (
                <div className="flex justify-between items-center mb-1">
                    <label className={labelClassName}>{label}</label>
                    <button
                        type="button"
                        onClick={handleCheck}
                        disabled={isChecking}
                        className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 text-slate-600 flex items-center gap-1 transition-colors"
                    >
                        {isChecking ? 'Checking...' : '맞춤법 검사'}
                    </button>
                </div>
            )}

            {/* If no label, we might want the button somewhere else? 
                For now assuming label is always provided or we add button above input if label hidden 
                But let's stick to label usage for now. If label is missing, user didn't ask for button without label.
            */}

            {multiline ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    rows={rows}
                    placeholder={placeholder}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            ) : (
                <input
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    placeholder={placeholder}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            )}

            {/* Error Display */}
            {errors.length > 0 && (
                <div className="mt-2 p-3 bg-red-50 rounded-md border border-red-100 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-red-600 text-xs">맞춤법 오류 발견 ({errors.length})</p>
                        <button type="button" onClick={() => setErrors([])} className="text-xs text-red-400 hover:text-red-600">닫기</button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {errors.map((error, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-2 border-b border-red-100 pb-2 last:border-0 last:pb-0">
                                <div className="text-red-500 font-medium whitespace-nowrap line-through decoration-red-400 text-xs mt-0.5">
                                    {error.token}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap gap-1 mb-1">
                                        {error.suggestions.map((suggestion, sIdx) => (
                                            <button
                                                key={sIdx}
                                                type="button"
                                                onClick={() => applyCorrection(error.token, suggestion)}
                                                className="px-2 py-0.5 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-medium transition-colors"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                    {error.info && <p className="text-[10px] text-slate-500 leading-snug">{error.info.substring(0, 100)}{error.info.length > 100 && '...'}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
