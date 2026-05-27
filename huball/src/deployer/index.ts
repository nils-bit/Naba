import { HubSpotApiClient } from './api-client';
import { uploadThemeZip } from './zip-uploader';
import { uploadThemeAssets, rewriteAssetUrls } from './asset-uploader';
import { info, success, spinner, debug } from '../utils/logger';
import { DEFAULT_CONFIG } from '../config';

export interface DeployOptions {
  token: string;
  portalId: string;
  themeDir: string;
  themeName: string;
  environment?: 'draft' | 'published';
  extractionTimeout?: number;
}

export interface DeployResult {
  themeName: string;
  environment: string;
  assetsUploaded: number;
  designManagerUrl: string;
}

/**
 * Deploy a theme directory to HubSpot.
 *
 * Pipeline:
 * 1. Upload images to File Manager → get CDN URLs
 * 2. ZIP the theme directory
 * 3. Upload ZIP via Source Code API
 * 4. Extract ZIP
 * 5. Wait for extraction to complete
 */
export async function deployTheme(options: DeployOptions): Promise<DeployResult> {
  const {
    token,
    portalId,
    themeDir,
    themeName,
    environment = DEFAULT_CONFIG.deploy.environment,
    extractionTimeout = DEFAULT_CONFIG.deploy.extractionTimeout,
  } = options;

  const client = new HubSpotApiClient(token, portalId);

  // Step 1: Upload assets
  const assetSpinner = spinner('Uploading assets to HubSpot File Manager...');
  const assetMap = await uploadThemeAssets(client, themeDir, themeName);
  const assetCount = Object.keys(assetMap).length;
  if (assetCount > 0) {
    assetSpinner.succeed(`Uploaded ${assetCount} assets`);
  } else {
    assetSpinner.succeed('No assets to upload');
  }

  // Step 2-4: ZIP, upload, and extract theme
  const deploySpinner = spinner('Deploying theme to HubSpot...');
  await uploadThemeZip(client, themeDir, themeName, extractionTimeout);
  deploySpinner.succeed('Theme deployed and extracted');

  const designManagerUrl = `https://app.hubspot.com/design-manager/${portalId}`;

  return {
    themeName,
    environment,
    assetsUploaded: assetCount,
    designManagerUrl,
  };
}
