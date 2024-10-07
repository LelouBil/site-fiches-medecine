<script lang="ts">
    import type {FullQuestion} from "@/lib/files.ts";
    import type {Difficulty, QuestionType} from "@/lib/questionSchema.ts";

    import type {QcmFilters} from "@/lib/qcmFilters.ts";

    export let all_questions: FullQuestion[];
    export let all_cours: string[];
    export let all_difficulty: Difficulty[];
    export let all_tags: string[];
    export let all_themes: string[];
    export let all_types: QuestionType[];
    export let all_ue: string[];
    export let preSetFilters: QcmFilters | null = null;
    export let defaultFilters: QcmFilters;

    const question_filters: QcmFilters = preSetFilters ?? defaultFilters;



    function prepareQCM() {
        questions = all_questions.filter(q => {
            return question_filters.included_ue.includes(q.ue_id) &&
                !question_filters.excluded_ue.includes(q.ue_id) &&
                question_filters.included_themes.includes(q.theme_id) &&
                !question_filters.excluded_themes.includes(q.theme_id) &&
                question_filters.included_cours.includes(q.cours_id) &&
                !question_filters.excluded_cours.includes(q.cours_id) &&
                question_filters.included_tags.some(t => q.tags.includes(t)) &&
                !question_filters.excluded_tags.some(t => q.tags.includes(t)) &&
                question_filters.included_difficulty.includes(q.difficulty) &&
                !question_filters.excluded_difficulty.includes(q.difficulty) &&
                question_filters.included_type.includes(q.type) &&
                !question_filters.excluded_type.includes(q.type)
        })
    }


    let questions: FullQuestion[] = []

    if (preSetFilters != null) {
        prepareQCM()
    }

</script>


{#if questions.length === 0}
    <p>SETUP DES FILTRES</p>
    <button on:click={prepareQCM}> Start</button>
{:else}
    <p>QCM ({questions.length})</p>
    <ul>
        {#each questions as question, i}
            <li>{i} -
                <pre>{JSON.stringify(question, null, 2)}</pre>
            </li>
        {/each}
    </ul>

{/if}
<style>

</style>