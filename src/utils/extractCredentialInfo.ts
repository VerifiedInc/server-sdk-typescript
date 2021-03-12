import { isArrayNotEmpty } from '@unumid/library-issuer-verifier-utility';
import { CredentialInfo, Presentation } from '../types';

/**
 * Handler to extract credential reporting information meant to be relied to UnumID's SaaS for the enhanced analytics dashboard.
 * @param presentation // a post decrypted and verified presentation object;
 */
export const extractCredentialInfo = (presentation: Presentation): CredentialInfo => {
  return {
    // cut off the preceding 'VerifiableCredential' string in each credential type array
    credentialTypes: presentation.verifiableCredential.flatMap(cred => isArrayNotEmpty(cred.type) && cred.type[0] === 'VerifiableCredential' ? cred.type.slice(1) : cred.type),
    subjectDid: presentation.proof.verificationMethod
  };
};