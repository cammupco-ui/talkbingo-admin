export const GENDER_PAIRS = [
    { label: 'Male-Male', value: 'M-M' },
    { label: 'Female-Female', value: 'F-F' },
    { label: 'Male-Female', value: 'M-F' },
    { label: 'Female-Male', value: 'F-M' },
];

export const RELATION_MAP: Record<string, { label: string, subs: { label: string, value: string, validPairs?: string[] }[] }> = {
    'B': {
        label: 'Friend (B)',
        subs: [
            { label: 'Area/Hometown (Ar)', value: 'Ar' },
            { label: 'School (Sc)', value: 'Sc' },
            { label: 'Work/Org (Or)', value: 'Or' },
            { label: 'Daily/Social (Dc)', value: 'Dc' },
        ]
    },
    'Fa': {
        label: 'Family (Fa)',
        subs: [
            { label: 'Brother (Br)', value: 'Br', validPairs: ['M-M', 'F-M'] }, // Target Male
            { label: 'Sister (Si)', value: 'Si', validPairs: ['F-F', 'M-F'] }, // Target Female
            { label: 'Brother-Sister (Bs)', value: 'Bs', validPairs: ['M-F'] }, // Main M, Target F
            { label: 'Sister-Brother (Sb)', value: 'Sb', validPairs: ['F-M'] }, // Main F, Target M
            { label: 'Cousin (Co)', value: 'Co' },
            { label: 'Father-Son (Fs)', value: 'Fs', validPairs: ['M-M'] },
            { label: 'Father-Daughter (Fd)', value: 'Fd', validPairs: ['M-F'] },
            { label: 'Mother-Son (Ms)', value: 'Ms', validPairs: ['F-M'] },
            { label: 'Mother-Daughter (Md)', value: 'Md', validPairs: ['F-F'] },
            { label: 'Grandparent (Gp)', value: 'Gp' },
        ]
    },
    'Lo': {
        label: 'Lover (Lo)',
        subs: [
            { label: 'Sweet/Lover (Sw)', value: 'Sw', validPairs: ['M-F', 'F-M'] },
            { label: 'Girlfriend (Gw)', value: 'Gw', validPairs: ['M-F', 'F-M'] },
            { label: 'Husband-Wife (Hw)', value: 'Hw', validPairs: ['M-F'] }, // Main Husband
            { label: 'Partner-Wife (Pw)', value: 'Pw', validPairs: ['F-M'] }, // Main Wife
        ]
    }
};

export const INTIMACY_LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5'];
