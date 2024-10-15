<script lang="ts">

    import {onMount} from 'svelte';


    import type {AllCours, CoursId, FullQuestion} from "@/lib/files.ts";
    import type {Difficulty, QuestionTag, QuestionType} from "@/lib/questionSchema.ts";

    import type {QcmFilters, PreSetFilters} from "@/lib/qcmFilters.ts";

    import "es-iterator-helpers/auto";
    import TagsFilter from "@/components/TagsFilter.svelte";
    import RunningQCM from "@/components/RunningQCM.svelte";
    import {questionSchema} from "@/lib/questionSchema.js";
    import {z} from "zod";

    export let all_questions: FullQuestion[];
    export let all_difficulty: Set<Difficulty>;
    export let all_tags: Set<QuestionTag>;
    export let all_types: Set<QuestionType>;
    export let arborescence_cours: AllCours;
    export let preSetFilters: PreSetFilters | null = null;
    export let defaultQuestionCount: number;
    export let defaultFilters: QcmFilters;


    const question_filters: QcmFilters = preSetFilters ?? defaultFilters;

    const prefiltered_qcm = preSetFilters != null;


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

    let ue_state_map: { [ue_id: string]: SelectionStatus } = {};
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
                question_filters.included_cours = new Set([...question_filters.included_cours, ...theme.cours.map(c => c.id)]);
            } else {
                question_filters.included_cours = new Set(question_filters.included_cours.values().filter(c => !theme.cours.some(tc => tc.id === c)));
            }
        }
    }

    function setUE(ue_id: string, value: any) {
        const ue = arborescence_cours.find(ue => ue.id === ue_id);
        if (ue) {
            ue.themes.forEach(t => {
                setTheme(t.id, value);
            });
        }
    }

    function setCours(cours_id: CoursId, value: boolean) {
        if (value) {
            question_filters.included_cours = new Set([...question_filters.included_cours, cours_id]);
        } else {
            question_filters.included_cours = new Set(question_filters.included_cours.values().filter(c => c !== cours_id));
        }
    }

    let questions_count_preview = 1;
    $: {
        questions_count_preview = filterQuestions(all_questions, question_filters).length;
        questions_count = Math.min(questions_count, questions_count_preview);
    }

    let questions_count = defaultQuestionCount;

    function filterQuestions(questions: FullQuestion[], filters: QcmFilters): FullQuestion[] {
        return questions.filter(q => {
            return filters.included_cours.has(q.cours_id) &&
                (filters.filtered_tags.size == 0 || filters.filtered_tags.values().some(t => q.tags.has(t))) &&
                !filters.excluded_tags.values().some(t => q.tags.has(t)) &&
                filters.included_difficulty.has(q.difficulty) &&
                filters.included_type.has(q.type);
        });
    }

    let qcm_running = false;

    function prepareQCM() {
        questions = filterQuestions(all_questions, question_filters)
            .sort(() => Math.random() - 0.5)
            .slice(0, questions_count);
        for (const q of questions) {
            if (q.type == "choices" && q.randomizeOrder) {
                q.options = q.options.values().toArray().sort(() => Math.random() - 0.5);
            }
        }
        qcm_running = true;
        if (!prefiltered_qcm) {
            console.log("here");
            localStorage.setItem("questions", JSON.stringify(questions, (_key, value) => (value instanceof Set ? [...value] : value)));
        }
    }

    function quitQCM() {
        questions = [];
        qcm_running = false;
        if (!prefiltered_qcm)
            localStorage.removeItem("questions");
    }


    let questions: FullQuestion[] = [];

    const difficultyMap: { [diff: Difficulty]: string } = {
        "easy": "Facile",
        "medium": "Moyen",
        "hard": "Difficile",
        "impossible": "Antagoniste"
    }

    const typeMap: { [type: QuestionType]: string } = {
        "choices": "QCM",
        "text": "Texte libre"
    }

    let mounted = false;

    onMount(() => {
        if (!prefiltered_qcm) {

            const localQuestions = localStorage.getItem("questions");
            if (localQuestions != null) {
                questions = z.array(questionSchema).parse(JSON.parse(localQuestions));
                console.log(questions);
                qcm_running = true;
            } else {
                localStorage.removeItem("questions");
                localStorage.removeItem("answers");
            }
        }
        mounted = true
        if (prefiltered_qcm && questions_count_preview == 0) {
            mounted = false
        }

    });


</script>

