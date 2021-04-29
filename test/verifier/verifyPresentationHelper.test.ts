// import * as utilLib from '../../src/utils';
import { Presentation, VerifiedStatus, UnumDto, Proof, CustError } from '../../src/index';
import { verifyCredential } from '../../src/verifier/verifyCredential';
import { isCredentialExpired } from '../../src/verifier/isCredentialExpired';
import { checkCredentialStatus } from '../../src/verifier/checkCredentialStatus';
import { dummyAuthToken, dummyEccPrivateKey, dummyIssuerDid, makeDummyDidDocument } from './mocks';
import { sign } from '@unumid/library-crypto';
import stringify from 'fast-json-stable-stringify';
import { verifyPresentationHelper as verifyPresentation, verifyPresentationHelper } from '../../src/verifier/verifyPresentationHelper';
import { CredentialRequest } from '@unumid/types';
import { JSONObj } from '../../src/types';
import { getDIDDoc } from '../../src/utils/didHelper';
import { makeNetworkRequest } from '../../src/utils/networkRequestHelper';
import { doVerify } from '../../src/utils/verify';

jest.mock('../../src/utils/didHelper', () => {
  const actual = jest.requireActual('../../src/utils/didHelper');
  return {
    ...actual,
    getDIDDoc: jest.fn()
  };
});

jest.mock('../../src/utils/verify', () => {
  const actual = jest.requireActual('../../src/utils/verify');
  return {
    ...actual,
    doVerify: jest.fn(() => actual.doVerify)
  };
});

jest.mock('../../src/utils/networkRequestHelper', () => ({
  ...jest.requireActual('../../src/utils/networkRequestHelper'),
  makeNetworkRequest: jest.fn()
}));

jest.mock('../../src/verifier/verifyCredential');
jest.mock('../../src/verifier/isCredentialExpired');
jest.mock('../../src/verifier/checkCredentialStatus');

const mockVerifyCredential = verifyCredential as jest.Mock;
const mockIsCredentialExpired = isCredentialExpired as jest.Mock;
const mockCheckCredentialStatus = checkCredentialStatus as jest.Mock;
const mockGetDIDDoc = getDIDDoc as jest.Mock;
const mockDoVerify = doVerify as jest.Mock;
const mockMakeNetworkRequest = makeNetworkRequest as jest.Mock;

const callVerifyPresentation = (context, type, verifiableCredential, presentationRequestUuid, proof, verifier, auth = '', credentialRequests): Promise<UnumDto<VerifiedStatus>> => {
  const presentation: Presentation = {
    '@context': context,
    type,
    verifiableCredential,
    presentationRequestUuid,
    verifierDid: verifier,
    proof,
    uuid: 'a'
  };
  return verifyPresentationHelper(auth, presentation, verifier, credentialRequests);
};

const copyCredentialObj = (credential: JSONObj, elemName: string, elemValue = ''): JSONObj => {
  const newCred: JSONObj = [
    {
      '@context': credential['@context'],
      credentialStatus: credential.credentialStatus,
      credentialSubject: credential.credentialSubject,
      issuer: credential.issuer,
      type: credential.type,
      id: credential.id,
      issuanceDate: credential.issuanceDate,
      proof: credential.proof
    }
  ];

  newCred[0][elemName] = elemValue;
  return (newCred);
};

