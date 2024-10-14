<script lang="ts">
    import type { QuestionTag } from "@/lib/questionSchema.ts";

    export let included: Set<QuestionTag>;
    export let excluded: Set<QuestionTag>;
    export let dataset: Set<QuestionTag>;

    let search = "";
    let filteredTags: QuestionTag[] = [];


    function includeTag(tag: QuestionTag) {
        included = new Set([...included, tag]);
    }

    function excludeTag(tag: QuestionTag) {
        excluded = new Set([...excluded, tag]);
    }

    function removeIncludedTag(tag: QuestionTag) {
        included = new Set(included.values().filter(t => t !== tag));
    }

    function removeExcludedTag(tag: QuestionTag) {
        excluded = new Set([...excluded].filter(t => t !== tag));
    }

    function highlightSearch(tag: QuestionTag) {
        const elems = search.length > 0 ? tag.split(search) : [tag];
        return {
            begin: elems[0],
            middle: search,
            end: elems.length >= 2 ? elems.slice(1).join("") : ""
        };
    }

    $: filteredTags = Array.from(dataset).filter(tag => tag.includes(search) && !included.has(tag) && !excluded.has(tag)).slice(0, 8);

</script>

<div class="mb-2 mt-0">
    <strong>Tags requis:</strong>
    <div class="d-flex col gap-2 flex-wrap">
        {#each Array.from(included) as tag}
            <div class="badge bg-primary mr-1" data-bs-theme="dark">
                {tag}
                <button type="button" data-bs-theme="dark" class="btn btn-close text-secondary" aria-label="Close"
                        on:click={() => removeIncludedTag(tag)}/>
            </div>
        {/each}
    </div>
</div>
<div class="my-2 mb-0">
    <div class="d-flex col gap-2 flex-wrap">
        <strong>Tags exclus:</strong>
        {#each Array.from(excluded) as tag}
            <div class="badge border-secondary text-primary  mr-1">
                {tag}
                <button type="button" class="btn btn-close" aria-label="Close" on:click={() => removeExcludedTag(tag)}/>
            </div>
        {/each}
    </div>
</div>
<hr class="mb-2"/>

<div>
    <input bind:value={search} class="form-control mb-3" placeholder="Rechercher des tags" type="text">

    <div class="overflow-x-auto">
        <table class="table table-bordered table-striped">
            <!--    <thead>-->
            <!--    <tr>-->
            <!--        <th>Tag</th>-->
            <!--        <th>Actions</th>-->
            <!--    </tr>-->
            <!--    </thead>-->
            <tbody>
            {#each filteredTags as tag (tag)}
                <tr class="">
                    <td class=" py-0 align-middle fs-4">
                        <div>{highlightSearch(tag).begin}<strong
                            class="ps-0 d-inline">{highlightSearch(tag).middle}</strong>{highlightSearch(tag).end}
                        </div>
                    </td>
                    <td class="py-0 align-middle">
                        <div class="btn-group ms-auto me-0 d-flex buttons gap-4 justify-content-end" role="group">
                            <button class="btn btn-primary  my-2 px-3 py-1" on:click={() => includeTag(tag)}>+</button>
                            <button class="btn btn-outline-primary my-2 px-3 py-1" on:click={() => excludeTag(tag)}>-</button>
                        </div>
                    </td>
                </tr>
            {/each}
            </tbody>
        </table>
    </div>
</div>

<style>
    .buttons {
        gap: 0.25rem;
    }

    .buttons button {
        max-height: fit-content;
        max-width: fit-content;
        /*max-width: 2rem;*/
    }
</style>