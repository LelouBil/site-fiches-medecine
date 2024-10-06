import {z} from "zod"
import * as process from "process";
import {zodToJsonSchema} from "zod-to-json-schema";
import * as fs from "node:fs";


const difficultyEnum = z.enum(["facile", "moyen", "difficile", "impossible"])

const tagArray = z.array(z.string().min(1))

const questionBase = z.object({
    texte: z.string().min(1).describe("Le texte de la question"),
    difficulte: difficultyEnum.describe("La difficulté de la question"),
    tags: tagArray.describe("Les tags de la question")
}).required()

const qcmQuestion = questionBase.merge(z.object({
    type: z.literal("qcm").describe("Le type de question"),
    options: z.array(z.object({
        texte: z.string().min(1).describe("Le texte de la proposition"),
        correcte: z.boolean().describe("La proposition est-elle correcte ?")
    }))
        .min(2)
        .refine(data => data.some(option => option.correcte), {
            message: "Il doit y avoir au moins une proposition correcte"
        })
        .describe("Les propositions de la question")
}))

const texteQuestion = questionBase.merge(z.object({
    type: z.literal("texte").describe("Le type de question"),
    reponses: z.array(z.string().min(1)).min(1).describe("Les réponses de la question")
}))

const questionSchema = z.discriminatedUnion("type", [qcmQuestion, texteQuestion])

export const questionFileSchema = z.object({
    questions: z.array(questionSchema).min(1).describe("Les questions du fichier"),
    tags: tagArray.describe("Les tags communs à toutes les questions")
})

if (process.argv[2] == "schema" && process.argv.length == 4) {
    const schema = deepRemoveKeys(zodToJsonSchema(questionFileSchema, {
        definitions: {questionBase, qcmQuestion, texteQuestion},
        name: "Question",
        removeAdditionalStrategy: "strict"
    }),{additionalProperties: false})
    fs.writeFileSync(process.argv[3]!, JSON.stringify(schema, null, 2))
}

// @ts-ignore
function deepRemoveKeys(obj, exclude) {
    if (obj instanceof Array) {
        // @ts-ignore
        return obj.map((i) => deepRemoveKeys(i, exclude));
    }
    if (typeof obj === "object") {
        return Object.fromEntries(
            Object.entries(obj)
                .filter(
                    ([k, v]) => !(k in exclude && (exclude[k] === undefined || exclude[k] === v))
                )
                // @ts-ignore
                .map(([k, v]) => [k, deepRemoveKeys(v, exclude)])
        );
    }
    return obj;
}
