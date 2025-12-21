export type QuestionType = 'T' | 'B' | 'M';

export interface BaseQuestion {
    elementId?: string; // Neo4j internal ID
    q_id: string; // T25-00001
    type: QuestionType;
    content: string;
    created_at?: string;
    code_names?: string[]; // ["F-F-B-Ar-L1"]
    updated_at?: string;
    is_published?: boolean;

    // UI Properties
    ui_theme?: string;
    icon_asset?: string;
    lottie_url?: string;
    layout_type?: string;
}

export interface TruthQuestion extends BaseQuestion {
    type: 'T';
    answers?: string;
    keyword?: string[];
}

export interface BalanceQuestion extends BaseQuestion {
    type: 'B';
    choice_a: string;
    choice_b: string;
    stats_a?: number;
    stats_b?: number;
}

export interface MiniGameQuestion extends BaseQuestion {
    type: 'M';
    game_code: string;
    difficulty?: number;
    config?: string; // JSON
    asset_url?: string;
}

export type Question = TruthQuestion | BalanceQuestion | MiniGameQuestion;

export interface QuestionFilter {
    type?: QuestionType;
    search?: string;
    limit?: number;
    skip?: number;
    sort?: 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc' | 'q_id_desc' | 'q_id_asc';
    codeFilters?: {
        gender?: string;
        relation?: string;
        sub?: string;
        level?: string;
    };
}
