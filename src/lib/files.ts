import type {z} from "zod"
import {questionFileSchema} from "@/lib/questionSchema";
import * as drive from "@/lib/drive"

type Fiche = {
    name: string,
    download_url: string
    embed_url: string
}

type Cours = {
    name: string,
    id: string,
    fiches: Fiche[],
    questions_qcm: z.infer<typeof questionFileSchema> | null,
}

type Themes = {
    name: string,
    id: string,
    cours: Cours[]
}

type UE = {
    name: string,
    id: string,
    themes: Themes[]
}

type AllCours = UE[]

export const arborescence_cours: AllCours = await get_arborescence_cours()

async function get_arborescence_cours(): Promise<AllCours> {
    const ues: UE[] = [];
    const ueFolders = await drive.files_in_folder(drive.ROOT_FOLDER_ID, drive.FilterType.Folders);
    if (ueFolders) {
        for (const dossier_ue of ueFolders) {
            const themes: Themes[] = [];
            const themeFolders = await drive.files_in_folder(dossier_ue.id!, drive.FilterType.Folders);
            if (themeFolders) {
                for (const dossier_theme of themeFolders) {
                    const cours: Cours[] = [];
                    const coursFolders = await drive.files_in_folder(dossier_theme.id!, drive.FilterType.Folders);
                    if (coursFolders) {
                        for (const dossier_cours of coursFolders) {
                            const fiches = (await drive.files_in_folder(dossier_cours.id!, drive.FilterType.Files))
                                ?.filter(file => file.fileExtension == "pdf")
                                .map(fiche => ({
                                    name: fiche.name,
                                    download_url: fiche.webContentLink,
                                    embed_url: `https://drive.google.com/file/d/${fiche.id}/preview`
                                }));
                            const questions_qcm = (await drive.files_in_folder(dossier_cours.id!, drive.FilterType.Files))
                                ?.find(fiche => fiche.name == "questions.json");
                            cours.push({
                                name: dossier_cours.name,
                                id: dossier_cours.id,
                                fiches: fiches!,
                                questions_qcm: questions_qcm ? questionFileSchema.parse(await drive.get_file_content(questions_qcm.id!)) : null
                            });
                        }
                    }
                    themes.push({
                        name: dossier_theme.name,
                        id: dossier_theme.id,
                        cours: cours
                    });
                }
            }
            ues.push({
                name: dossier_ue.name,
                id: dossier_ue.id,
                themes: themes
            });
        }
    }
    return ues;
}