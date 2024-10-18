import type {z} from "zod"
import {questionFileSchema, questionSchema} from "@/lib/questionSchema";
import * as drive from "@/lib/drive"
import {buildPagesIndex} from "@/lib/algolia.ts";
import 'es-iterator-helpers/auto';
import {sortString} from "@/lib/locale.ts"; // flatmap


export type ThemeId = string & {__brand: "ThemeID"}
export type CoursId = string & {__brand: "CoursID"}
export type UeId = string & {__brand: "UEID"}
export type FicheId = string & {__brand: "FicheID"}

export type Fiche = {
    name: string,
    id: FicheId,
    download_url: string
    embed_url: string
    creation_date: Date,
    last_modification_date: Date,
    cours_id: CoursId
}

export type FullQuestion = {
    ue_id: UeId,
    theme_id: ThemeId,
    cours_id: CoursId,
} & z.infer<typeof questionSchema>


export type Cours = {
    name: string,
    id: CoursId,
    fiches: Fiche[],
    questions_qcm: FullQuestion[],
    theme_id: ThemeId,
    creation_date: Date,
    last_modification_date: Date,
    questions_creation_date: Date | null,
    questions_last_modification_date: Date | null,
}

export type Theme = {
    name: string,
    id: ThemeId,
    ue_id: UeId,
    cours: Cours[]
    creation_date: Date,
    last_modification_date: Date,
}

export type UE = {
    name: string,
    id: UeId,
    themes: Theme[]
    creation_date: Date,
    last_modification_date: Date,
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
    console.log("----- Reading drive ----")
    const ues: UE[] = [];
    const ueFolders = await drive.files_in_folder(drive.ROOT_FOLDER_ID, drive.FilterType.Folders);
    if (ueFolders) {
        for (const dossier_ue of ueFolders) {
            const themes: Theme[] = [];
            const themeFolders = await drive.files_in_folder(dossier_ue.id!, drive.FilterType.Folders);
            let ueId = normalizeName(dossier_ue.name) as UeId;
            console.log(`UE: ${dossier_ue.name} (${ueId})`);
            if (themeFolders) {
                for (const dossier_theme of themeFolders) {
                    const cours: Cours[] = [];
                    const coursFolders = await drive.files_in_folder(dossier_theme.id!, drive.FilterType.Folders);
                    let themeId = normalizeName(dossier_theme.name) as ThemeId;
                    console.log(`Theme: ${dossier_theme.name} (${themeId})`);
                    if (coursFolders) {
                        for (const dossier_cours of coursFolders) {
                            let coursId = normalizeName(dossier_cours.name) as CoursId;
                            console.log(`Cours: ${dossier_cours.name} (${dossier_cours.id})`);
                            const fiches: Fiche[] = (await drive.files_in_folder(dossier_cours.id!, drive.FilterType.Files))
                                ?.filter(file => file.fileExtension == "pdf")
                                .map(fiche => ({
                                    id: normalizeName(fiche.name) as FicheId,
                                    name: fiche.name,
                                    download_url: fiche.webContentLink,
                                    embed_url: `https://drive.google.com/file/d/${fiche.id}/preview`,
                                    creation_date: new Date(fiche.createdTime!),
                                    last_modification_date: new Date(fiche.modifiedTime!),
                                    cours_id: coursId
                                }));
                            for (const fiche of fiches) {
                                console.log(`Fiche: ${fiche.name} (${fiche.id}) ${fiche.download_url}`)
                            }
                            const questions_qcm = (await drive.files_in_folder(dossier_cours.id!, drive.FilterType.Files))
                                ?.find(fiche => fiche.name == "questions.json");
                            fiches.sort(sortString(fiche => fiche.name));

                            let parse : z.infer<typeof questionFileSchema> | null = null;
                            if (questions_qcm) {
                                console.log(`Questions for cours found: questions.json`);
                                console.log(`Parsing ${dossier_ue.name}/${dossier_theme.name}/${dossier_cours.name}/questions.json`);

                                let content = await drive.get_file_content(questions_qcm.id!);
                                const attempt =
                                    await questionFileSchema.safeParseAsync(content)
                                if (attempt.success) {
                                    parse = attempt.data;
                                }else{
                                    const error = attempt.error;
                                    console.error(`Error parsing ${dossier_ue.name}/${dossier_theme.name}/${dossier_cours.name}/questions.json`);
                                    console.error(error.toString())
                                }
                            }
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
                                    questions_qcm: questions,
                                    creation_date: new Date(dossier_cours.createdTime!),
                                    last_modification_date: new Date(dossier_cours.modifiedTime!),
                                    questions_creation_date: questions_qcm ? new Date(questions_qcm.createdTime!) : null,
                                    questions_last_modification_date: questions_qcm ? new Date(questions_qcm.modifiedTime!) : null,
                                    theme_id: themeId,
                                });
                            }
                        }
                    }else{
                        console.log("No cours found")
                    }
                    cours.sort(sortString(cours => cours.name));
                    if (cours.length > 0) {
                        themes.push({
                            name: dossier_theme.name,
                            id: themeId,
                            cours: cours,
                            creation_date: new Date(dossier_theme.createdTime!),
                            last_modification_date: new Date(dossier_theme.modifiedTime!),
                            ue_id: ueId
                        });
                    }
                }
            }
            else{
                console.log("No theme found")
            }
            themes.sort(sortString(theme => theme.cours.at(-1)?.name || ""));
            if(themes.length > 0) {
                ues.push({
                    name: dossier_ue.name,
                    id: ueId,
                    themes: themes,
                    creation_date: new Date(dossier_ue.createdTime!),
                    last_modification_date: new Date(dossier_ue.modifiedTime!),
                });
            }
        }
    }
    else{
        console.log("No UE found")
    }
    ues.sort(sortString(ue => ue.name));
    await buildPagesIndex(ues);
    return ues;
}