import { CompactSign, exportJWK, generateKeyPair, SignJWT, type JWTPayload } from 'jose';

export const issuer = 'https://blazzz.cloudflareaccess.com';
export const audience = 'local-test-audience';
export const email = 'fabianma7@gmail.com';
export const keys = await generateKeyPair('RS256');
export const otherKeys = await generateKeyPair('RS256');
export const unsupportedKeys = await generateKeyPair('RS512');
export const jwks = { keys: [{ ...await exportJWK(keys.publicKey), kid: 'local', alg: 'RS256' }] };
export async function token(claims: JWTPayload = {}, header = {}, key = keys.privateKey) {
  return new SignJWT({ iss: issuer, aud: audience, exp: Math.floor(Date.now() / 1000) + 300, email, ...claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'local', ...header }).sign(key);
}
// CompactSign permits deliberately invalid claims while preserving a real signature.
export async function rawToken(exp: string, nbf?: string) {
  const payload = `{"iss":"${issuer}","aud":"${audience}","email":"${email}","exp":${exp}${nbf ? `,"nbf":${nbf}` : ''}}`;
  return new CompactSign(new TextEncoder().encode(payload))
    .setProtectedHeader({ alg: 'RS256', kid: 'local' }).sign(keys.privateKey);
}
