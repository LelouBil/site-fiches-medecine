import {getSecret} from 'astro:env/server'
import {algoliasearch} from "algoliasearch";
import {ALGOLIA_APP_ID} from "astro:env/client";
import {pagesIndexName} from "@/lib/pagesIndexName.ts";
import type {AllCours, CoursId, FicheId, ThemeId, UeId} from "@/lib/files.ts";
import {sortString} from "@/lib/locale.ts";

const client = algoliasearch(ALGOLIA_APP_ID, getSecret('ALGOLIA_API_KEY')!);

type AlgoliaBase<I,T> = {
    objectId: I,
    type: T,
    name: string,
    order: number,
    url: string
}
export type AlgoliaUE = AlgoliaBase<UeId,"UE">

type HasParent<T> = {
    parentId: T,
    parentOrder: number,
    parentName: string
}

export type AlgoliaTheme = AlgoliaBase<ThemeId,"Thème"> & HasParent<UeId>
export type AlgoliaCours = AlgoliaBase<CoursId, "Cours"> & HasParent<ThemeId>
export type AlgoliaFiche = AlgoliaBase<FicheId, "Fiche"> & HasParent<CoursId>

export type AlgoliaItem = AlgoliaUE | AlgoliaTheme | AlgoliaCours | AlgoliaFiche

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

    const sortedUEs = data.sort(sortString(ue => ue.name))
    const sortedThemes = sortedUEs.flatMap(ue => ue.themes.sort(sortString(theme => theme.cours.at(-1)?.name ?? "")))
    const sortedCours = sortedThemes.flatMap(theme => theme.cours.sort(sortString(cours => cours.name)))
    const sortedFiches = sortedCours.flatMap(cours => cours.fiches.sort(sortString(fiche => fiche.name)))

    await client.saveObjects({
        indexName: pagesIndexName,
        objects: data.flatMap(ue => [
            {
                objectID: ue.id,
                name: ue.name,
                type: "UE",
                order: sortedUEs.indexOf(ue),
                url: `/ues/${ue.id}`,
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
