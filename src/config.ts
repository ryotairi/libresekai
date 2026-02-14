import fs from 'fs';
import yaml from 'yaml';

type GameAppVersion = {
    systemProfile: 'production';
    appVersion: string;
    multiPlayVersion: string; //'miku' | 'len' | 'meiko' | 'rin'
    assetVersion: string;
    appVersionStatus: 'available' | 'not_available';
};

type ApiInformation = {
    id: number;
    seq: number;
    displayOrder: 3;
    informationType: 'normal' | 'bug';
    informationTag: 'bug' | 'information' | 'gacha';
    platform: 'all' | 'iOS' | 'Android';
    browseType: 'internal' | 'external';
    title: string;
    path: string;
    startAt: number;
    endAt?: number;
};

type VersionData = {
    profile: 'production';
    assetbundleHostHash: string;
    domain: string;
};

type VersionDataDict = {
    [key: string]: VersionData
};

type Config = {
    apiPort: number;
    webPort: number;
    versionPort: number;
    assetsPort: number;
    domains: {
        assetbundleApi: string;
        assetbundleUrl: string;
        assetbundleInfoUrl: string;
    };
    versions: GameAppVersion[];
    latestVersion: number;
    versionData: VersionDataDict;
    apiDomain: string;
    webDomain: string;
    maintenanceStatus: 'maintenance_out';
    legal: {
        privacyPolicy: string;
        termsOfUse: string;
    };
    informations: ApiInformation[];
    initialPlayerName: string;
    deleteLiveDataAfterFinishing: boolean;

    initialFreeCards: number[];
    initialMusics: number[];
};

const configFile = fs.readFileSync('./config.yml', 'utf-8');
const config: Config = yaml.parse(configFile);

export {
    config
};