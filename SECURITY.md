# Security Policy

## Supported Scope

Security reports are welcome for the code in this repository, especially issues involving:

- extension privilege misuse
- unsafe message passing between extension contexts and page contexts
- accidental data leakage through network requests
- storage exposure or cross-origin access bugs
- bundled runtime misuse that could enable code execution beyond intended scope

## Reporting A Vulnerability

Please do not open a public issue for a suspected security vulnerability.

Instead, report it privately to the maintainer with:

- a description of the issue
- affected file or feature
- reproduction steps
- impact assessment
- proof of concept if available

If you do not yet have a dedicated security contact address, add one before publishing widely.

## Disclosure Expectations

- provide reasonable time to investigate and fix the issue before public disclosure
- avoid publishing working exploit details until a fix or mitigation exists
- if the issue involves a third-party upstream dependency, coordinated disclosure may also be needed with that upstream project

## Out Of Scope

The following are generally out of scope unless they produce a real security impact in this repository:

- theoretical issues without a practical exploit path
- vulnerabilities that exist only in unrelated third-party services
- cosmetic CSP or permission concerns with no demonstrated abuse path

## Dependency And Upstream Notes

This project vendors and bundles third-party software, including Path of Building Community, wasmoon, and pako.

If a vulnerability originates in one of those upstream projects, a local mitigation may still be possible here, but the upstream project may also need to be notified.