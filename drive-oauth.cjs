const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const os = require("node:os");

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'drive-token.json');


/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const payload = JSON.stringify({
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
    const filecontent = {
        installed: {
            client_id: process.env.DRIVE_OAUTH2_CLIENT_ID,
            client_secret: process.env.DRIVE_OAUTH2_CLIENT_SECRET,
            project_id: process.env.DRIVE_OAUTH2_PROJECT_ID,
            auth_uri: process.env.DRIVE_OAUTH2_AUTH_URI,
            token_uri: process.env.DRIVE_OAUTH2_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.DRIVE_OAUTH2_AUTH_PROVIDER_X509_CERT_URL,
            redirect_uris: process.env.DRIVE_OAUTH2_REDIRECT_URIS.split(','),
        }
    };
    const temp_path = await fs.mkdtemp(path.join(os.tmpdir(),"drive-localauth-"));
    const temp_file = path.join(temp_path, 'drive-credentials.json');
    await fs.writeFile(temp_file, JSON.stringify(filecontent, null, 2));

    const client = await authenticate({
        scopes: SCOPES,
        keyfilePath: temp_file,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient) {
    const drive = google.drive({version: 'v3', auth: authClient});
    // const res = await drive.files.list({
    //     pageSize: 10,
    //     fields: 'nextPageToken, files(id, name)',
    // });
    // const files = res.data.files;
    // if (files.length === 0) {
    //     console.log('No files found.');
    //     return;
    // }
    //
    // console.log('Files:');
    // console.log(files.length)
    // // files.map((file) => {
    //     console.log(`${file.name} (${file.id})`);
    // });
}

authorize().then(listFiles).catch(console.error);