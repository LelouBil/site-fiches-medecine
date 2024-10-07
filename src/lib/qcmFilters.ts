import type {questionSchema} from "@/lib/questionSchema.ts";
import {z} from "zod";

type questionType = z.infer<typeof questionSchema>["type"]
type difficulty = z.infer<typeof questionSchema>["difficulty"]

export type QcmFilters = {
    included_ue: string[],
    excluded_ue: string[],
    included_themes: string[],
    excluded_themes: string[],
    included_cours: string[],
    excluded_cours: string[],
    included_tags: string[],
    excluded_tags: string[],
    included_difficulty: difficulty[],
    excluded_difficulty: difficulty[],
    included_type: questionType[],
    excluded_type: questionType[],
}