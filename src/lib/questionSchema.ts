import {z, ZodArray, type ZodTypeAny} from "zod"

const difficultyEnum = z.enum(["easy", "medium", "hard", "impossible"])
export type Difficulty = z.infer<typeof difficultyEnum>

export type QuestionTag = z.infer<typeof tagString>

const tagString = z.string().min(1).brand("QuestionTag")
let schema = z.array(tagString);
const tagArray = uniqueArraySet<typeof tagString,typeof schema>(schema)


function uniqueArraySet<U extends ZodTypeAny,T extends ZodArray<U>>(schema: T) {
    return schema
        .refine((items) => new Set(items).size === items.length, {
            message: 'All items must be unique, no duplicate values allowed',
        }).transform(items => new Set(items))
        .pipe(z.set(schema.element))
}

export const questionBase = z.object({
    text: z.string().min(1).describe("Le texte de la question"),
    difficulty: difficultyEnum.describe("La difficulté de la question"),
    tags: tagArray.describe("Les tags de la question")
}).required()

let questionOption = z.object({
    text: z.string().min(1).describe("Le texte de la proposition"),
    correct: z.boolean().describe("La proposition est-elle correcte ?")
});
let optionArray = z.array(questionOption);
export const qcmQuestion = questionBase.merge(z.object({
    type: z.literal("choices").describe("Le type de question"),
    randomizeOrder: z.boolean().default(true).describe("Les propositions sont-elles dans un ordre aléatoire ?"),
    options: uniqueArraySet<typeof questionOption,typeof optionArray>(optionArray
            .min(2)
    )
        .refine(data => [...data].some(option => option.correct), {
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


