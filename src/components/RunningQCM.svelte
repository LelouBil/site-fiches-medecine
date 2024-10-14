<script lang="ts">
    import type { FullQuestion } from "@/lib/files.ts";

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
            const newTab = [];
            for (const q of questions) {
                if (q.type == "choices") {
                    newTab.push([]);
                } else if (q.type == "text") {
                    newTab.push("");
                }
            }
            answers = newTab;
        }
        const current = localStorage.getItem("current_question");
        if (current) {
            current_question = JSON.parse(current);
        }
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
    }

    function previousQuestion() {
        current_question--;
    }

    $: {
        if (save_answers)
            localStorage.setItem("current_question", JSON.stringify(current_question));
    }

    loadStorage();

    $: isAnswerChosen = answers[current_question] && answers[current_question] !== "";
</script>

<div aria-hidden="true" class="modal fade" id="quitConfirm" tabindex="-1">
    <div class="modal-dialog bg-secondary">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="exampleModalLabel">Voulez vous arrêter ce QCM ?</h1>
                <button aria-label="Close" class="btn-close" data-bs-dismiss="modal" type="button"></button>
            </div>
            <div class="modal-body">
                Vous allez perdre vos réponses actuelles
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal" on:click={quitQCM} type="button">Quitter</button>
                <button class="btn btn-primary" data-bs-dismiss="modal" type="button">Annuler</button>
            </div>
        </div>
    </div>
</div>

<div aria-hidden="true" class="modal fade" id="submitConfirm" tabindex="-1">
    <div class="modal-dialog bg-secondary">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="exampleModalLabel">Voulez vous valider vos Réponses ?</h1>
                <button aria-label="Close" class="btn-close" data-bs-dismiss="modal" type="button"></button>
            </div>
            <div class="modal-body">
                Vous allez voir votre score et la correction, sans possibilité de changer vos réponses
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline-success" data-bs-dismiss="modal" on:click={nextQuestion} type="button">Valider</button>
                <button class="btn btn-primary" data-bs-dismiss="modal" type="button">Annuler</button>
            </div>
        </div>
    </div>
</div>

{#if questions.length > 0}
    <div>
        {#if questions[current_question]}
            <div class="d-flex col align-items-center gap-3">
                <div>
                    <p class="fw-bold fs-5 text-secondary my-0">Question <span class="text-info">{current_question + 1}</span> sur {questions.length}
                    </p>
                </div>
                <div class="progress flex-fill border-primary border-1 border" role="progressbar" aria-label="avancée dans les questions"
                     aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressPercent}>
                    <div class="progress-bar" style="width: {progressPercent}%"/>
                </div>
                <div>
                    <button class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#quitConfirm">Quitter le QCM</button>
                </div>
            </div>
            <p class=" text-primary-emphasis fs-2 fw-bold mt-4 mb-2">{questions[current_question].text}</p>

            {#if questions[current_question].type === 'choices'}
                <fieldset>
                    {#each questions[current_question].options as option, index}
                        <div class="form-check my-3">
                            <input
                                type="checkbox"
                                class=form-check-input
                                id="option-{index}"
                                name="question-{current_question}"
                                value={index}
                                checked={answers[current_question]?.includes(index)}
                                on:change={(e) => handleOptionChange(index, e)}
                            />
                            <label for="option-{index}" class="form-check-label text-primary-emphasis">{option.text}</label>
                        </div>
                    {/each}
                </fieldset>
            {:else if questions[current_question].type === 'text'}
                <input
                    class="form-control border border-1 border-primary"
                    type="text"
                    value={answers[current_question]}
                    on:input={handleTextChange}
                    placeholder="Votre réponse"
                />
            {/if}
        {:else}
            {#each questions as question, index}
                <div class="question-result">
                    <p class="fw-bold question-text">{index + 1}. {question.text}</p>
                    {#if question.type === 'choices'}
                        <!--<span>Score&thinsp;: {corrects.filter((a, i) => a.id === i).length} / {corrects.length}</span>-->
                        {#each question.options.values() as answer, i}
                            {@const correct = answer.correct}
                            {@const checked = answers[index].includes(i)}
                            <div><label
                                class:text-success={checked && correct}
                                class:text-danger={checked && !correct}
                                class:text-warning={!checked && correct}
                                class:text-secondary={!checked && !correct}
                            >
                                <input type="checkbox" disabled checked={answers[index].includes(i)}>
                                <span>
                                    {answer.text}
                                </span>
                            </label></div>
                        {/each}
                    {:else if question.type === 'text'}
                        {question.answers}
                    {/if}
                </div>
            {/each}
            <pre>{JSON.stringify(answers, null, 2)}</pre>
        {/if}
    </div>
    <hr class="my-4"/>
    <div class="mt-5 d-flex col btn-holder">
        {#if current_question < questions.length}
            <button class="btn btn-outline-primary" on:click={previousQuestion} disabled={current_question === 0}>Précédent</button>
            {#if current_question === questions.length - 1}

                <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#submitConfirm">Valider les réponses</button>
            {:else}

                <button class="btn btn-primary" on:click={nextQuestion}>Suivant</button>
            {/if}
        {:else}
            <button class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#quitConfirm">Quitter le QCM</button>
        {/if}
    </div>
{:else}
    <p>No questions available.</p>
{/if}

<style>
    .question-text {
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
    }
</style>