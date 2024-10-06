import {getSecret} from "astro:env/server"
import {OAuth2Client} from "google-auth-library";
import {drive_v3, google} from "googleapis";


export const ROOT_FOLDER_ID = getSecret("DRIVE_FOLDER_ID")!;

const drive = await authenticate();


async function authenticate() {
    const oauthclient = new OAuth2Client(getSecret("DRIVE_OAUTH2_CLIENT_ID"), getSecret("DRIVE_OAUTH2_CLIENT_SECRET"), "");
    oauthclient.setCredentials({
        refresh_token: getSecret("DRIVE_OAUTH2_REFRESH_TOKEN")!,
    })
    return google.drive({version: 'v3', auth: oauthclient})
}

type FileWithIdNameWebContentLinkFileExtension = {
    id: string,
    name: string,
    webContentLink: string,

    fileExtension: string
}

export enum FilterType {
    All,
    Files,
    Folders
}

const folder_mime_type = "application/vnd.google-apps.folder";

export async function files_in_folder(folder_id: string, filter_type: FilterType) {
    let res = await drive.files.list({
        q: `'${folder_id}' in parents and trashed = false`,
        fields: 'files(id, name,webContentLink, fileExtension, mimeType)',
    });
    const predicate: ((file: drive_v3.Schema$File) => boolean) =
        filter_type == FilterType.All ? () => true
            : filter_type == FilterType.Files ? file => file.mimeType != folder_mime_type
                : file => file.mimeType == folder_mime_type;

    let files = (res.data.files!).filter(predicate);
    return files as unknown as (drive_v3.Schema$File & FileWithIdNameWebContentLinkFileExtension)[]
}


export async function get_file_content(id: string) {
    let res = await drive.files.get({
        fileId: id,
        alt: 'media'
    });
    return res.data;
}