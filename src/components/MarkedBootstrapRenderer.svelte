<script lang="ts">
    import type {Token, Links} from "marked";

    export let token: Token | Token[];
    export let links: Links;
    function decodeHtml(html: string) {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }
</script>
{#if Array.isArray(token)}
    {#each token as t}
        <svelte:self token={t} links={links}/>
    {/each}
{:else}
    {#if token.type === "paragraph"}
        <p class="mb-1">
            <svelte:self token={token.tokens} links={links}/>
        </p>
    {:else if token.type === "strong"}
        <strong>
            <svelte:self token={token.tokens} links={links}/>
        </strong>
    {:else if token.type === "list"}
        {#if token.ordered}
            <ol start={token.start} class="mb-0">
                <svelte:self token={token.items} links={links}/>
            </ol>
        {:else}
            <ul>
                <svelte:self token={token.items} links={links}/>
            </ul>
        {/if}
        <!--{:else if token.type === "list_item"}-->
        <!--    <li>-->
        <!--        <svelte:self token={token.tokens} links={links}/>-->
        <!--    </li>-->
    {:else if token.type === "em"}
        <em>
            <svelte:self token={token.tokens} links={links}/>
        </em>
    {:else if token.type === "space"}
        <span></span>
    {:else if token.type === "text"}
        {#if token?.tokens?.length ?? 0 > 0}
            <svelte:self token={token.tokens} links={links}/>
        {:else}
            <!-- make space before punctuation non breaking -->
            {decodeHtml(token.text.replace(/ ([,:?!/;.])/g, " $1"))}
        {/if}
    {:else if token.type === "html"}
        <svelte:self token={token.tokens} links={links}/>
    {:else if token.type === "link"}
        <a class="link-info" href={token.href} target="_blank" rel="noopener noreferrer">
            <svelte:self token={token.tokens} links={links}/>
        </a>
    {:else if token.type === "heading"}
        {#if (token.depth === 1)}
            <small class="fs-4 text-secondary-emphasis"><svelte:self token={token.tokens} links={links}/></small>
        {/if}
    {:else}
        <pre>{JSON.stringify(token)}</pre>
    {/if}
{/if}