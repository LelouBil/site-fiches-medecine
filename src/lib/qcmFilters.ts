import type {Difficulty, QuestionType} from "@/lib/questionSchema.ts";
import {all_difficulty, all_tags, all_types, arborescence_cours} from "@/lib/files.ts";


export const defaultFilters : QcmFilters = {
    included_cours: arborescence_cours.flatMap(ue => ue.themes.flatMap(theme => theme.cours.map(cours => cours.id))),
    filtered_tags: all_tags,
    excluded_tags: [],
    included_difficulty: all_difficulty,
    included_type: all_types,
};

export type QcmFilters = {
    included_cours: string[],
    filtered_tags: string[],
    excluded_tags: string[],
    included_difficulty: Difficulty[],
    included_type: QuestionType[],
}