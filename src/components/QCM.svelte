<script lang="ts">
    // import type {FullQuestion} from "@/lib/files.ts";
    //
    // export let questions: FullQuestion[]
    import {all_cours, all_difficulty, all_questions, all_tags, all_themes, all_types, all_ue} from "@/lib/files.ts";
    import type {QcmFilters} from "@/lib/qcmFilters.ts";

    export const default_filters: QcmFilters = {
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
    }

   const questions = all_questions.filter(q => {
        return default_filters.included_ue.includes(q.ue_id) &&
            !default_filters.excluded_ue.includes(q.ue_id) &&
            default_filters.included_themes.includes(q.theme_id) &&
            !default_filters.excluded_themes.includes(q.theme_id) &&
            default_filters.included_cours.includes(q.cours_id) &&
            !default_filters.excluded_cours.includes(q.cours_id) &&
            default_filters.included_tags.some(t => q.tags.includes(t)) &&
            !default_filters.excluded_tags.some(t => q.tags.includes(t)) &&
            default_filters.included_difficulty.includes(q.difficulte) &&
            !default_filters.excluded_difficulty.includes(q.difficulte) &&
            default_filters.included_type.includes(q.type) &&
            !default_filters.excluded_type.includes(q.type)
    })

    console.log("bonjour")
</script>

<p>TEST ({questions.length})</p>
<ul>{#each questions as question, i}<li>{i} - <pre>{JSON.stringify(question, null, 2)}</pre></li>{/each}</ul>

<style>

</style>