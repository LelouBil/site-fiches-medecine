<script lang="ts">
    import {liteClient as algoliaSearch} from "algoliasearch/lite";

    import type {AutocompleteSource} from "@algolia/autocomplete-js";

    import {autocomplete, getAlgoliaResults} from "@algolia/autocomplete-js";
    import "@algolia/autocomplete-theme-classic";
    import {ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY} from "astro:env/client";
    import {pagesIndexName} from "../lib/pagesIndexName";
    import {onMount} from "svelte"

    export let idToDelete: string;


    const searchClient = algoliaSearch(
        ALGOLIA_APP_ID,
        ALGOLIA_SEARCH_KEY
    );

    let elem: HTMLElement;

    onMount(() => {

        autocomplete({
            container: elem,
            placeholder: "Rechercher une fiche",
            openOnFocus: true,
            // plugins: [redirectUrlPlugin],
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
                    templates: {
                        item({item, components, html}) {
                            return html`
                                <a class="aa-ItemLink d-block" href=${import.meta.env.BASE_URL + item.url}>
                                    <div class="aa-ItemWrapper">
                                        <div class="aa-ItemContent">
                                            <div class="aa-ItemContentBody">
                                                <div class="aa-ItemContentTitle">
                                                    ${components.Highlight({
                                                        hit: item,
                                                        attribute: "name"
                                                    })}
                                                </div>
                                                <div class="aa-ItemContentDescription">
                                                    ${components.Snippet({
                                                        hit: item,
                                                        attribute: "type"
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            `;
                        }
                    }

                };
                return [
                    newVar
                ];
            }
        });
        document.getElementById(idToDelete).remove()
    });

</script>
    <div class="w-100 h-100"
         bind:this={elem}></div>
<style  global lang="css">
    :root {
        --aa-text-color-rgb: var(--bs-primary-rgb) !important;
        --aa-primary-color-rgb: var(--bs-primary-rgb) !important;
        --aa-muted-color-rgb: var(--bs-secondary) !important;
    }

    .aa-ItemWrapper mark {
        margin: 0;
        padding: 0 !important;
    }


    .aa-Autocomplete {
        width: 100% !important;
    }


    .aa-ItemContentTitle {
        font-size: 1rem;
    }
</style>