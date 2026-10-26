import {createHash, createPublicKey, generateKeyPairSync, sign} from 'node:crypto';
import {chmodSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

export function createAuthStore(directory, origin) {
  mkdirSync(directory, {recursive: true, mode: 0o700});
  chmodSync(directory, 0o700);
  const identityPath = join(directory, 'device-identity.json');
  const tokenPath = join(directory, 'device-token.json');
  const read = path => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
  const save = (path, value) => {
    const temporary = `${path}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', {mode: 0o600, flag: 'wx'});
    renameSync(temporary, path);
    chmodSync(path, 0o600);
  };
  const bound = (record, params) => record?.origin === origin && record.deviceId === params.deviceId && record.role === params.role;
  return {
    loadOrCreateDeviceIdentity() {
      const existing = read(identityPath);
      if (existing) return existing;
      const {privateKey, publicKey} = generateKeyPairSync('ed25519');
      const raw = publicKey.export({format: 'der', type: 'spki'}).subarray(-32);
      const identity = {
        deviceId: createHash('sha256').update(raw).digest('hex'),
        publicKeyPem: publicKey.export({format: 'pem', type: 'spki'}).toString(),
        privateKeyPem: privateKey.export({format: 'pem', type: 'pkcs8'}).toString()
      };
      save(identityPath, identity);
      return identity;
    },
    signDevicePayload(privateKeyPem, payload) {
      return sign(null, Buffer.from(payload), privateKeyPem).toString('base64url');
    },
    publicKeyRawBase64UrlFromPem(publicKeyPem) {
      const key = createPublicKey(publicKeyPem);
      if (key.asymmetricKeyType !== 'ed25519') throw new Error('Expected an Ed25519 public key');
      return key.export({format: 'der', type: 'spki'}).subarray(-32).toString('base64url');
    },
    loadDeviceAuthToken(params) {
      const record = read(tokenPath);
      return bound(record, params) ? {token: record.token, scopes: record.scopes} : null;
    },
    storeDeviceAuthToken(params) {
      save(tokenPath, {origin, deviceId: params.deviceId, role: params.role, token: params.token, scopes: params.scopes});
    },
    clearDeviceAuthToken(params) {
      if (bound(read(tokenPath), params)) unlinkSync(tokenPath);
    },
    logDebug() {},
    logError() {}
  };
}
