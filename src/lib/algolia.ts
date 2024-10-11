import {getSecret} from 'astro:env/server'
import {algoliasearch} from "algoliasearch";
import {ALGOLIA_APP_ID} from "astro:env/client";
import {pagesIndexName} from "@/lib/pagesIndexName.ts";
import type {AllCours} from "@/lib/files.ts";

const client = algoliasearch(ALGOLIA_APP_ID, getSecret('ALGOLIA_API_KEY')!);


export async function buildPagesIndex(data: AllCours) {

    console.log("Index name: ", pagesIndexName)
    await client.clearRules({
        indexName: pagesIndexName
    })
    await client.deleteIndex({indexName: pagesIndexName});
    await client.setSettings({
        indexName: pagesIndexName,
        indexSettings: {
            searchableAttributes: ['name', 'type'],
            customRanking: [
                'desc(type)',
                'asc(parentOrder)',
                'asc(order)',
                'desc(name)'
            ],
            ranking: [
                'typo',
                'geo',
                'words',
                'filters',
                'proximity',
                'attribute',
                'exact',
                'custom'
            ],
            indexLanguages: ['fr'],
            queryLanguages: ['fr'],
            ignorePlurals: true,
            attributesForFaceting: ['filterOnly(type)', 'filterOnly(parentId)'],
            // attributeForDistinct: 'parentId',
            // distinct: true,
            enableRules: true


        }
    })

    const sortedUEs = data.sort((a, b) => a.name.localeCompare(b.name))
    const sortedThemes = sortedUEs.flatMap(ue => ue.themes.sort((a, b) => a.name.localeCompare(b.name)))
    const sortedCours = sortedThemes.flatMap(theme => theme.cours.sort((a, b) => a.name.localeCompare(b.name)))
    const sortedFiches = sortedCours.flatMap(cours => cours.fiches.sort((a, b) => a.name.localeCompare(b.name)))

    await client.saveObjects({
        indexName: pagesIndexName,
        objects: data.flatMap(ue => [
            {
                objectID: ue.id,
                name: ue.name,
                type: "UE",
                order: sortedUEs.indexOf(ue),
                url: `/ues/${ue.id}`,
                parentId: null
            },
            ...ue.themes.flatMap(theme => [
                {
                    objectID: theme.id,
                    name: theme.name,
                    type: "Thème",
                    order: sortedThemes.indexOf(theme),
                    parentOrder: sortedUEs.indexOf(ue),
                    url: `/ues/${ue.id}/${theme.id}`,
                    parentId: ue.id,
                    parentName: ue.name
                },
                ...theme.cours.flatMap(cours => [
                    {
                        objectID: cours.id,
                        name: cours.name,
                        type: "Cours",
                        order: sortedCours.indexOf(cours),
                        parentOrder: sortedThemes.indexOf(theme),
                        url: `/ues/${ue.id}/${theme.id}/${cours.id}`,
                        parentId: theme.id,
                        parentName: `${ue.name} ${theme.name}`
                    },
                    ...(cours.fiches.length > 1 ? cours.fiches.map(fiche => ({
                        objectID: fiche.id,
                        name: fiche.name.split('.').slice(0, -1).join('.'),
                        type: "Fiche",
                        order: sortedFiches.indexOf(fiche),
                        parentOrder: sortedCours.indexOf(cours),
                        url: `/ues/${ue.id}/${theme.id}/${cours.id}#${fiche.id}`,
                        parentId: cours.id,
                        parentName: `${ue.name} ${theme.name} ${cours.name}`,
                        // download_url: fiche.download_url,
                        // embed_url: fiche.embed_url
                    })) : []),
                    // ...(cours.questions_qcm ? [{
                    //     objectID: `${cours.id}-questions`,
                    //     name: "Questions QCM",
                    //     type: "Questions",
                    //     parentId: cours.id,
                    //     // todo questions: cours.questions_qcm
                    // }] : [])
                ])
            ])
        ])
    });


}
