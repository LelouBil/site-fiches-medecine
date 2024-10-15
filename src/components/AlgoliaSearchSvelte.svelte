<script lang="ts">
    import {liteClient as algoliaSearch} from "algoliasearch/lite";


    import {
        getAlgoliaResults, type HighlightedHit,
        parseAlgoliaHitHighlight
    } from "@algolia/autocomplete-preset-algolia";
    import type {AutocompleteState, AutocompleteSource, AutocompleteApi} from "@algolia/autocomplete-core"
    import {createAutocomplete} from '@algolia/autocomplete-core';
    import 'iconify-icon';
    import "@algolia/autocomplete-theme-classic";
    import {ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY} from "astro:env/client";
    import {pagesIndexName} from "../lib/pagesIndexName";
    import {onMount} from "svelte"
    import type {AlgoliaItem} from "@/lib/algolia.ts";



    let autocompleteState: AutocompleteState<HighlightedHit<AlgoliaItem>> = {
        activeItemId: null,
        query: "",
        completion: "",
        collections: [],
        isOpen: false,
        status: "idle",
        context: {}
    }

    // noinspection JSNonASCIINames
    const typeIcon: {[type: AlgoliaItem["type"]]: string} = {
        "Fiche": "mdi:paper",
        "Thème": "clarity:file-group-solid",
        "UE": "nonicons:class-16",
        "Cours":"mdi:teacher"
    }

    let inputRef: HTMLInputElement;

    const searchClient = algoliaSearch(
        ALGOLIA_APP_ID,
        ALGOLIA_SEARCH_KEY
    );

    let autocomplete: AutocompleteApi<AlgoliaItem> | null = buildAutoComplete()
    onMount(() => {
        autocomplete = buildAutoComplete()
    })


    function buildAutoComplete() {
        return createAutocomplete<AlgoliaItem>({
            onStateChange({state}) {
                autocompleteState = state;
            },
            autoFocus: false,
            placeholder: "Rechercher un cours / une UE / une fiche",
            openOnFocus: false,
            insights: true,
            getSources({query}) {
                let newVar: AutocompleteSource<any> = {
                    sourceId: "pages",
                    getItems() {
                        return getAlgoliaResults({
                            searchClient,
                            queries: [
                                {
                                    indexName: pagesIndexName,
                                    params: {
                                        query,
                                        hitsPerPage: 5
                                    }
                                }
                            ]
                        });
                    },
                    getItemUrl({item}) {
                        return item.url;
                    },
                    getItemInputValue({item}) {
                        return item.name;
                    },

                };
                return [
                    newVar
                ];
            }
        });
    }

</script>
{#if autocomplete}
    {@const inputProps = autocomplete.getInputProps({inputElement: inputRef})}
    {@const formProps = autocomplete.getFormProps({inputElement: inputRef})}
    {@const panelProps = autocomplete.getPanelProps({})}
    <div class="aa-Autocomplete" {...autocomplete.getRootProps({})}>
        <form
                class="aa-Form"
                {...formProps}
                on:submit={formProps.onSubmit}
                on:reset={formProps.onReset}
        >
            <div class="aa-InputWrapperPrefix">
                <label class="aa-Label d-flex col align-items-center justify-content-center p-0 ps-1" {...autocomplete.getLabelProps({})} for={inputProps.id}>
                    <iconify-icon inline icon="line-md:search" width="1.2rem" height="1.2rem" class="m-1 text-secondary"></iconify-icon>
                </label>
            </div>
            <div class="aa-InputWrapper">
                <!-- autocorrect = safari only -->
                <input class="aa-Input" style="text-overflow: ellipsis" bind:this={inputRef}
                       {...inputProps}
                       on:click={inputProps.onClick}
                       on:blur={inputProps.onBlur}
                       on:focus={inputProps.onFocus}
                       on:keydown={inputProps.onKeyDown}
                       on:change={inputProps.onChange}
                       on:compositionend={inputProps.onCompositionEnd}

                />
            </div>
            <div class="aa-InputWrapperSuffix">
                <button class="aa-ClearButton btn-close" aria-label="close">
                    ｘ
                </button>
            </div>
        </form>

        {#if autocompleteState.isOpen}
        <!--svelte-ignore a11y-no-noninteractive-element-interactions -->
        <!--svelte-ignore a11y-no-static-element-interactions -->
        <div class="aa-Panel p-2 z-3" {...panelProps}
             class:aa-Panel--stalled={autocompleteState.status === "stalled"}
             on:mousedown={panelProps.onMouseDown}
             on:mouseleave={panelProps.onMouseLeave}
        >
                {#each autocompleteState.collections.map((collection, index) => ({
                    source: collection.source,
                    items: collection.items,
                    index: index
                })) as {source, items, index}}
                    {#key `source-${index}` }
                        <div class="aa-Source">
                            {#if items.length > 0}
                                <ul class="aa-List" {...autocomplete.getListProps()}>
                                    {#each items as item}
                                        {@const itemProps = autocomplete.getItemProps({item, source})}
                                        {@const hitHighlight = parseAlgoliaHitHighlight({hit: item, attribute: ["name"]})}
                                        {#key item.objectId}
                                            <li
                                                    class="aa-Item"
                                                    {...itemProps}
                                                    on:mousemove={itemProps.onMouseMove}
                                                    on:mousedown={itemProps.onMouseDown}
                                                    on:click={itemProps.onClick}
                                            >
                                                <a class="aa-ItemLink d-block" href={item.url}>
                                                    <div class="aa-ItemWrapper">
                                                        <div class="aa-ItemContent">
                                                            <div class="aa-ItemContentBody">
                                                                <div class="aa-ItemContentTitle">
                                                                    {#each hitHighlight as highlightPart}
                                                                        <span class="text-primary"
                                                                            class:fw-bolder={highlightPart.isHighlighted}
                                                                        >{highlightPart.value}</span>
                                                                    {/each}
                                                                </div>
                                                                <div class="aa-ItemContentDescription text-secondary">
                                                                    <iconify-icon inline icon={typeIcon[item.type]}></iconify-icon>
                                                                    <span>{item.type}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </a>
                                            </li>
                                        {/key}
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                    {/key}

                {/each}
        </div>
        {/if}
    </div>
{/if}

<style global>
    :root {
        --aa-text-color-rgb: var(--bs-primary-rgb) !important;
        --aa-primary-color-rgb: var(--bs-primary-rgb) !important;
        --aa-muted-color-rgb: var(--aa-primary-color-rgb) !important;
        --aa-muted-color-alpha: 0.5;
        --aa-selected-color-rgb: var(--bs-primary-rgb) !important;
        --aa-search-input-height: 100%;
    }


    .aa-ItemWrapper mark {
        margin: 0;
        padding: 0 !important;
    }


    .aa-Autocomplete, .aa-DetachedSearchButton, .aa-Form {
        width: 100% !important;
        height: 100% !important;
    }

    .aa-Autocomplete, .aa-DetachedSearchButton, .aa-Form, .aa-Panel, .aa-PanelLayout, .aa-Item, .aa-DetachedCancelButton {
        border-radius: 0 !important;
    }


    .aa-ItemContentTitle {
        font-size: 1rem;
    }
</style>