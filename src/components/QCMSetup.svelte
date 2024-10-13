<script lang="ts">
    import type {AllCours, CoursId, FullQuestion} from "@/lib/files.ts";
    import type {Difficulty, QuestionTag, QuestionType} from "@/lib/questionSchema.ts";

    import type {QcmFilters} from "@/lib/qcmFilters.ts";

    import 'es-iterator-helpers/auto';
    import TagsFilter from "@/components/TagsFilter.svelte";
    import RunningQCM from "@/components/RunningQCM.svelte"; // flatmap
    export let all_questions: FullQuestion[];
    export let all_difficulty: Set<Difficulty>;
    export let all_tags: Set<QuestionTag>;
    export let all_types: Set<QuestionType>;
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
        const selected_cours = theme.cours.filter(c => question_filters.included_cours.has(c.id));
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
        const theme = arborescence_cours.flatMap(ue => ue.themes).find(t => t.id === theme_id);
        if (theme) {
            if (value) {
                question_filters.included_cours = new Set([...question_filters.included_cours, ...theme.cours.map(c => c.id)])
            } else {
                question_filters.included_cours = new Set(question_filters.included_cours.values().filter(c => !theme.cours.some(tc => tc.id === c)))
            }
        }
    }

    function setUE(ue_id: string, value: any) {
        const ue = arborescence_cours.find(ue => ue.id === ue_id);
        if (ue) {
            ue.themes.forEach(t => {
                setTheme(t.id, value)
            })
        }
    }

    function setCours(cours_id: CoursId, value: boolean) {
        if (value) {
            question_filters.included_cours = new Set([...question_filters.included_cours, cours_id])
        } else {
            question_filters.included_cours = new Set(question_filters.included_cours.values().filter(c => c !== cours_id))
        }
    }

    let questions_count_preview = 1;
    $: {
        questions_count_preview = filterQuestions(all_questions, question_filters).length;
        questions_count = Math.min(questions_count, questions_count_preview);
    }

    let questions_count = 0;

    function filterQuestions(questions: FullQuestion[], filters: QcmFilters): FullQuestion[] {
        return questions.filter(q => {
            return filters.included_cours.has(q.cours_id) &&
                (filters.filtered_tags.size == 0 || filters.filtered_tags.values().some(t => q.tags.has(t))) &&
                !filters.excluded_tags.values().some(t => q.tags.has(t)) &&
                filters.included_difficulty.has(q.difficulty) &&
                filters.included_type.has(q.type)
        })
    }


    let qcm_running = false
    function prepareQCM() {
        questions = filterQuestions(all_questions, question_filters)
            .sort(() => Math.random() - 0.5)
            .slice(0, questions_count)
        qcm_running = true
    }


    let questions: FullQuestion[] = []

    if (preSetFilters != null) {
        prepareQCM()
    }


</script>


{#if !qcm_running}
    <h2>Configuration du QCM</h2>

    <label for="nombre_questions">Nombre de questions souhaitées</label>
    <input type="number" name="nombre_questions" bind:value={questions_count} min="1" max={questions_count_preview}/>


    <p>Nombre de question correspondants aux filtres: {questions_count_preview}</p>

    <TagsFilter dataset={all_tags} bind:included={question_filters.filtered_tags}
                bind:excluded={question_filters.excluded_tags}/>

    <details class="list">
        <summary>Filter par difficulté</summary>
        {#each all_difficulty as difficulty}
            <div>
                <input type="checkbox" name={difficulty} id={difficulty}
                       on:change={(e) => {
                           if (e.target.checked) {
                               question_filters.included_difficulty = new Set([...question_filters.included_difficulty, difficulty])
                           } else {
                               question_filters.included_difficulty = new Set(question_filters.included_difficulty.values().filter(d => d !== difficulty))
                           }
                       }}
                       checked={question_filters.included_difficulty.has(difficulty)}
                ><label for="{difficulty}">{difficulty}</label>
            </div>
        {/each}
    </details>

    <details class="list">
        <summary>Filtrer par type de question</summary>
        {#each all_types as type}
            <div>
                <input type="checkbox" name={type} id={type}
                       on:change={(e) => {
                           if (e.target.checked) {
                               question_filters.included_type = new Set([...question_filters.included_type, type])
                           } else {
                               question_filters.included_type = new Set(question_filters.included_type.values().filter(t => t !== type))
                           }
                       }}
                       checked={question_filters.included_type.has(type)}
                ><label for="{type}">{type}</label>
            </div>
        {/each}
    </details>

    <details class="list">
        <summary><h3 class="d-inline-block">Filtrer par UE/Theme/Cours</h3></summary>

        {#each arborescence_cours as ue}
            <details>
                <summary><input type="checkbox"
                                on:change={(e) =>  setUE(ue.id,e.target?.checked)}
                                checked={ue_state_map[ue.id] === SelectionStatus.SELECTED || ue_state_map[ue.id] === SelectionStatus.INDETERMINATE}
                                indeterminate={ue_state_map[ue.id] === SelectionStatus.INDETERMINATE}
                                name={ue.id} id={ue.id}>
                    <label for="{ue.id}">{ue.name}</label></summary>
                {#each ue.themes as theme}
                    <details>
                        <summary><input type="checkbox"
                                        on:change={(e) => setTheme(theme.id,e.target?.checked)} name={theme.id}
                                        checked={theme_state_map[theme.id] === SelectionStatus.SELECTED || theme_state_map[theme.id] === SelectionStatus.INDETERMINATE}
                                        indeterminate={theme_state_map[theme.id] === SelectionStatus.INDETERMINATE}
                                        id={theme.id}><label for="{theme.id}">{theme.name}</label></summary>
                        {#each theme.cours as cours}
                            <div>
                                <div>
                                    <input type="checkbox" name={cours.id} id={cours.id}
                                           on:change={(e) => setCours(cours.id,e.target?.checked)}
                                           checked={question_filters.included_cours.has(cours.id)}

                                    ><label
                                        for="{cours.id}">{cours.name}</label><br/>
                                </div>
                            </div>
                        {/each}
                    </details>
                {/each}
            </details>
        {/each}
    </details>

    <button class="btn-info" on:click={prepareQCM}> Start</button>
{:else}
    {#if questions.length === 0}
        <p>Aucune question ne correspond aux filtres</p>
    {:else}
       <RunningQCM questions={questions}/>
    {/if}
{/if}

<style>
    .list :where(div, details) {
        margin-left: 1.25rem;
    }

    .list input[type="checkbox"] {
        margin-right: 5px;
    }
</style>