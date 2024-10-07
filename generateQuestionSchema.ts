import process from "process";
import {zodToJsonSchema} from "zod-to-json-schema";
import fs from "node:fs";
import {qcmQuestion, questionBase, questionFileSchema, texteQuestion} from "@/lib/questionSchema.ts";

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
