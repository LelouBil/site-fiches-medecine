<script lang="ts">
    import {onMount} from "svelte";
    import type {FullQuestion} from "@/lib/files.ts";
    import 'iconify-icon'
    import {difficuly_map} from "@/lib/names.js";
    import DifficultyIcon from "@/components/DifficultyIcon.svelte";
    import SvelteMarkdownBootstrap from "./SvelteMarkdownBootstrap.svelte"

    type OptionAnswer = number & { __brand: "OptionAnswer" };
    type TextAnswer = string & { __brand: "TextAnswer" };
    type Answer = OptionAnswer[] | TextAnswer;

    export let questions: FullQuestion[] = [];
    export let save_answers: boolean = true;
    export let quit: () => void;

    let answers: Answer[] = [];

    let current_question = 0;

    let progressPercent = 0;
    $: progressPercent = ((current_question + 1) / questions.length) * 100;

    function handleOptionChange(optionIndex: number, event: Event) {
        const input = event.target as HTMLInputElement;
        const isChecked = input.checked;

        if (isChecked) {
            answers[current_question] = [...(answers[current_question] as OptionAnswer[]) ?? [], optionIndex as OptionAnswer];
        } else {
            answers[current_question] = (answers[current_question] as OptionAnswer[]).filter((answer) => answer !== optionIndex);
        }
        saveStorage();
    }

    function loadStorage() {
        const storage = localStorage.getItem("answers");
        if (storage) {
            answers = JSON.parse(storage);
        } else {
            localStorage.removeItem("qcm_time")
            localStorage.removeItem("current_question")
        }
        const current = localStorage.getItem("current_question");
        if (current) {
            current_question = JSON.parse(current);
        }
        console.log("current question here", current)
        saveStorage();
    }

    function saveStorage() {
        if (save_answers) {
            localStorage.setItem("answers", JSON.stringify(answers));
            localStorage.setItem("current_question", JSON.stringify(current_question));
        }
    }

    function quitQCM() {
        if (save_answers) {
            localStorage.removeItem("answers");
            localStorage.removeItem("current_question");
        }

        quit();
    }

    function handleTextChange(event: Event) {
        const input = event.target as HTMLInputElement;
        answers[current_question] = input.value as TextAnswer;
        saveStorage();
    }

    function nextQuestion() {
        current_question++;
        saveStorage()
    }

    function previousQuestion() {
        current_question--;
        saveStorage()
    }

    onMount(() => {
        const newTab = [];
        for (const q of questions) {
            if (q.type == "choices") {
                newTab.push([]);
            } else if (q.type == "text") {
                newTab.push("");
            }
        }
        answers = newTab;
        if (save_answers)
            loadStorage();
        return startDurationTrack();
    });

    function startDurationTrack(): () => void {
        if (save_answers && current_question < questions.length) {
            let int: NodeJS.Timeout | undefined = undefined;
            const timeStep = () => {
                // if tab has focus
                if (current_question >= questions.length) {
                    clearInterval(int);
                }
                if (document.visibilityState === "visible") {

                    const currentStoredTime = localStorage.getItem("qcm_time") ?? "0";
                    const currentTime = JSON.parse(currentStoredTime);
                    localStorage.setItem("qcm_time", JSON.stringify(currentTime + 1));
                }
                console.log("interval", current_question, questions.length)

            }
            int = setInterval(timeStep, 1000);
            return () => clearInterval(int);
        }
        return () => {
        };
    }

    let points: number[] = []

    $: {
        for (let [i, answer] of answers.entries()) {
            const question = questions[i]!
            const answered_options = answer as OptionAnswer[]
            let pts = 0;
            if (question.type === "choices") {
                let fautes = 0
                for (let [opti, opt] of question.options.entries()) {
                    let checked = answered_options.includes(opti as OptionAnswer);
                    if (opt.correct && !checked || (!opt.correct && checked)) {
                        fautes++;
                    }
                }
                switch (fautes) {
                    case 0:
                        pts = 1;
                        break
                    case 1:
                        pts = 0.5;
                        break
                    case 2:
                        pts = 0.2;
                        break
                    default:
                        pts = 0;
                        break
                }
            } else if (question.type === "text") {
                if (getMatches(answer as TextAnswer, question.answers).length >= 1) {
                    pts = 1
                } else {
                    pts = 0
                }
                //todo QCS
            }
            points[i] = pts
        }
    }

    function formatTime(seconds: number) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const sec = seconds % 60;
        let res = ""
        if (hours > 0) {
            res += `${hours}h `
        }
        if (minutes > 0) {
            res += `${minutes}m `
        }
        if (sec > 0) {
            res += `${sec}s`
        }
        return res
    }


    function getMatches(source: TextAnswer, possibilities: string[]) {
        return possibilities.filter(p => p.toUpperCase().trim() == source.toUpperCase().trim())
    }

    let questionTextRef: HTMLElement;

    $: isAnswerChosen = answers[current_question] && answers[current_question] !== "";


    import Particles, {particlesInit} from '@tsparticles/svelte';
    import type {ParticlesProps} from "@tsparticles/svelte/dist/Particles.svelte";
    import {loadConfettiPreset} from "@tsparticles/preset-confetti";

    const particlesConfig: ParticlesProps["options"] = {
        emitters: [{
            "life": {
                "count": 4,
                "duration": 0.1,
                "delay": 0.4
            },
            "rate": {
                "delay": 0.1,
                "quantity": 150
            },
            "size": {
                "width": 50,
                "height": 50
            }
        }
        ],
        preset: "confetti"
    }

    let quitConfirm: HTMLButtonElement;

    void particlesInit(async (engine) => {
        // call this once per app
        // you can use main to customize the tsParticles instance adding presets or custom shapes
        // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
        // starting from v2 you can add only the features you need reducing the bundle size
        //await loadFull(engine);
        await loadConfettiPreset(engine);
    });


    function QCMHandler(e: KeyboardEvent) {
        if (questions[current_question]?.type !== "choices") {
            return
        }
        if (e.key === "Enter" && current_question < questions.length - 1) {
            nextQuestion()
        }
        if (e.key === "Backspace" && current_question > 0) {
            previousQuestion()
        }
        if (e.key === "Escape") {
            quitConfirm.click();
        }
        let toclick = null;
        if (e.key === "a") {
            toclick = document.getElementById(`option-0`)
        }
        if (e.key === "z") {
            toclick = document.getElementById(`option-1`)
        }
        if (e.key === "e") {
            toclick = document.getElementById(`option-2`)
        }
        if (e.key === "r") {
            toclick = document.getElementById(`option-3`)
        }
        toclick?.click();
        toclick?.blur();
    }

    onMount(() => {
        window.addEventListener("keydown", QCMHandler);
        return () => window.removeEventListener("keydown", QCMHandler);
    });


