import { config } from '../config';

type AssetDomainType = 'assetbundleApi' | 'assetbundleUrl' | 'assetbundleInfoUrl';

type AssetDomainMatch = {
    type: AssetDomainType;
    placeholders?: {
        0: string;
        1: string;
    };
};

/**
 * Converts a domain pattern with {0} and {1} placeholders into a regex
 * that captures those placeholder values.
 * e.g. "nn-{0}-{1}-ls-assets.rustyraven.pw" becomes /^nn-(.+?)-(.+?)-ls-assets\.rustyraven\.pw$/
 */
function domainPatternToRegex(pattern: string): RegExp {
    // Escape regex special chars (except our placeholders)
    const escaped = pattern
        .replace(/[.+?^${}()|[\]\\]/g, (char) => {
            // Don't escape our {0} and {1} placeholders yet
            if (char === '{' || char === '}') return char;
            return '\\' + char;
        })
        .replace(/\{0\}/, '(.+?)')
        .replace(/\{1\}/, '(.+?)');
    return new RegExp('^' + escaped + '$');
}

// Pre-compile regexes for the asset domains
const assetbundleUrlRegex = domainPatternToRegex(config.domains.assetbundleUrl);
const assetbundleInfoUrlRegex = domainPatternToRegex(config.domains.assetbundleInfoUrl);

/**
 * Match a hostname against the configured asset domains.
 * Returns which domain type matched and, for assetbundleUrl/assetbundleInfoUrl,
 * extracts the {0} and {1} placeholder values.
 */
function matchAssetDomain(hostname: string): AssetDomainMatch | null {
    // Check exact match for assetbundleApi first
    if (hostname === config.domains.assetbundleApi) {
        return { type: 'assetbundleApi' };
    }

    // Check assetbundleUrl pattern (has {0} and {1})
    const urlMatch = hostname.match(assetbundleUrlRegex);
    if (urlMatch) {
        return {
            type: 'assetbundleUrl',
            placeholders: {
                0: urlMatch[1],
                1: urlMatch[2],
            },
        };
    }

    // Check assetbundleInfoUrl pattern (has {0} and {1})
    const infoMatch = hostname.match(assetbundleInfoUrlRegex);
    if (infoMatch) {
        return {
            type: 'assetbundleInfoUrl',
            placeholders: {
                0: infoMatch[1],
                1: infoMatch[2],
            },
        };
    }

    return null;
}

export {
    matchAssetDomain,
    AssetDomainMatch,
};
