import bodyParser from 'body-parser';
import { app, query, errorHandler } from 'mu';
import jsonld from 'jsonld';

import * as vc from '@digitalbazaar/vc';

// Required to set up a suite instance with private key
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import Router from 'express-promise-router';
import { securityLoader } from '@digitalbazaar/security-document-loader';
import * as didKey from '@digitalbazaar/did-method-key';
import * as didWeb from '@digitalbazaar/did-method-web';
import * as didJwk from '@digitalbazaar/did-method-jwk';

const router = Router();
app.use(
  bodyParser.json({
    limit: '500mb',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: function (req: any) {
      return /^application\/json/.test(req.get('content-type') as string);
    },
  }),
);

app.use(router);
// Sample unsigned credential
const issuer = process.env.ISSUER_DID;
const credential = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://www.w3.org/2018/credentials/examples/v1',
  ],
  id: 'https://example.com/credentials/1872',
  type: ['VerifiableCredential', 'AlumniCredential'],
  issuer,
  issuanceDate: '2010-01-01T19:23:24Z',
  credentialSubject: {
    id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
    alumniOf: 'Example University',
  },
};

const keyPair = await Ed25519VerificationKey2020.from({
  type: 'Ed25519VerificationKey2020',
  controller: issuer,
  id: process.env.ISSUER_KEY_ID,
  publicKeyMultibase: process.env.ISSUER_PUBLIC_KEY,
  privateKeyMultibase: process.env.ISSUER_PRIVATE_KEY,
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

const documentLoader = loader.build();

const suite = new Ed25519Signature2020({ key: keyPair });

router.get('/status', function (req, res) {
  res.send({
    service: 'vc-issuer-service',
    status: 'ok',
  });
});

router.get('/issue-credential', async function (req, res) {
  const signedVC = await vc.issue({
    credential,
    suite,
    documentLoader,
  });
  console.log(JSON.stringify(signedVC, null, 2));

  // normally you'd verify the presentation, but let's already verify the credential
  const verificationResult = await vc.verifyCredential({
    credential: signedVC,
    suite: suite,
    documentLoader,
  });
  console.log(verificationResult);

  res.send(signedVC);
});
