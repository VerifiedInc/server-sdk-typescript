import * as cryptoLib from '@unumid/library-crypto';
import { Proof, ProofPb, UnsignedCredentialPb, UnsignedString } from '@unumid/types';
import { createProof } from '../../src/utils/createProof';

describe('Signs the given data and returns Proof object', () => {
  const data: UnsignedString = { data: 'test Data Object' };
  const dataBytes = UnsignedString.encode(data).finish();
  const method = 'did:unum:9072a539-6a2e-495a-966b-eb03f5273116';

  let proof: Proof;
  let signSpy;

  beforeAll(async () => {
    signSpy = jest.spyOn(cryptoLib, 'signBytes', 'get');
    const { privateKey } = await cryptoLib.generateEccKeyPair();
    proof = createProof(dataBytes, privateKey, method);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('sign crypto library should have been called', () => {
    expect(signSpy).toBeCalled();
  });

  it('returns Proof object', () => {
    expect(proof).toBeDefined();
  });

  it('returns Proof Object with all required attributes', () => {
    expect(proof.created).toBeDefined();
    expect(proof.signatureValue).toBeDefined();
    expect(proof.type).toBe('secp256r1Signature2020');
    expect(proof.verificationMethod).toBe(method);
    expect(proof.proofPurpose).toBe('assertionMethod');
  });
});

describe('Signs the data using protobufs btye array and returns Proof object', () => {
  const data:ProofPb = {
    signatureValue: 'dummy',
    type: 'dummy',
    verificationMethod: 'dummy',
    created: new Date(),
    proofPurpose: 'dummy'
  };

  const method = 'did:unum:9072a539-6a2e-495a-966b-eb03f5273116';
  let proof: ProofPb;
  let signSpy;

  beforeAll(async () => {
    signSpy = jest.spyOn(cryptoLib, 'signBytes', 'get');
    const { privateKey } = await cryptoLib.generateEccKeyPair();

    const bytes = ProofPb.encode(data).finish();

    proof = createProof(bytes, privateKey, method);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('sign crypto library should have been called', () => {
    expect(signSpy).toBeCalled();
  });

  it('returns Proof object', () => {
    expect(proof).toBeDefined();
  });

  it('returns Proof Object with all required attributes', () => {
    expect(proof.created).toBeDefined();
    expect(proof.signatureValue).toBeDefined();
    expect(proof.type).toBe('secp256r1Signature2020');
    expect(proof.verificationMethod).toBe(method);
    expect(proof.proofPurpose).toBe('assertionMethod');
  });
});
