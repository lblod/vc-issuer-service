# VC Issuer service

> [!WARNING]
> This service is currently under development and cannot be used in a production context yet

## Issuing verifiable credentials

While this service is in development, you can test the current state using a `POST` to endpoint `/issue-credential`
This endpoint expects a body with the following JSON:

```json
{
  "holderDid": "the did of the holder to award the credential to"
}
```

For now the service will simply award an example credential, but it will already sign (and self verify it). To that end the service needs the following environment variables to be set:

- `ISSUER_DID`: the `did:web` of the issuer. Make sure that this is a working and dereferenceable `did:web` because the verification step will dereference it to get its public key. If you don't have a `did:web` yet, see the `vc-wallet-service`.
- `ISSUER_PUBLIC_KEY`: the public key of the `did:web` type Ed25519VerificationKey2020
- `ISSUER_PRIVATE_KEY`: the private key of the `did:web` type Ed25519VerificationKey2020
- `CREDENTIAL_URI_BASE`: the uri base for the new credential being awarded (optional, defaults to http://localhost/credential)

The endpoint returns the signed verifiable credential, the service logs whether verification was successful (as in a real scenario it shouldn't verify its own credentials ofc).
