<script lang="ts">
    import type {FullQuestion} from "@/lib/files.ts";

    export let questions: FullQuestion[]
    console.log("bonjour")
</script>

<p>TEST ({questions.length})</p>
<ul>{#each questions as question, i}<li>{i} - <pre>{JSON.stringify(question, null, 2)}</pre></li>{/each}</ul>

<style>

</style>