/**
 * Attached to `request.user` after the access-token strategy validates a token. It deliberately has
 * no role: a token can be 15 minutes old, so rights are always read from the database
 * (see `AccessService`). The role claim inside the token is only a hint for the web proxy.
 */
export interface RequestUser {
  userId: string;
}

/** Attached to `request.user` after the refresh-token strategy validates a token. */
export interface RefreshPrincipal {
  userId: string;
  tokenId: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresInMs: number;
  refreshExpiresInMs: number;
}
