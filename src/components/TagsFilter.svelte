<script lang="ts">
    import type {QuestionTag} from "@/lib/questionSchema.ts";

    export let included: Set<QuestionTag>;
    export let excluded: Set<QuestionTag>;
    export let dataset: Set<QuestionTag>;

    let search = '';
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

    $: filteredTags = Array.from(dataset).filter(tag => tag.includes(search) && !included.has(tag) && !excluded.has(tag)).slice(0, 15);
</script>

<div>
    <strong>Included:</strong>
    {#each Array.from(included) as tag}
        <span class="badge bg-primary-subtle mr-1 rounded">
            {tag}
            <button type="button" class="btn btn-close" aria-label="Close" on:click={() => removeIncludedTag(tag)}/>
        </span>
    {/each}
</div>
<div>
    <strong>Excluded:</strong>
    {#each Array.from(excluded) as tag}
        <span class="badge bg-primary-subtle mr-1 rounded">
            {tag}
            <button type="button" class="btn btn-close" aria-label="Close" on:click={() => removeExcludedTag(tag)}/>
        </span>
    {/each}
</div>

<input type="text" bind:value={search} class="form-control mb-3" placeholder="Search tags...">

<table class="table">
    <thead>
    <tr>
        <th>Tag</th>
        <th>Actions</th>
    </tr>
    </thead>
    <tbody>
    {#each filteredTags as tag (tag)}
        <tr>
            <td><span>{tag}</span></td>
            <td>
                <button class="btn btn-primary mr-2" on:click={() => includeTag(tag)}>Include</button>
                <button class="btn btn-danger" on:click={() => excludeTag(tag)}>Exclude</button>
            </td>
        </tr>
    {/each}
    </tbody>
</table>
