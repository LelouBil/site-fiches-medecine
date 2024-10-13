<script lang="ts">

    import type {FullQuestion} from "@/lib/files.ts";

    type OptionAnswer = number & {__brand: 'OptionAnswer'};
    type TextAnswer = string & {__brand: 'TextAnswer'};
    type Answer = OptionAnswer | TextAnswer;

    export let questions: FullQuestion[] = [];

    let answers: Answer[] = [];

    let current_question = 0;

</script>

<pre>{JSON.stringify(questions)}</pre>