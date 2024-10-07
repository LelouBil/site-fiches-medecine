import {z} from "zod"

const difficultyEnum = z.enum(["easy", "medium", "hard", "impossible"])
export type Difficulty = z.infer<typeof difficultyEnum>
const tagArray = z.array(z.string().min(1))

export const questionBase = z.object({
    text: z.string().min(1).describe("Le texte de la question"),
    difficulty: difficultyEnum.describe("La difficulté de la question"),
    tags: tagArray.describe("Les tags de la question")
}).required()

export const qcmQuestion = questionBase.merge(z.object({
    type: z.literal("choices").describe("Le type de question"),
    randomizeOrder: z.boolean().default(true).describe("Les propositions sont-elles dans un ordre aléatoire ?"),
    options: z.array(z.object({
        text: z.string().min(1).describe("Le texte de la proposition"),
        correct: z.boolean().describe("La proposition est-elle correcte ?")
    }))
        .min(2)
        .refine(data => data.some(option => option.correct), {
            message: "Il doit y avoir au moins une proposition correcte"
        })
        .describe("Les propositions de la question")
}))

export const texteQuestion = questionBase.merge(z.object({
    type: z.literal("text").describe("Le type de question"),
    answers: z.array(z.string().min(1)).min(1).describe("Les réponses de la question")
}))

export const questionSchema = z.discriminatedUnion("type", [qcmQuestion, texteQuestion])
export type QuestionType = z.infer<typeof questionSchema>["type"]

export const questionFileSchema = z.object({
    questions: z.array(questionSchema).min(1).describe("Les questions du fichier"),
    tags: tagArray.describe("Les tags communs à toutes les questions")
})


