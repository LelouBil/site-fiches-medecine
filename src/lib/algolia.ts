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
            // ranking: ['desc(\"name\")','asc(\"type\")'],

            indexLanguages: ['fr'],
            queryLanguages: ['fr'],
            ignorePlurals: true,
            attributesForFaceting: ['filterOnly(type)', 'filterOnly(parentId)'],
            attributeForDistinct: 'parentId',
            distinct: true,
            enableRules: true


        }
    })

    await client.saveObjects({
        indexName: pagesIndexName,
        objects: data.flatMap(ue => [
            {
                objectID: ue.id,
                name: ue.name,
                type: "UE",
                url: `/ues/${ue.id}`,
                parentId: null
            },
            ...ue.themes.flatMap(theme => [
                {
                    objectID: theme.id,
                    name: theme.name,
                    type: "Thème",
                    url: `/ues/${ue.id}/${theme.id}`,
                    parentId: ue.id,
                    parentName: ue.name
                },
                ...theme.cours.flatMap(cours => [
                    {
                        objectID: cours.id,
                        name: cours.name,
                        type: "Cours",
                        url: `/ues/${ue.id}/${theme.id}/${cours.id}`,
                        parentId: theme.id,
                        parentName: `${ue.name} ${theme.name}`
                    },
                    ...cours.fiches.map(fiche => ({
                        objectID: fiche.id,
                        name: fiche.name,
                        type: "Fiche",
                        url: `/ues/${ue.id}/${theme.id}/${cours.id}#${fiche.id}`,
                        parentId: cours.id,
                        parentName: `${ue.name} ${theme.name} ${cours.name}`,
                        // download_url: fiche.download_url,
                        // embed_url: fiche.embed_url
                    })),
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
