import jsonld from 'jsonld';

import * as vc from '@digitalbazaar/vc';

// Required to set up a suite instance with private key
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import { securityLoader } from '@digitalbazaar/security-document-loader';
import * as didKey from '@digitalbazaar/did-method-key';
import * as didWeb from '@digitalbazaar/did-method-web';
import * as didJwk from '@digitalbazaar/did-method-jwk';
import { randomUUID } from 'crypto';

export class VCIssuer {
  suite: Ed25519Signature2020;
  documentLoader: (url: string) => Promise<unknown>;
  issuerDid: string;

  async setup({
    issuerDid,
    publicKey,
    privateKey,
  }: {
    issuerDid: string;
    publicKey: string;
    privateKey: string;
  }) {
    const keyPair = await Ed25519VerificationKey2020.from({
      type: 'Ed25519VerificationKey2020',
      controller: issuerDid,
      id: issuerDid,
      publicKeyMultibase: publicKey,
      privateKeyMultibase: privateKey,
    });

    const loader = securityLoader();
    loader.setProtocolHandler({
      protocol: 'https',
      handler: {
        get: async ({ url }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (jsonld as any).get(url, {});

          return result.document;
        },
      },
    });
    const didKeyDriver = didKey.driver();
    const didWebDriver = didWeb.driver();
    const didJwkDriver = didJwk.driver();
    // did:key is included by default, but let's be explicit
    loader.protocolHandlers.get('did').use(didKeyDriver);
    loader.protocolHandlers.get('did').use(didWebDriver);
    loader.protocolHandlers.get('did').use(didJwkDriver);

    this.issuerDid = issuerDid;
    this.documentLoader = loader.build();

    this.suite = new Ed25519Signature2020({ key: keyPair });
  }

  // for demo purposes for now, we will need to issue a credential containing the roles in the data space
  async issueCredential(holderDid: string) {
    // Sample unsigned credential
    const credentialBase =
      process.env.CREDENTIAL_URI_BASE || 'http://localhost/credential/';
    const credentialUri = `${credentialBase}${randomUUID()}`;
    const credential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1',
      ],
      id: credentialUri,
      type: ['VerifiableCredential', 'AlumniCredential'],
      issuer: this.issuerDid,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: holderDid,
        alumniOf: 'Example University',
      },
    };
    const signedVC = await vc.issue({
      credential,
      suite: this.suite,
      documentLoader: this.documentLoader,
    });
    return signedVC;
  }

  // for demo purposes, normally the verifier would do this
  async verifyCredential(signedVC) {
    const verificationResult = await vc.verifyCredential({
      credential: signedVC,
      suite: this.suite,
      documentLoader: this.documentLoader,
    });

    return verificationResult;
  }
}
