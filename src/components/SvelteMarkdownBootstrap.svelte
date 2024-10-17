<script lang="ts">

    import {Marked, type Token, Tokenizer} from "marked"
    import MarkedBootstrapRenderer from "./MarkedBootstrapRenderer.svelte"
    // <SvelteMarkdownBootstrap class="text-primary-emphasis fs-2 fw-bold question-response-text" source={`${index + 1}. \n\n**Un deux trois quatre cinq six sept huit neuf dix**`}/>

    export let source: string;
    let clazz: string = "";
    let style: string = "";
    // noinspection ReservedWordAsName
    export {clazz as class}

    export let inline: boolean = true;
    export let ignore: Token["type"][] = []

    // for all elements in ignore, replace the tokenizer with a dummy tokenizer that returns undefined, use the default tokenizer for all other elements

    const customTokenizer = ignore.reduce((acc, type) => {
        // @ts-ignore-
        acc[type] = () => undefined
        return acc
    }, {} as Tokenizer)
    const marked = new Marked();
    marked.use({tokenizer: customTokenizer})


    let tokens = [];
    $: tokens = marked.lexer(source)

</script>

<div class={clazz} style={style}>
    <MarkedBootstrapRenderer token={tokens} links={tokens.links}/>
</div>
