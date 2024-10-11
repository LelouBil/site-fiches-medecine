<script lang="ts">
    import type {AllCours, FullQuestion} from "@/lib/files.ts";
    import type {Difficulty, QuestionType} from "@/lib/questionSchema.ts";

    import type {QcmFilters} from "@/lib/qcmFilters.ts";

    export let all_questions: FullQuestion[];
    export let all_difficulty: Difficulty[];
    export let all_tags: string[];
    export let all_types: QuestionType[];
    export let arborescence_cours: AllCours;
    export let preSetFilters: QcmFilters | null = null;
    export let defaultFilters: QcmFilters;

    const question_filters: QcmFilters = preSetFilters ?? defaultFilters;


    enum SelectionStatus {
        SELECTED,
        UNSELECTED,
        INDETERMINATE
    }

    let theme_state_map: { [theme_id: string]: SelectionStatus } = {};
    $: theme_state_map = arborescence_cours.flatMap(ue => ue.themes).reduce((map: {
        [theme_id: string]: SelectionStatus
    }, theme) => {
        const selected_cours = theme.cours.filter(c => question_filters.included_cours.includes(c.id));
        if (selected_cours.length === 0) {
            map[theme.id] = SelectionStatus.UNSELECTED;
        } else if (selected_cours.length === theme.cours.length) {
            map[theme.id] = SelectionStatus.SELECTED;
        } else {
            map[theme.id] = SelectionStatus.INDETERMINATE;
        }
        return map;
    }, {});

    let ue_state_map: { [ue_id: string]: SelectionStatus } = {}
    $: ue_state_map = arborescence_cours.reduce((map: { [ue_id: string]: SelectionStatus }, ue) => {
        const selected_themes = ue.themes.filter(t => theme_state_map[t.id] === SelectionStatus.SELECTED);
        if (selected_themes.length === 0) {
            map[ue.id] = SelectionStatus.UNSELECTED;
        } else if (selected_themes.length === ue.themes.length) {
            map[ue.id] = SelectionStatus.SELECTED;
        } else {
            map[ue.id] = SelectionStatus.INDETERMINATE;
        }
        return map;
    }, {});


    function setTheme(theme_id: string, value: any) {
        console.log(theme_id, value)
        const theme = arborescence_cours.flatMap(ue => ue.themes).find(t => t.id === theme_id);
        if (theme) {
            if (value) {
                theme.cours.forEach(c => {
                    question_filters.included_cours.push(c.id)
                })
            } else {
                question_filters.included_cours = question_filters.included_cours.filter(c => !theme.cours.some(tc => tc.id === c))
            }
        }
    }

    function setUE(ue_id: string, value: any) {
        console.log(ue_id, value)
        const ue = arborescence_cours.find(ue => ue.id === ue_id);
        if (ue) {
            ue.themes.forEach(t => {
                setTheme(t.id, value)
            })
        }
    }

    function setCours(cours_id: string, value: boolean) {
        console.log(cours_id, value)
        if (value) {
            question_filters.included_cours.push(cours_id)
        } else {
            question_filters.included_cours = question_filters.included_cours.filter(c => c !== cours_id)
        }
    }

    let questions_count = 0;

    function prepareQCM() {
        questions = all_questions.filter(q => {
            return question_filters.included_cours.includes(q.cours_id) &&
                question_filters.filtered_tags.some(t => q.tags.includes(t)) &&
                !question_filters.excluded_tags.some(t => q.tags.includes(t)) &&
                question_filters.included_difficulty.includes(q.difficulty) &&
                question_filters.included_type.includes(q.type)
        })
    }


    let questions: FullQuestion[] = []

    if (preSetFilters != null) {
        prepareQCM()
    }


</script>


{#if questions.length === 0}
    <h2>SETUP DES FILTRES</h2>
    <h3>UEs</h3>

    <div class="list">

        {#each arborescence_cours as ue}
            <input type="checkbox" checked={ue_state_map[ue.id] === SelectionStatus.SELECTED}
                   on:change={(e) => setUE(ue.id,e.target?.checked)}
                   name={ue.id} id={ue.id}><label for="{ue.id}">{ue.name}</label>
            <div>
                {#each ue.themes as theme}
                    <input type="checkbox" checked={theme_state_map[theme.id] === SelectionStatus.SELECTED}
                           on:change={(e) => setTheme(theme.id,e.target?.checked)} name={theme.id}
                           id={theme.id}><label for="{theme.id}">{theme.name}</label>
                    <div>
                        {#each theme.cours as cours}
                            <input type="checkbox" name={cours.id} id={cours.id}
                                   checked={question_filters.included_cours.includes(cours.id)}
                                   on:change={(e) => setCours(cours.id,e.target?.checked)}

                            ><label
                                for="{cours.id}">{cours.name}</label>
                            <br/>
                        {/each}
                    </div>
                {/each}
            </div>
        {/each}
    </div>

    <!--    <input type="number" bind:>-->

    <pre>{JSON.stringify(question_filters.included_cours, null, 2)}</pre>
    <pre>{JSON.stringify(theme_state_map, null, 2)}</pre>
    <pre>{JSON.stringify(ue_state_map, null, 2)}</pre>

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
    .list div {
        margin-left: 1.25rem;
    }

    .list input[type="checkbox"] {
        margin-right: 5px;
    }
</style>