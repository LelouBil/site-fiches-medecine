import type {z} from "zod"
import {questionFileSchema, questionSchema} from "@/lib/questionSchema";
import * as drive from "@/lib/drive"
import {buildPagesIndex} from "@/lib/algolia.ts";
import 'es-iterator-helpers/auto'; // flatmap


export type ThemeId = string & {__brand: "ThemeID"}
export type CoursId = string & {__brand: "CoursID"}
export type UeId = string & {__brand: "UEID"}
export type FicheId = string & {__brand: "FicheID"}

type Fiche = {
    name: string,
    id: FicheId,
    download_url: string
    embed_url: string
}

export type FullQuestion = {
    ue_id: UeId,
    theme_id: ThemeId,
    cours_id: CoursId,
} & z.infer<typeof questionSchema>


type Cours = {
    name: string,
    id: CoursId,
    fiches: Fiche[],
    questions_qcm: FullQuestion[],
}

type Themes = {
    name: string,
    id: ThemeId,
    cours: Cours[]
}

type UE = {
    name: string,
    id: UeId,
    themes: Themes[]
}

export type AllCours = UE[]

function normalizeName(name: string): string {
    return name.toLowerCase()
        .normalize("NFKD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-{2,}/g, '-');
}

export const arborescence_cours: AllCours = await get_arborescence_cours()

export const all_questions: FullQuestion[] = arborescence_cours.flatMap(ue => ue.themes.flatMap(theme => theme.cours.flatMap(cours => cours.questions_qcm )))


export const all_tags = new Set(all_questions.values().flatMap(question => question.tags))
export const all_difficulty = new Set(all_questions.map(question => question.difficulty))
export const all_types = new Set(all_questions.map(question => question.type))


async function get_arborescence_cours(): Promise<AllCours> {
    const ues: UE[] = [];
    const ueFolders = await drive.files_in_folder(drive.ROOT_FOLDER_ID, drive.FilterType.Folders);
    if (ueFolders) {
        for (const dossier_ue of ueFolders) {
            const themes: Themes[] = [];
            const themeFolders = await drive.files_in_folder(dossier_ue.id!, drive.FilterType.Folders);
            let ueId = normalizeName(dossier_ue.name) as UeId;
            if (themeFolders) {
                for (const dossier_theme of themeFolders) {
                    const cours: Cours[] = [];
                    const coursFolders = await drive.files_in_folder(dossier_theme.id!, drive.FilterType.Folders);
                    let themeId = normalizeName(dossier_theme.name) as ThemeId;
                    if (coursFolders) {
                        for (const dossier_cours of coursFolders) {
                            const fiches: Fiche[] = (await drive.files_in_folder(dossier_cours.id!, drive.FilterType.Files))
                                ?.filter(file => file.fileExtension == "pdf")
                                .map(fiche => ({
                                    id: normalizeName(fiche.name) as FicheId,
                                    name: fiche.name,
                                    download_url: fiche.webContentLink,
                                    embed_url: `https://drive.google.com/file/d/${fiche.id}/preview`
                                }));
                            const questions_qcm = (await drive.files_in_folder(dossier_cours.id!, drive.FilterType.Files))
                                ?.find(fiche => fiche.name == "questions.json");
                            fiches.sort((a, b) => a.name.localeCompare(b.name));
                            if (questions_qcm) {
                                console.log(`Parsing ${dossier_ue.name}/${dossier_theme.name}/${dossier_cours.name}/questions.json`);
                            }
                            const parse = questions_qcm ? questionFileSchema.parse(await drive.get_file_content(questions_qcm.id!)) : null;
                            let coursId = normalizeName(dossier_cours.name) as CoursId;
                            const questions: FullQuestion[] = (parse?.questions ?? []).map(question => ({
                                ...question,
                                tags: new Set([...question.tags, ...(parse?.tags ?? [])]),
                                ue_id: ueId,
                                theme_id: themeId,
                                cours_id: coursId
                            }));
                            if (questions_qcm || fiches.length > 0) {
                                cours.push({
                                    name: dossier_cours.name,
                                    id: coursId,
                                    fiches: fiches,
                                    questions_qcm: questions
                                });
                            }
                        }
                    }
                    cours.sort((a, b) => a.name.localeCompare(b.name));
                    if (cours.length > 0) {
                        themes.push({
                            name: dossier_theme.name,
                            id: themeId,
                            cours: cours
                        });
                    }
                }
            }
            themes.sort((a, b) => a.name.localeCompare(b.name));
            if(themes.length > 0) {
                ues.push({
                    name: dossier_ue.name,
                    id: ueId,
                    themes: themes
                });
            }
        }
    }
    ues.sort((a, b) => a.name.localeCompare(b.name));
    await buildPagesIndex(ues);
    return ues;
}