type AssetDomainMatchType = import('../utils/assetDomain').AssetDomainMatch;

declare namespace Express {
    interface Request {
        userId?: number;
        assetDomain?: AssetDomainMatchType;
    }
}
