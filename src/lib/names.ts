import type {Difficulty, QuestionType} from "@/lib/questionSchema.ts";

export const questionTypeNames: { [type in QuestionType]: string } = {
    "choices": "QCM",
    "text": "Texte libre"
}
export const questionDifficultyNames: { [diff in Difficulty]: string } = {
    "easy": "Facile",
    "medium": "Moyen",
    "hard": "Difficile",
    "impossible": "Antagoniste"
}