</script>
<button class="d-none" bind:this={quitConfirm} tabindex="-1" data-bs-target="#quitConfirm"
        data-bs-toggle="modal"></button>
<div aria-hidden="true" class="modal fade" id="quitConfirm" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-secondary">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="exampleModalLabel">Voulez vous arrêter ce QCM ?</h1>
                <button aria-label="Close" class="btn-close" data-bs-dismiss="modal" type="button"></button>
            </div>
            <div class="modal-body">
                Vous allez perdre vos réponses actuelles
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline-danger" data-bs-dismiss="modal" on:click={quitQCM} type="button">Quitter
                </button>
                <button class="btn btn-primary btn-outline-" data-bs-dismiss="modal" type="button">Annuler</button>
            </div>
        </div>
    </div>
</div>

<div aria-hidden="true" class="modal fade" id="submitConfirm" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-secondary">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="exampleModalLabel">Voulez vous valider vos Réponses ?</h1>
                <button aria-label="Close" class="btn-close" data-bs-dismiss="modal" type="button"></button>
            </div>
            <div class="modal-body">
                Vous allez voir votre score et la correction, sans possibilité de changer vos réponses
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline-success" data-bs-dismiss="modal" on:click={nextQuestion} type="button">
                    Valider
                </button>
                <button class="btn btn-primary btn-outline-" data-bs-dismiss="modal" type="button">Annuler</button>
            </div>
        </div>
    </div>
</div>

