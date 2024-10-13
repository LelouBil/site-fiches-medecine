import type {Difficulty, QuestionTag, QuestionType} from "@/lib/questionSchema.ts";
import {all_difficulty, all_tags, all_types, arborescence_cours, type CoursId} from "@/lib/files.ts";


export const defaultFilters : QcmFilters = {
    included_cours: new Set(arborescence_cours.flatMap(ue => ue.themes.flatMap(theme => theme.cours.map(cours => cours.id)))),
    filtered_tags: new Set<QuestionTag>(),
    excluded_tags: new Set(),
    included_difficulty: all_difficulty,
    included_type: all_types,
};

export type QcmFilters = {
    included_cours: Set<CoursId>,
    filtered_tags: Set<QuestionTag>,
    excluded_tags: Set<QuestionTag>,
    included_difficulty: Set<Difficulty>,
    included_type: Set<QuestionType>,
}