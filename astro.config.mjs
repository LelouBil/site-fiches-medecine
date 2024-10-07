// @ts-check
import {defineConfig, envField} from 'astro/config';

// https://astro.build/config
export default defineConfig({
    site: "https://leloubil.github.com",
    base: 'medecine_fiches',
    trailingSlash: 'never',
    experimental: {
        env: {
            schema: {
                DRIVE_OAUTH2_CLIENT_ID: envField.string({context: "server", access: "secret"}),
                DRIVE_OAUTH2_CLIENT_SECRET: envField.string({context: "server", access: "secret"}),
                DRIVE_OAUTH2_REFRESH_TOKEN: envField.string({context: "server", access: "secret"}),
                DRIVE_FOLDER_ID: envField.string({context: "server", access: "secret"}),
                ALGOLIA_APP_ID: envField.string({context: "client", access: "public"}),
                ALGOLIA_API_KEY: envField.string({context: "server", access: "secret"}),
                ALGOLIA_SEARCH_KEY: envField.string({context: "client", access: "public"}),
                GITHUB_REF_NAME: envField.string({context: "client", access: "public"}),
            },
            validateSecrets: true,
        }
    }
});
