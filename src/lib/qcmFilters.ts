import type {Difficulty, QuestionType} from "@/lib/questionSchema.ts";
import {all_cours, all_difficulty, all_tags, all_themes, all_types, all_ue} from "@/lib/files.ts";


export const defaultFilters : QcmFilters = {
    included_ue: all_ue,
        excluded_ue: [],
    included_themes: all_themes,
    excluded_themes: [],
    included_cours: all_cours,
    excluded_cours: [],
    included_tags: all_tags,
    excluded_tags: [],
    included_difficulty: all_difficulty,
    excluded_difficulty: [],
    included_type: all_types,
    excluded_type: []
};

export type QcmFilters = {
    included_ue: string[],
    excluded_ue: string[],
    included_themes: string[],
    excluded_themes: string[],
    included_cours: string[],
    excluded_cours: string[],
    included_tags: string[],
    excluded_tags: string[],
    included_difficulty: Difficulty[],
    excluded_difficulty: Difficulty[],
    included_type: QuestionType[],
    excluded_type: QuestionType[],
}