{#if questions.length > 0}
    <div class="d-flex flex-column">
        <div>
            {#if questions[current_question]}
                {@const diffvalues = difficuly_map[questions[current_question].difficulty]}
                <!--            <button class="btn-xs float-end btn btn-primary floatingButton z-1" on:click={() => {-->
                <!--                questionTextRef.scrollIntoView(true);-->
                <!--                console.log("scroll",questionTextRef)-->
                <!--            }}>-->
                <!--                <iconify-icon icon="mingcute:down-line" width="1.2rem" height="1.2rem" class="m-1 text-primary"></iconify-icon>-->
                <!--            </button>-->
                <div class="d-flex flex-column flex-md-row flex-md-row-reverse align-items-center gap-3 gap-md-2">
                    <div>
                        <button class="btn btn-danger" data-bs-toggle="modal"
                                data-bs-target="#quitConfirm">Quitter le
                            QCM
                        </button>
                    </div>
                    <div class="progress flex-fill  border-primary border-1 border w-75" role="progressbar"
                         aria-label="avancée dans les questions"
                         aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressPercent}>
                        <div class="progress-bar" style="width: {progressPercent}%"/>
                    </div>
                    <div class="d-flex flex-row gap-1">
                        <p class="fw-bold fs-4 text-secondary my-0 text-nowrap">Question <span
                                class="text-info">{current_question + 1}</span> sur {questions.length}
                        </p>
                        <DifficultyIcon
                                difficulty={questions[current_question].difficulty}
                                title={`Question ${diffvalues.name}`}
                        />
                    </div>
                </div>

                <div class="p-0 m-0 d-flex flex-column main-block">
                    <div class="p-0 m-0" bind:this={questionTextRef}>
                        <SvelteMarkdownBootstrap ignore={["list"]}
                                                 class="d-none d-md-block text-primary-emphasis fs-2 fw-bold mt-4 mb-2"
                                                 source={questions[current_question].text} style="min-height: 6rem"/>
                        <SvelteMarkdownBootstrap ignore={["list"]}
                                                 class="d-md-none text-primary-emphasis fs-4 fw-bold mt-2 mb-2"
                                                 source={questions[current_question].text} style="min-height: 5.8rem"/>
                    </div>
                    <div class="d-flex flex-column justify-content-center flex-grow-1">
                        {#if questions[current_question].type === 'choices'}

                            <fieldset class="answers-field d-flex flex-column justify-content-evenly h-100"
                                      style="min-height: 100%">
                                {#each questions[current_question].options as option, index}
                                    <div class="form-check my-3 h-25 d-flex align-items-baseline gap-3">
                                        <input
                                                type="checkbox"
                                                class=form-check-input
                                                id="option-{index}"
                                                name="question-{current_question}"
                                                value={index}
                                                checked={answers[current_question]?.includes(index)}
                                                on:change={(e) => handleOptionChange(index, e)}
                                        />
                                        <label for="option-{index}"
                                               class="d-none d-md-block fs-3 form-check-label text-primary-emphasis">{option.text}</label>
                                        <label for="option-{index}"
                                               class="d-md-none form-check-label fs-5 text-primary-emphasis"
                                               style="min-height: 6rem">{option.text}</label>
                                    </div>
                                {/each}
                            </fieldset>
                        {:else if questions[current_question].type === 'text'}
                            <!-- svelte-ignore a11y-autofocus -->
                            <input
                                    class="form-control border border-1 border-primary my-0 "
                                    type="text"
                                    autofocus
                                    value={answers[current_question]}
                                    on:input={handleTextChange}
                                    placeholder="Votre réponse"
                            />
                        {/if}
                    </div>
                </div>
            {:else}
                {@const totalPoints = Number(points.reduce((a, b) => a + b).toFixed(2))}
                {@const maxPoints = questions.length}
                {#if totalPoints === maxPoints}
                    <Particles options={particlesConfig}/>
                {/if}
                <div class="d-flex flex-row gap-2 align-items-center justify-content-between">
                    <div class="my-1 d-flex gap-1 flex-row">
                        <h2 class="my-0 fs-3">Résultats</h2>
                        {#if save_answers}
                            <p class="d-inline text-secondary-emphasis mb-0 text-nowrap" style="vertical-align: center">(Temps
                                passé: {formatTime(JSON.parse(localStorage.getItem("qcm_time") ?? "0"))})</p>
                        {/if}
                    </div>
                    <button class="btn btn-danger align-self-end" data-bs-toggle="modal" data-bs-target="#quitConfirm"
                            style="grid-column: 2">Quitter le QCM
                    </button>
                </div>
                <h1 class="my-2" style="font-size:30pt">
                    Note: {totalPoints}/{maxPoints}
                </h1>
                <hr class="my-3"/>
                {#each questions as question, index}
                    {@const qt_pts = points[index] || 0}
                    <div class="question-result">
                        <SvelteMarkdownBootstrap ignore={["list"]}
                                                 class="text-primary-emphasis fs-2 fw-bold question-response-text"
                                                 source={`${index + 1}. ${question.text}`}/>
                        <div class="d-flex flex-row gap-1 my-3 " style="margin-left: -0.25rem">

                            <DifficultyIcon
                                    difficulty={question.difficulty}
                                    title={`Question ${difficuly_map[question.difficulty].name}`}
                            />
                            <span
                                    class="fw-bolder fs-4"
                                    class:text-success={qt_pts === 1}
                                    class:text-warning={qt_pts > 0 && qt_pts < 1}
                                    class:text-danger={qt_pts === 0}
                            >Points&thinsp;: {qt_pts}</span>
                        </div>
                        {#if question.type === 'choices'}
                            <div class="d-flex gap-3 flex-column">
                                {#each question.options.values() as answer, i}
                                    {@const correct = answer.correct}
                                    {@const checked = answers[index].includes(i)}
                                    <div class="form-check answer-fontsize">
                                        <input class="form-check-input " type="checkbox" id="option-{i}"
                                               checked={answers[index].includes(i)}
                                               inert
                                               class:bg-success={checked && correct}
                                               class:bg-danger={checked && !correct}
                                               class:bg-warning={!checked && correct}
                                               class:bg-secondary={!checked && !correct}
                                        >
                                        <label

                                                class:text-success={checked && correct}
                                                class:text-danger={checked && !correct}
                                                class:text-warning={!checked && correct}
                                                class:text-secondary={!checked && !correct}

                                                class="form-check-label fw-bold" style="pointer-events: none"
                                                for="option-{i}"
                                        >
                                            <span class="font-monospace fw-bolder">{correct ? "[Vrai]" : "[Faux]"}</span>
                                            {answer.text}
                                        </label></div>
                                {/each}
                            </div>
                        {:else if question.type === 'text'}
                            {@const matches = getMatches(answers[index], question.answers)}
                            <input
                                    disabled
                                    class="form-control border border-1 my-2"
                                    class:border-success={matches.length > 0}
                                    class:border-danger={matches.length === 0}
                                    type="text"
                                    value={answers[index]}
                            />
                            {#if matches.length > 0}
                                <div>
                                    Correct: <span class="text-primary-emphasis fw-bolder">{matches[0]}</span>
                                </div>
                            {/if}

                            <ul class="list-group my-2">
                                <li class="list-group-item border-primary-subtle fw-bold fs-5 text-primary-emphasis">
                                    Réponses valides
                                </li>
                                {#each question.answers as answer}
                                    <li class="list-group-item border-primary-subtle list-group-item-secondary"
                                        class:list-group-item-success={matches.includes(answer)}
                                    >{answer}</li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                {/each}
            {/if}
        </div>
        <hr class="my-0 my-md-4 d-none d-md-block"/>
        <div class="mt-1 my-md-5 btn-holder d-grid justify-content-around justify-content-md-end align-self-end gap-5"
             style="grid-template-columns: repeat(2,40%)">
            {#if current_question < questions.length}
                <button id="button_block" class="btn btn-outline-primary" on:click={previousQuestion}
                        disabled={current_question === 0}>
                    Précédent
                </button>
                {#if current_question === questions.length - 1}
                    <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#submitConfirm">Valider les
                        réponses
                    </button>
                {:else}
                    <button class="btn btn-primary btn-outline-" on:click={nextQuestion}>Suivant</button>
                {/if}
            {:else}
                <button class="btn btn-danger " data-bs-toggle="modal" data-bs-target="#quitConfirm"
                        style="grid-column: 2">Quitter le QCM
                </button>
            {/if}
        </div>
    </div>
{:else}
    <p>No questions available.</p>
{/if}

<style>

    .answer-fontsize {
        font-size: 1.25rem;
    }


    .floatingButton {
        position: fixed;
        bottom: 20px;
        right: 20px;
        /*display: none;*/
    }

    .answers-field {
        /*min-height: 22rem;*/
    }


    .question-response-text {
        margin-bottom: 0;

        & + span {
            display: block;
            margin-bottom: inherit;
        }
    }

    .question-result {
        margin-bottom: 1em;
    }

    .btn-holder {
        width: 25vw;
        justify-content: start;
        gap: 2em
    }

    @media screen and (max-width: 768px) {
        .btn-holder {
            gap: 0;
            width: 100%;
            justify-content: space-between;
        }

        .answers-field {
            /*min-height: 30rem;*/
        }

        .answer-fontsize {
            font-size: 1rem;
        }
    }

    .main-block {
        min-height: 90vh
    }

    @media screen and (min-width: 768px) {
        .main-block {
            min-height: 35rem;
        }
    }
</style>