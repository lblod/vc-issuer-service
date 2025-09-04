import bodyParser from 'body-parser';
import { app } from 'mu';

import * as vc from '@digitalbazaar/vc';

// Required to set up a suite instance with private key
import Router from 'express-promise-router';
import { VCIssuer } from './issuer-service';

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

const issuer = new VCIssuer();
await issuer.setup({
  issuerDid: process.env.ISSUER_DID as string,
  publicKey: process.env.ISSUER_PUBLIC_KEY as string,
  privateKey: process.env.ISSUER_PRIVATE_KEY as string,
});

router.get('/status', function (req, res) {
  res.send({
    service: 'vc-issuer-service',
    status: 'ok',
  });
});

router.post('/issue-credential', async function (req, res) {
  const holderDid = req.body.holderDid;
  const signedVC = await issuer.issueCredential(holderDid);
  console.log(JSON.stringify(signedVC, null, 2));

  // normally you'd verify the presentation, but let's already verify the credential
  const verificationResult = await vc.verifyCredential(signedVC);
  console.log(verificationResult);
  res.send(signedVC);
});
