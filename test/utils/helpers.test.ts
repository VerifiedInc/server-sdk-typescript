import * as cryptoLib from '@unumid/library-crypto';
import { PublicKeyInfo, EncryptedData, KeyPair, UnsignedCredentialPb, UnsignedString } from '@unumid/types';
import { getDIDDoc, getKeysFromDIDDoc } from '../../src/utils/didHelper';
import { doEncrypt } from '../../src/utils/encrypt';
import { doVerify } from '../../src/utils/verify';
import { getUUID } from '../../src/utils/helpers';
import { makeDummyUnsignedCredential } from '../verifier/mocks';

describe('UUID generation', () => {
  it('Generate UUID', () => {
    expect(getUUID()).toBeDefined();
  });
});

describe('Encrypt the given data', () => {
  const data: UnsignedString = { data: 'Data to encrypt' };
  const dataBytes = UnsignedString.encode(data).finish();
  const did = 'did:unum:3e48b969-5cf3-46c7-9c61-54de886d1382';

  let publicKeyObj: PublicKeyInfo[];
  let encryptedData: EncryptedData;
  let encryptSpy;

  beforeAll(async () => {
    const baseUrl = 'https://api.dev-unumid.co/';
    const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiaXNzdWVyIiwidXVpZCI6ImRmYTllNmY5LWUyMGYtNGU2MS05ODZjLTEwYjRjZDFmMDQxOCIsImRpZCI6ImRpZDp1bnVtOjNlNDhiOTY5LTVjZjMtNDZjNy05YzYxLTU0ZGU4ODZkMTM4MiIsImV4cCI6MTU5Njc2NzAzNi45NjQsImlhdCI6MTU5NzA1MDY4MX0.I-t3mDBTBjKeO_GZDyiXwgKwvlUIy_B6zcB1V3hZ2c0';
    encryptSpy = jest.spyOn(cryptoLib, 'encryptBytes', 'get');
    const didDocResponse = await getDIDDoc(baseUrl, authHeader, did);
    publicKeyObj = getKeysFromDIDDoc(didDocResponse.body, 'RSA');
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('returns the public key of the given type', () => {
    expect(publicKeyObj).toBeDefined();
    expect(publicKeyObj.length).toBeGreaterThan(0);
  });

  it('encrypt crypto library should have been called', () => {
    encryptedData = doEncrypt(did, publicKeyObj[0], dataBytes, '4.0.0');
    expect(encryptSpy).toBeCalled();
  });

  it('Encrypted data should be available', () => {
    expect(encryptedData).toBeDefined();
  });

  it('Encrypted data should have the key attribute', () => {
    expect(encryptedData.key).toBeDefined();
    expect(encryptedData.key.iv).toBeDefined();
  });
});

describe('doVerify, Verifies the given data - Success Scenario', () => {
  const data = makeDummyUnsignedCredential();
  const bytes: Uint8Array = UnsignedCredentialPb.encode(data).finish();
  // const data = { test: 'Data to Verify' };
  // const dataString = "{ test: 'Data to Verify' }";
  let keyPair: KeyPair, verifySpy, signature, retVal, publicKeyInfo;

  beforeAll(async () => {
    verifySpy = jest.spyOn(cryptoLib, 'verifyBytes', 'get');
    keyPair = await cryptoLib.generateEccKeyPair();
    publicKeyInfo = {
      publicKey: keyPair.publicKey,
      encoding: 'pem'
    };
    signature = cryptoLib.signBytes(bytes, keyPair.privateKey);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('verify crypto library should have been called', () => {
    retVal = doVerify(signature, bytes, publicKeyInfo);
    expect(verifySpy).toBeCalled();
  });

  it('doVerify should return true', () => {
    expect(retVal).toBeDefined();
    expect(retVal).toBe(true);
  });

  it('doVerify should return true while passing valid stringData optional param', () => {
    retVal = doVerify(signature, bytes, publicKeyInfo);
    expect(verifySpy).toBeCalled();
    expect(retVal).toBeDefined();
    expect(retVal).toBe(true);
  });
});
