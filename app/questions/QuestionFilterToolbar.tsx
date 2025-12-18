'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import { GENDER_PAIRS, RELATION_MAP, INTIMACY_LEVELS } from '@/app/constants';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';

interface QuestionFilterToolbarProps {
    hideTypeSelector?: boolean;
}

export default function QuestionFilterToolbar({ hideTypeSelector }: QuestionFilterToolbarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Local State for standard filters
    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [type, setType] = useState(searchParams.get('type') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'created_desc');

    // Advanced Filters State
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [gender, setGender] = useState(searchParams.get('gender') || '');
    const [relation, setRelation] = useState(searchParams.get('relation') || '');
    const [sub, setSub] = useState(searchParams.get('sub') || '');
    const [level, setLevel] = useState(searchParams.get('level') || '');

    const createQueryString = useCallback((name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(name, value);
        } else {
            params.delete(name);
        }
        return params.toString();
    }, [searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const params = new URLSearchParams(searchParams.toString());
        if (search) params.set('q', search); else params.delete('q');
        if (type) params.set('type', type); else params.delete('type');
        if (sort) params.set('sort', sort); else params.delete('sort');

        // Advanced
        if (gender) params.set('gender', gender); else params.delete('gender');
        if (relation) params.set('relation', relation); else params.delete('relation');
        if (sub) params.set('sub', sub); else params.delete('sub');
        if (level) params.set('level', level); else params.delete('level');

        // Reset page on filter change
        params.delete('page');

        router.push(pathname + '?' + params.toString());
    };

    const clearFilters = () => {
        setSearch('');
        if (!hideTypeSelector) {
            setType('');
        }
        setSort('created_desc');
        setGender('');
        setRelation('');
        setSub('');
        setLevel('');

        // If we are in a panel (hideTypeSelector is true), we must persist the type in the URL
        if (hideTypeSelector && type) {
            const params = new URLSearchParams();
            params.set('type', type);
            router.push(pathname + '?' + params.toString());
        } else {
            router.push(pathname);
        }
    };

    const activeFilterCount = [gender, relation, sub, level].filter(Boolean).length;

    return (
        <div className="bg-white p-4 rounded-md border shadow-sm mb-6 space-y-4">
            <form onSubmit={handleSearch} className="space-y-4">
                {/* Top Row: Search + Sort + Basic Filter */}
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Search content..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    {hideTypeSelector ? (
                        <input type="hidden" name="type" value={type} />
                    ) : (
                        <div className="w-[150px]">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                            >
                                <option value="">All Types</option>
                                <option value="T">Truth</option>
                                <option value="B">Balance</option>
                                <option value="M">Mini Game</option>
                            </select>
                        </div>
                    )}

                    <div className="w-[180px]">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Sort By</label>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                        >
                            <option value="created_desc">Create Date (Newest)</option>
                            <option value="created_asc">Create Date (Oldest)</option>
                            <option value="updated_desc">Update Date (Newest)</option>
                            <option value="updated_asc">Update Date (Oldest)</option>
                            <option value="q_id_desc">ID (High to Low)</option>
                            <option value="q_id_asc">ID (Low to High)</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className={`px-4 py-2 border rounded-md text-sm font-medium flex items-center gap-2 transition-colors
                            ${isAdvancedOpen || activeFilterCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {activeFilterCount > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
                        {isAdvancedOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                        Apply
                    </button>

                    {(search || type || gender || relation || sub || level || sort !== 'created_desc') && (
                        <button type="button" onClick={clearFilters} className="text-gray-500 hover:text-red-600 p-2">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Advanced Filters (Collapsible) */}
                {isAdvancedOpen && (
                    <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Gender Pair</label>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full border rounded-md px-2 py-1.5 text-sm"
                            >
                                <option value="">Any Gender</option>
                                {GENDER_PAIRS.map(g => (
                                    <option key={g.value} value={g.value}>{g.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Relation</label>
                            <select
                                value={relation}
                                onChange={(e) => {
                                    setRelation(e.target.value);
                                    setSub(''); // Reset sub when relation changes
                                }}
                                className="w-full border rounded-md px-2 py-1.5 text-sm"
                            >
                                <option value="">Any Relation</option>
                                {Object.entries(RELATION_MAP).map(([key, def]) => (
                                    <option key={key} value={key}>{def.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Sub-Relation</label>
                            <select
                                value={sub}
                                onChange={(e) => setSub(e.target.value)}
                                disabled={!relation}
                                className={`w-full border rounded-md px-2 py-1.5 text-sm ${!relation ? 'bg-gray-100 opacity-50' : ''}`}
                            >
                                <option value="">Any Sub-Relation</option>
                                {relation && RELATION_MAP[relation]?.subs.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Intimacy</label>
                            <select
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="w-full border rounded-md px-2 py-1.5 text-sm"
                            >
                                <option value="">Any Level</option>
                                {INTIMACY_LEVELS.map(l => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
