<script lang="ts">

    import {onMount} from 'svelte';


    import type {AllCours, CoursId, FullQuestion} from "@/lib/files.ts";
    import type {Difficulty, QuestionTag, QuestionType} from "@/lib/questionSchema.ts";

    import type {PreSetFilters, QcmFilters} from "@/lib/qcmFilters.ts";

    import "es-iterator-helpers/auto";
    import TagsFilter from "@/components/TagsFilter.svelte";
    import RunningQCM from "@/components/RunningQCM.svelte";
    import {questionSchema} from "@/lib/questionSchema.js";
    import {z} from "zod";
    import {questions_map, difficuly_map} from "@/lib/names.ts";
    import DifficultyIcon from "@/components/DifficultyIcon.svelte";

    export let all_questions: FullQuestion[];
    export let all_difficulty: Set<Difficulty>;
    export let all_tags: Set<QuestionTag>;
    export let all_types: Set<QuestionType>;
    export let arborescence_cours: AllCours;
    export let preSetFilters: PreSetFilters | null = null;
    export let defaultQuestionCount: number;
    export let defaultFilters: QcmFilters;


    const cours_with_questions = new Set(all_questions.map(q => q.cours_id)).values().toArray()
    const themes_with_questions = new Set(all_questions.map(q => q.theme_id)).values().toArray()
    const ues_with_questions = new Set(all_questions.map(q => q.ue_id)).values().toArray()

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
        let actual_cours = all_questions.filter(c => c.theme_id == theme.id).map(c => c.cours_id);
        const selected_cours = actual_cours.filter(c => question_filters.included_cours.has(c));
        if (selected_cours.length === 0) {
            map[theme.id] = SelectionStatus.UNSELECTED;
        } else if (selected_cours.length === actual_cours.length) {
            map[theme.id] = SelectionStatus.SELECTED;
        } else {
            map[theme.id] = SelectionStatus.INDETERMINATE;
        }
        return map;
    }, {});

    let ue_state_map: { [ue_id: string]: SelectionStatus } = {};
    $: ue_state_map = arborescence_cours.reduce((map: { [ue_id: string]: SelectionStatus }, ue) => {
        let actual_themes = all_questions.filter(c => c.ue_id === ue.id).map(c => c.theme_id);
        const selected_themes = actual_themes.filter(t => theme_state_map[t] === SelectionStatus.SELECTED);
        if (selected_themes.length === 0) {
            map[ue.id] = SelectionStatus.UNSELECTED;
        } else if (selected_themes.length === actual_themes.length) {
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
        // questions_count = Math.min(questions_count, questions_count_preview);
        if (questions_count == 0) {
            questions_count = Math.min(defaultQuestionCount, questions_count_preview)
        }
    }

    let questions_count = defaultQuestionCount;

    function filterQuestions(questions: FullQuestion[], filters: QcmFilters): FullQuestion[] {
        return questions.filter(q => {
            return filters.included_cours.has(q.cours_id) &&
                (filters.filtered_tags.size == 0 || filters.filtered_tags.values().every(t => q.tags.has(t))) &&
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

    });


</script>

{#if prefiltered_qcm && !qcm_running && questions_count_preview > 0}
    <div class="my-2">
        <button class="d-block btn btn-primary m-auto mx-auto text-bg-primary" on:click={prepareQCM}>
            <mark class="text-success text-bg-primary">Se tester</mark>
            avec {questions_count} questions sur
            <mark class="text-decoration-underline text-bg-primary">{preSetFilters.context}</mark>
        </button>
    </div>
{/if}
{#if mounted}


    {#if (!qcm_running && !prefiltered_qcm)}
        <h2 class="text-center">Configuration du QCM</h2>

        <div class="row g-3 align-items-center my-2">
            <div class="col-auto">
                <label for="nombre_questions" class="form-label d-inline fs-4 fw-bold">Nombre de
                    questions&nbsp;:</label>
            </div>
            <div class="col-auto">
                <input type="number" name="nombre_questions"
                       class="form-control border-1 border p-2 fw-bolder"
                       aria-describedby="nombreHelpBlock"
                       class:border-primary={questions_count <= questions_count_preview && questions_count >= 1}
                       class:border-danger={questions_count > questions_count_preview || questions_count <=0}
                       bind:value={questions_count} min="1"
                       max={questions_count_preview}/>
            </div>
            <div class="col-auto">
                <span class="form-text fs-5 fw-bold"
                      class:text-danger={questions_count > questions_count_preview}
                      id="nombreHelpBlock">Nombre de questions correspondants aux filtres&thinsp;: <mark
                        class=" p-0 bg-secondary"
                        class:fw-bolder={questions_count > questions_count_preview}>{questions_count_preview}</mark></span>
            </div>
        </div>


        <div class="d-grid my-3 align-items-stretch overflow-x-auto gap-2 fs-4"
             style="grid-template: 40rem / 1fr 1fr 1fr">
            <div class="card scroll-card w-100" id="tags_filter_card">
                <div class="card-header"><h3 class="card-title text-center">Filtrer par tags</h3></div>
                <div class="card-body flex-fill h-100 overflow-y-auto w-100">
                    <TagsFilter dataset={all_tags} bind:included={question_filters.filtered_tags}
                                bind:excluded={question_filters.excluded_tags}/>
                </div>
            </div>
            <div class="card scroll-card h-100">
                <div class="card-header"><h3 class="card-title text-center">Filtres par difficulté et type</h3></div>
                <div class="card-body">
                    <div class="mt-0">
                        <h3>Difficulté</h3>
                        {#each all_difficulty as difficulty}
                            {@const diffvalues = difficuly_map[difficulty]}
                            {@const included = question_filters.included_difficulty.has(difficulty)}
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
                                       checked={included}
                                ><label for="{difficulty}" class="d-flex flex-row gap-2 form-check-label"
                                        class:opacity-50={!included}
                                        class:text-decoration-line-through={!included}
                                        style="width: fit-content">
                                <DifficultyIcon difficulty={difficulty}/>
                                <div>
                                    {diffvalues.name}
                                </div>
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
                                ><label for="{type}" class="d-flex flex-row gap-2 form-check-label"
                                        class:opacity-50={!question_filters.included_type.has(type)}
                                        class:text-decoration-line-through={!question_filters.included_type.has(type)}
                                        style="width: fit-content">
                                <iconify-icon inline icon={questions_map[type].icon} width="1.8rem" height="1.8rem" class="text-primary"></iconify-icon>
                                <div>
                                    {questions_map[type].name}
                                </div>
                            </label>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>

            <div class="card scroll-card h-100">
                <div class="card-header"><h3 class="card-title d-inline-block text-center">Filtrer par
                    UE&thinsp;/&thinsp;Theme&thinsp;/&thinsp;Cours</h3></div>
                <div class="card-body px-2 px-md-3 overflow-y-auto">
                    {#each arborescence_cours.filter(u => all_questions.some(q => q.ue_id === u.id)) as ue}
                        <details class="list" open >
                            <summary>
                                <span class="ms-0"><input type="checkbox" class=form-check-input
                                                          on:change={(e) =>  setUE(ue.id,e.target?.checked)}
                                                          checked={ue_state_map[ue.id] === SelectionStatus.SELECTED || ue_state_map[ue.id] === SelectionStatus.INDETERMINATE}
                                                          indeterminate={ue_state_map[ue.id] === SelectionStatus.INDETERMINATE}

                                                          name={ue.id} id={ue.id}>
                                    <label for="{ue.id}" class="form-check-label"
                                           class:opacity-50={ue_state_map[ue.id] === SelectionStatus.UNSELECTED}
                                           class:text-decoration-line-through={ue_state_map[ue.id] === SelectionStatus.UNSELECTED}
                                    >UE&nbsp;: {ue.name}</label></span>
                            </summary>
                            {#each ue.themes.filter(t => all_questions.some(q => q.theme_id === t.id)) as theme}
                                <details>
                                    <summary>
                                        <span class="ms-0"><input type="checkbox"
                                                                  class="form-check-input"
                                                                  on:change={(e) => setTheme(theme.id,e.target?.checked)}
                                                                  name={theme.id}
                                                                  checked={theme_state_map[theme.id] === SelectionStatus.SELECTED || theme_state_map[theme.id] === SelectionStatus.INDETERMINATE}
                                                                  indeterminate={theme_state_map[theme.id] === SelectionStatus.INDETERMINATE}
                                                                  id={theme.id}><label
                                                for="{theme.id}"
                                                class="form-check-label"
                                                class:opacity-50={theme_state_map[theme.id] === SelectionStatus.UNSELECTED}
                                                class:text-decoration-line-through={theme_state_map[theme.id] === SelectionStatus.UNSELECTED}
                                        >Thème&nbsp;: {theme.name}</label>
                                        </span>
                                    </summary>
                                    {#each theme.cours.filter(c => all_questions.some(q => q.cours_id === c.id)) as cours}
                                        <div class="form-check-inline ms-4">
                                            <input type="checkbox" name={cours.id} id={cours.id}
                                                   class="form-check-input ms-4"

                                                   on:change={(e) => setCours(cours.id,e.target?.checked)}
                                                   checked={question_filters.included_cours.has(cours.id)}

                                            ><label
                                                for="{cours.id}" class="form-check-label"
                                                class:opacity-50={!question_filters.included_cours.has(cours.id)}
                                                class:text-decoration-line-through={!question_filters.included_cours.has(cours.id)}
                                        >{cours.name}</label>
                                        </div>
                                    {/each}
                                </details>
                            {/each}
                        </details>
                    {/each}
                </div>
            </div>
        </div>

        <button class="btn btn-outline-primary mb-4" id="start-button"
                disabled={questions_count_preview === 0 || questions_count === 0 || questions_count > questions_count_preview || questions_count <= 0}

                on:click={prepareQCM}>
            {(questions_count_preview === 0) ? "Aucune question ne correspond au filtres" : (questions_count === 0 ? "Il faut choisir au moins une question" :
                questions_count <= 0 || questions_count > questions_count_preview ? `Les filtres renseignés font moins de ${questions_count} questions` :
                    `Démarrer ${questions_count} questions`)}
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

    /*!* Parce que Bootstrap fait chier par défaut *!*/
    /*label {*/
    /*    display: initial;*/
    /*}*/

    /* C'est chelou mais ça marche. Ça permet de faire descendre le overflow 🤷‍♂️ */
    /*:global(#tags_filter_card div:has(table)) {*/
    /*    height: 100%;*/
    /*    overflow: auto;*/
    /*}*/

    @media screen and (orientation: landscape) {
        .scroll-card {
            flex-grow: 1
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