{#if prefiltered_qcm && !qcm_running}
    <div class=" my-2">
        <button class="d-block btn btn-primary w-50 m-auto mx-auto" on:click={prepareQCM}>Se tester
            avec {questions_count} questions sur {preSetFilters.context}</button>
    </div>
{/if}
{#if mounted}


    {#if (!qcm_running && !prefiltered_qcm)}
        <h2>Configuration du QCM</h2>

        <div class="row g-3 align-items-center my-2">
            <div class="col-auto">
                <label for="nombre_questions" class="form-label fs-4 fw-bold">Nombre de questions souhaitées</label>
            </div>
            <div class="col-auto">
                <input type="number" name="nombre_questions"
                       class="form-control border-primary border-1 border fw-bolder" aria-describedby="nombreHelpBlock"
                       bind:value={questions_count} min="1"
                       max={questions_count_preview}/>
            </div>
            <div class="col-auto">
                <span class="form-text"
                      id="nombreHelpBlock">Nombre de question correspondants aux filtres: {questions_count_preview}</span>
            </div>
        </div>


        <div class="hstack my-3 align-items-stretch overflow-x-auto gap-2 fs-4 ">
            <div class="card w-25 scroll-card">
                <div class="card-header"><h3 class="card-title text-center">Filtrer par tags</h3></div>
                <div class="card-body">
                    <TagsFilter dataset={all_tags} bind:included={question_filters.filtered_tags}
                                bind:excluded={question_filters.excluded_tags}/>
                </div>
            </div>
            <div class="card scroll-card">
                <div class="card-header"><h3 class="card-title text-center">Filtres par difficulté et type</h3></div>
                <div class="card-body">
                    <div class="mt-2">
                        <h3>Difficulté</h3>
                        {#each all_difficulty as difficulty}
                            <div class="form-check form-switch">
                                <input type="checkbox" class="form-check-input rounded-5" role="switch"
                                       name={difficulty} id={difficulty}
                                       on:change={(e) => {
                           if (e.target.checked) {
                               question_filters.included_difficulty = new Set([...question_filters.included_difficulty, difficulty])
                           } else {
                               question_filters.included_difficulty = new Set(question_filters.included_difficulty.values().filter(d => d !== difficulty))
                           }
                       }}
                                       checked={question_filters.included_difficulty.has(difficulty)}
                                ><label for="{difficulty}" class="form-check-label">
                                {difficultyMap[difficulty]}
                            </label>
                            </div>
                        {/each}
                    </div>

                    <div class="my-4">
                        <h3>Type</h3>
                        {#each all_types as type}
                            <div class="form-check form-switch">
                                <input class="form-check-input rounded-5" type="checkbox" role="switch" name={type}
                                       id={type}
                                       on:change={(e) => {
                           if (e.target.checked) {
                               question_filters.included_type = new Set([...question_filters.included_type, type])
                           } else {
                               question_filters.included_type = new Set(question_filters.included_type.values().filter(t => t !== type))
                           }
                       }}
                                       checked={question_filters.included_type.has(type)}
                                ><label for="{type}" class=form-check-label>{typeMap[type]}</label>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>

            <div class="card scroll-card">
                <div class="card-header"><h3 class="card-title d-inline-block text-center">Filtrer par
                    UE/Theme/Cours</h3></div>

                {#each arborescence_cours as ue}
                    <details class="list mx-3 mt-4" open>
                        <summary> <span class="form-check-inline"><input type="checkbox" class=form-check-input
                                                                         on:change={(e) =>  setUE(ue.id,e.target?.checked)}
                                                                         checked={ue_state_map[ue.id] === SelectionStatus.SELECTED || ue_state_map[ue.id] === SelectionStatus.INDETERMINATE}
                                                                         indeterminate={ue_state_map[ue.id] === SelectionStatus.INDETERMINATE}
                                                                         name={ue.id} id={ue.id}>
                        <label for="{ue.id}" class="form-check-label">UE&nbsp;: {ue.name}</label></span></summary>
                        {#each ue.themes as theme}
                            <details>
                                <summary><span class="form-check-inline"><input type="checkbox" class="form-check-input"
                                                                                on:change={(e) => setTheme(theme.id,e.target?.checked)}
                                                                                name={theme.id}
                                                                                checked={theme_state_map[theme.id] === SelectionStatus.SELECTED || theme_state_map[theme.id] === SelectionStatus.INDETERMINATE}
                                                                                indeterminate={theme_state_map[theme.id] === SelectionStatus.INDETERMINATE}
                                                                                id={theme.id}><label for="{theme.id}"
                                                                                                     class="form-check-label">Thème&nbsp;: {theme.name}</label>
                            </span>
                                </summary>
                                {#each theme.cours as cours}
                                    <div>
                                        <div class="form-check">
                                            <input type="checkbox" name={cours.id} id={cours.id}
                                                   class="form-check-input"
                                                   on:change={(e) => setCours(cours.id,e.target?.checked)}
                                                   checked={question_filters.included_cours.has(cours.id)}

                                            ><label
                                                for="{cours.id}" class="form-check-label">{cours.name}</label>
                                        </div>
                                    </div>
                                {/each}
                            </details>
                        {/each}
                    </details>
                {/each}
            </div>
        </div>

        <button class="btn btn-outline-primary mb-4" id="start-button"
                disabled={questions_count_preview === 0 || questions_count === 0}
                on:click={prepareQCM}>
            {(questions_count_preview === 0) ? "Aucune question ne correspond au filtres" : (questions_count === 0 ? "Il faut choisir au moins une question" : `Démarrer ${questions_count} questions`)}
        </button>
    {/if}
    {#if qcm_running}
        {#if questions.length === 0}
            <p>Aucune question ne correspond aux filtres</p>
        {:else}
            <RunningQCM questions={questions} save_answers={!prefiltered_qcm} quit={quitQCM}/>
        {/if}
    {/if}
{/if}

<style>
    .list :where(div, details) {
        margin-left: 1.25rem;
    }

    input[type="checkbox"] {
        margin-right: 5px;
    }


    @media screen and (orientation: landscape) {
        .scroll-card {
            flex: 1
        }
    }

    #start-button {
        margin-left: 50%;
        transform: translateX(-50%);
    }

    @media screen and (orientation: portrait), screen and (max-width: 768px) {

        .scroll-card {
            min-width: 85vw;
        }

    }
</style>