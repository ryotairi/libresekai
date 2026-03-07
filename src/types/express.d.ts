type AssetDomainMatchType = import('../utils/assetDomain').AssetDomainMatch;

declare namespace Express {
    interface Request {
        userId?: bigint;
        assetDomain?: AssetDomainMatchType;
    }
}
