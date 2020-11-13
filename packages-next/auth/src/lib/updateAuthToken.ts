import { updateItem } from '@keystonejs/server-side-graphql-client';
import { AuthTokenRequestErrorCode } from '../types';
import { generateToken } from './generateToken';

// TODO: Auth token mutations may leak user identities due to timing attacks :(
// We don't (currently) make any effort to mitigate the time taken to record the new token or sent the email when successful
export async function updateAuthToken(
  tokenType: 'passwordReset' | 'magicAuth',
  listKey: string,
  list: any,
  identityField: string,
  protectIdentities: boolean,
  identity: string,
  context: any
): Promise<
  | { success: false; code?: AuthTokenRequestErrorCode }
  | { success: true; itemId: string | number; token: string }
> {
  const items = await list.adapter.find({ [identityField]: identity });

  // Identity failures with helpful errors (unless it would violate our protectIdentities config)
  let specificCode: AuthTokenRequestErrorCode | undefined;
  if (items.length === 0) {
    specificCode = 'IDENTITY_NOT_FOUND';
  } else if (items.length > 1) {
    specificCode = 'MULTIPLE_IDENTITY_MATCHES';
  }
  if (specificCode !== undefined) {
    // There is no generic `AUTH_TOKEN_REQUEST_FAILURE` code; it's existance would alow values in the identity field to be probed
    return { success: false, code: protectIdentities ? undefined : specificCode };
  }

  // Save the token and related info back to the item
  await updateItem({
    context,
    listKey,
    item: {
      id: items[0].id,
      data: {
        [`${tokenType}Token`]: generateToken(20),
        [`${tokenType}IssuedAt`]: new Date().toISOString(),
        [`${tokenType}RedeemedAt`]: null,
      },
    },
  });

  return { success: true, itemId: item.id, token };
}