describe('verifyPresentationHelper - Success Scenario with verifiableCredentialsString', () => {
  let response: UnumDto<VerifiedStatus>;
  let verStatus: boolean;

  const { context, type, verifiableCredential, verifiableCredentialString, presentationRequestUuid, proof, authHeader, verifier, credentialRequests } = populateMockData();

  beforeAll(async () => {
    const dummySubjectDidDoc = await makeDummyDidDocument();

    const dummyResponseHeaders = { 'x-auth-token': dummyAuthToken };
    mockGetDIDDoc.mockResolvedValueOnce({ body: dummySubjectDidDoc, headers: dummyResponseHeaders });
    mockDoVerify.mockResolvedValue(true);
    mockVerifyCredential.mockResolvedValue({ authToken: dummyAuthToken, body: true });
    mockIsCredentialExpired.mockReturnValue(false);
    mockCheckCredentialStatus.mockReturnValue({ authToken: dummyAuthToken, body: { status: 'valid' } });
    mockMakeNetworkRequest.mockResolvedValue({ body: { success: true }, headers: dummyResponseHeaders });
    response = await callVerifyPresentation(context, type, verifiableCredentialString, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
    verStatus = response.body.isVerified;
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('gets the subject did document', () => {
    expect(mockGetDIDDoc).toBeCalled();
  });

  it('verifies the presentation', () => {
    expect(mockDoVerify).toBeCalled();
  });

  it('verifies each credential', () => {
    verifiableCredential.forEach((vc) => {
      expect(mockVerifyCredential).toBeCalledWith(vc, authHeader);
    });
  });

  it('checks if each credential is expired', () => {
    verifiableCredential.forEach((vc) => {
      expect(mockIsCredentialExpired).toBeCalledWith(vc);
    });
  });

  it('checks the status of each credential', () => {
    verifiableCredential.forEach((vc) => {
      expect(mockCheckCredentialStatus).toBeCalledWith(authHeader, vc.id);
    });
  });

  it('Result should be true', () => {
    expect(verStatus).toBeDefined();
    expect(verStatus).toBe(true);
  });

  it('returns the x-auth-token header returned from the SaaS api in the x-auth-token header', () => {
    expect(response.authToken).toEqual(dummyAuthToken);
  });

  it('does not return an x-auth-token header if the SaaS does not return an x-auth-token header', async () => {
    const dummySubjectDidDoc = await makeDummyDidDocument();
    const dummyApiResponse = { body: dummySubjectDidDoc };
    mockMakeNetworkRequest.mockResolvedValueOnce(dummyApiResponse);
    mockGetDIDDoc.mockResolvedValue({ body: dummySubjectDidDoc, authToken: undefined });
    mockCheckCredentialStatus.mockReturnValue({ authToken: undefined, body: { status: 'valid' } });
    mockVerifyCredential.mockResolvedValue({ authToken: undefined, body: true });
    mockDoVerify.mockReturnValueOnce(true);
    response = await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
    expect(response.authToken).toBeUndefined();
  });
});

describe('verifyPresentationHelper - Success Scenario', () => {
  let response: UnumDto<VerifiedStatus>;
  let verStatus: boolean;

  const { context, type, verifiableCredential, verifiableCredentialString, presentationRequestUuid, proof, authHeader, verifier, credentialRequests } = populateMockData();

  beforeAll(async () => {
    const dummySubjectDidDoc = await makeDummyDidDocument();

    const dummyResponseHeaders = { 'x-auth-token': dummyAuthToken };
    mockGetDIDDoc.mockResolvedValueOnce({ body: dummySubjectDidDoc, headers: dummyResponseHeaders });
    mockDoVerify.mockResolvedValue(true);
    mockVerifyCredential.mockResolvedValue({ authToken: dummyAuthToken, body: true });
    mockIsCredentialExpired.mockReturnValue(false);
    mockCheckCredentialStatus.mockReturnValue({ authToken: dummyAuthToken, body: { status: 'valid' } });
    mockMakeNetworkRequest.mockResolvedValue({ body: { success: true }, headers: dummyResponseHeaders });
    response = await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
    verStatus = response.body.isVerified;
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('gets the subject did document', () => {
    expect(mockGetDIDDoc).toBeCalled();
  });

  it('verifies the presentation', () => {
    expect(mockDoVerify).toBeCalled();
  });

  it('verifies each credential', () => {
    verifiableCredential.forEach((vc) => {
      expect(mockVerifyCredential).toBeCalledWith(vc, authHeader);
    });
  });

  it('checks if each credential is expired', () => {
    verifiableCredential.forEach((vc) => {
      expect(mockIsCredentialExpired).toBeCalledWith(vc);
    });
  });

  it('checks the status of each credential', () => {
    verifiableCredential.forEach((vc) => {
      expect(mockCheckCredentialStatus).toBeCalledWith(authHeader, vc.id);
    });
  });

  it('Result should be true', () => {
    expect(verStatus).toBeDefined();
    expect(verStatus).toBe(true);
  });

  it('returns the x-auth-token header returned from the SaaS api in the x-auth-token header', () => {
    expect(response.authToken).toEqual(dummyAuthToken);
  });

  it('does not return an x-auth-token header if the SaaS does not return an x-auth-token header', async () => {
    const dummySubjectDidDoc = await makeDummyDidDocument();
    const dummyApiResponse = { body: dummySubjectDidDoc };
    mockMakeNetworkRequest.mockResolvedValueOnce(dummyApiResponse);
    mockGetDIDDoc.mockResolvedValue({ body: dummySubjectDidDoc, authToken: undefined });
    mockCheckCredentialStatus.mockReturnValue({ authToken: undefined, body: { status: 'valid' } });
    mockVerifyCredential.mockResolvedValue({ authToken: undefined, body: true });
    mockDoVerify.mockReturnValueOnce(true);
    response = await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
    expect(response.authToken).toBeUndefined();
  });
});

describe('verifyPresentationHelper - Failure Scenarios', () => {
  let response: UnumDto<VerifiedStatus>;
  let verStatus: boolean;
  const { context, type, verifiableCredential, presentationRequestUuid, proof, invalidProof, authHeader, verifier, credentialRequests } = populateMockData();

  beforeAll(async () => {
    const dummySubjectDidDoc = await makeDummyDidDocument();
    const dummyResponseHeaders = { 'x-auth-token': dummyAuthToken };

    mockDoVerify.mockReturnValueOnce(false);
    mockVerifyCredential.mockResolvedValue({ authToken: dummyAuthToken, body: false });
    mockIsCredentialExpired.mockReturnValue(true);
    mockCheckCredentialStatus.mockReturnValue({ authToken: dummyAuthToken, body: { status: 'revoked' } });
    verifiableCredential[0].proof.verificationMethod = proof.verificationMethod;
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('gets the subject did document', async () => {
    const dummySubjectDidDoc = await makeDummyDidDocument();
    const dummyResponseHeaders = { 'x-auth-token': dummyAuthToken };
    mockGetDIDDoc.mockResolvedValueOnce({ body: dummySubjectDidDoc, headers: dummyResponseHeaders });
    response = await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, invalidProof, verifier, authHeader, credentialRequests);
    verStatus = response.body.isVerified;
    expect(mockGetDIDDoc).toBeCalled();
  });

  it('verifies the presentation', async () => {
    expect(mockDoVerify).toBeCalled();
  });

  it('Result should be true', () => {
    expect(verStatus).toBeDefined();
    expect(verStatus).toBe(false);
  });

  it('returns a isVerified false with proper message if the did document has no public keys', async () => {
    const dummyDidDocWithoutKeys = {
      ...makeDummyDidDocument(),
      publicKey: []
    };
    const dummyResponseHeaders = { 'x-auth-token': dummyAuthToken };
    mockGetDIDDoc.mockResolvedValueOnce({ body: dummyDidDocWithoutKeys, headers: dummyResponseHeaders });
    const response = await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
    expect(response.body.isVerified).toBe(false);
    expect(response.body.message).toBe('Public key not found for the DID associated with the proof.verificationMethod');
  });

  it('returns a 404 status code if the did document is not found', async () => {
    mockGetDIDDoc.mockResolvedValueOnce(new CustError(404, 'DID Document not found.'));

    try {
      await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toEqual(404);
    }
  });

  it('returns a isVerified false with proper message if the verifierDid does not match the one in the presentation.', async () => {
    const dummyDidDocWithoutKeys = {
      ...makeDummyDidDocument(),
      publicKey: []
    };
    const dummyResponseHeaders = { 'x-auth-token': dummyAuthToken };
    mockGetDIDDoc.mockResolvedValueOnce({ body: dummyDidDocWithoutKeys, headers: dummyResponseHeaders });

    const presentation: Presentation = {
      '@context': context,
      type,
      verifiableCredential,
      presentationRequestUuid,
      verifierDid: verifier,
      proof,
      uuid: 'a'
    };
    const response = await verifyPresentation(authHeader, presentation, 'fakeVerifierDid', credentialRequests);

    // const response = await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
    expect(response.body.isVerified).toBe(false);
    expect(response.body.message).toBe(`The presentation was meant for verifier, ${presentation.verifierDid}, not the provided verifier, fakeVerifierDid.`);
  });
});

describe('verifyPresentationHelper - Validation Failures', () => {
  const { context, type, verifiableCredential, presentationRequestUuid, proof, authHeader, verifier, credentialRequests } = populateMockData();

  it('returns a 400 status code with a descriptive error message when @context is missing', async () => {
    try {
      await callVerifyPresentation('', type, verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: @context is required.');
    }
  });

  it('returns a 400 status code with a descriptive error message when type is missing', async () => {
    try {
      await callVerifyPresentation(context, '', verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: type is required.');
    }
  });

  it('returns a 400 status code with a descriptive error message when verifiableCredential is missing', async () => {
    try {
      await callVerifyPresentation(context, type, '', presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: verifiableCredential must be a non-empty array.');
    }
  });

  it('returns a 400 status code with a descriptive error message when presentationRequestUuid is missing', async () => {
    try {
      await callVerifyPresentation(context, type, verifiableCredential, '', proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: presentationRequestUuid is required.');
    }
  });

  it('returns a 400 status code with a descriptive error message when proof is missing', async () => {
    try {
      await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, '', verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: proof is required.');
    }
  });

  it('returns a 400 status code with a descriptive error message when @context is not an array', async () => {
    try {
      await callVerifyPresentation('https://www.w3.org/2018/credentials/v1', type, verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: @context must be a non-empty array.');
    }
  });

  it('returns a 400 status code with a descriptive error message when @context array is empty', async () => {
    try {
      await callVerifyPresentation([], type, verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: @context must be a non-empty array.');
    }
  });

  it('returns a 400 status code with a descriptive error message when type is not an array', async () => {
    try {
      await callVerifyPresentation(context, 'VerifiablePresentation', verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: type must be a non-empty array.');
    }
  });

  it('returns a 400 status code with a descriptive error message when type is empty', async () => {
    try {
      await callVerifyPresentation(context, [], verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: type must be a non-empty array.');
    }
  });

  it('returns a 400 status code with a descriptive error message when verifiableCredential is not an array', async () => {
    try {
      await callVerifyPresentation(context, type, 'verifiableCredential', presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: verifiableCredential must be a non-empty array.');
    }
  });

  it('returns a 400 status code with a descriptive error message when verifiableCredentials array is empty', async () => {
    try {
      await callVerifyPresentation(context, type, undefined, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: verifiableCredential must be a non-empty array.');
    }
  });

  it('returns a 401 status code if x-auth-token header is missing', async () => {
    try {
      await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, proof, verifier, '', credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toEqual(401);
    }
  });
});

describe('verifyPresentation - Validation for verifiableCredential object', () => {
  let response: JSONObj, preReq: JSONObj;
  const { context, type, verifiableCredential, presentationRequestUuid, proof, authHeader, verifier, credentialRequests } = populateMockData();

  let cred;
  it('Response code should be ' + 400 + ' when @context is not passed', async () => {
    cred = copyCredentialObj(verifiableCredential[0], '@context');
    try {
      await callVerifyPresentation(context, type, cred, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid verifiableCredential[0]: @context is required.');
    }
  });

  it('Response code should be ' + 400 + ' when credentialStatus is not passed', async () => {
    cred = copyCredentialObj(verifiableCredential[0], 'credentialStatus');
    try {
      await callVerifyPresentation(context, type, cred, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid verifiableCredential[0]: credentialStatus is required.');
    }
  });

  it('Response code should be ' + 400 + ' when credentialSubject is not passed', async () => {
    cred = copyCredentialObj(verifiableCredential[0], 'credentialSubject');
    try {
      await callVerifyPresentation(context, type, cred, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid verifiableCredential[0]: credentialSubject is required.');
    }
  });

  it('Response code should be ' + 400 + ' when issuer is not passed', async () => {
    cred = copyCredentialObj(verifiableCredential[0], 'issuer');
    try {
      await callVerifyPresentation(context, type, cred, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid verifiableCredential[0]: issuer is required.');
    }
  });

  it('Response code should be ' + 400 + ' when type is not passed', async () => {
    cred = copyCredentialObj(verifiableCredential[0], 'type');
    try {
      await callVerifyPresentation(context, type, cred, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid verifiableCredential[0]: type is required.');
    }
  });

  it('Response code should be ' + 400 + ' when id is not passed', async () => {
    cred = copyCredentialObj(verifiableCredential[0], 'id');
    try {
      await callVerifyPresentation(context, type, cred, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid verifiableCredential[0]: id is required.');
    }
  });

  it('Response code should be ' + 400 + ' when issuanceDate is not passed', async () => {
    cred = copyCredentialObj(verifiableCredential[0], 'issuanceDate');
    try {
      await callVerifyPresentation(context, type, cred, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid verifiableCredential[0]: issuanceDate is required.');
    }
  });

  it('Response code should be ' + 400 + ' when proof is not passed', async () => {
    cred = copyCredentialObj(verifiableCredential[0], 'proof');
    try {
      await callVerifyPresentation(context, type, cred, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid verifiableCredential[0]: proof is required.');
    }
  });
});

describe('verifyPresentation credential matches requests', () => {
  // let context, type, cred, presentationRequestUuid, proof, verifier, authHeader, credentialRequests;
  // const { context, type, verifiableCredential, verifiableCredentialString, presentationRequestUuid, proof, authHeader, verifier, credentialRequests } = populateMockData();
  beforeAll(async () => {
    // const dummySubjectDidDoc = await makeDummyDidDocument();

    // const dummyResponseHeaders = { 'x-auth-token': dummyAuthToken };
    // mockGetDIDDoc.mockResolvedValueOnce({ body: dummySubjectDidDoc, headers: dummyResponseHeaders });
    // mockDoVerify.mockResolvedValue(true);
    // mockVerifyCredential.mockResolvedValue({ authToken: dummyAuthToken, body: true });
    // mockIsCredentialExpired.mockReturnValue(false);
    // mockCheckCredentialStatus.mockReturnValue({ authToken: dummyAuthToken, body: { status: 'valid' } });
    // mockMakeNetworkRequest.mockResolvedValue({ body: { success: true }, headers: dummyResponseHeaders });
    // response = await callVerifyPresentation(context, type, verifiableCredentialString, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
    // verStatus = response.body.isVerified;
    // const { context, type, verifiableCredential, verifiableCredentialString, presentationRequestUuid, proof, authHeader, verifier, credentialRequests } = populateMockData();
  });

  it('Response code should be ' + 400 + ' when credentials do not meet credential request type requirements', async () => {
    const { context, type, verifiableCredential, verifiableCredentialString, presentationRequestUuid, proof, authHeader, verifier, credentialRequests } = populateMockData();
    verifiableCredential[0].type = ['VerifiableCredential', 'AddressCredential'];
    try {
      await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: credentials provided did not meet type requirements, [AddressCredential], per the presentation request, [UsernameCredential].');
    }
  });

  it('Response code should be ' + 400 + ' when credentials do not meet credential request issuer requirements', async () => {
    const { context, type, verifiableCredential, verifiableCredentialString, presentationRequestUuid, proof, authHeader, verifier, credentialRequests } = populateMockData();
    verifiableCredential[0].issuer = dummyIssuerDid;
    try {
      await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, proof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe(`Invalid Presentation: credentials provided did not meet issuer requirements, [${dummyIssuerDid}], per the presentation request, [did:unum:7fc1753e-cdb7-428a-b6ce-eefc0e3634e5].`);
    }
  });
});

describe('verifyPresentationHelper - Validation for proof object', () => {
  const { context, type, verifiableCredential, presentationRequestUuid, proof, authHeader, verifier, credentialRequests } = populateMockData();

  it('returns a 400 status code with a descriptive error message when created is missing', async () => {
    const invalidProof = { created: '', signatureValue: proof.signatureValue, type: proof.type, verificationMethod: proof.verificationMethod, proofPurpose: proof.proofPurpose };
    try {
      await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, invalidProof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: proof.created is required.');
    }
  });

  it('returns a 400 status code with a descriptive error message when signatureValue is missing', async () => {
    const invalidProof = { created: proof.created, signatureValue: '', type: proof.type, verificationMethod: proof.verificationMethod, proofPurpose: proof.proofPurpose };
    try {
      await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, invalidProof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: proof.signatureValue is required.');
    }
  });

  it('returns a 400 status code with a descriptive error message when type is missing', async () => {
    const invalidProof = { created: proof.created, signatureValue: proof.signatureValue, type: '', verificationMethod: proof.verificationMethod, proofPurpose: proof.proofPurpose };
    try {
      await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, invalidProof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: proof.type is required.');
    }
  });

  it('returns a 400 status code with a descriptive error message when verificationMethod is missing', async () => {
    const invalidProof = { created: proof.created, signatureValue: proof.signatureValue, type: proof.type, verificationMethod: '', proofPurpose: proof.proofPurpose };
    try {
      await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, invalidProof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: proof.verificationMethod is required.');
    }
  });

  it('returns a 400 status code with a descriptive error message when proofPurpose is missing', async () => {
    const invalidProof = { created: proof.created, signatureValue: proof.signatureValue, type: proof.type, verificationMethod: proof.verificationMethod, proofPurpose: '' };
    try {
      await callVerifyPresentation(context, type, verifiableCredential, presentationRequestUuid, invalidProof, verifier, authHeader, credentialRequests);
      fail();
    } catch (e) {
      expect(e.code).toBe(400);
      expect(e.message).toBe('Invalid Presentation: proof.proofPurpose is required.');
    }
  });
});
