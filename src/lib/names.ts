import type {Difficulty, QuestionType} from "@/lib/questionSchema.ts";



export const questions_map: { [type in QuestionType]: { icon: string, color_class: string, name: string } } = {
    "choices": {
        icon: "grommet-icons:multiple",
        color_class: "text-primary",
        name: "QCM"
    },
    "text": {
        icon: "mdi:text",
        color_class: "text-primary",
        name: "Texte libre"
    }
}

export const difficuly_map: { [diff in Difficulty]: { icon: string, color_class: string, name: string } } = {
    easy: {
        icon: "line-md:gauge-empty",
        color_class: "text-success",
        name: "Facile"
    },
    medium: {
        icon: "line-md:gauge-low",
        color_class: "text-warning",
        name: "Moyen"
    },
    hard: {
        icon: "line-md:gauge",
        color_class: "text-danger",
        name: "Difficile"
    },
    impossible: {
        icon: "line-md:gauge-full",
        color_class: "text-primary",
        name: "Antagoniste"
    }
}