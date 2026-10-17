# CipherPDF

Open-source, **local-first PDF tools** built with Vite, PDF.js, and pdf-lib. Alpha v0.1.

## Features (implemented)

- Open multiple PDFs without uploading documents to a server
- Preview the first page of the selected PDF
- Merge PDFs in the order they were added
- Extract arbitrary page ranges (`1-3,5`)
- Rotate every page of a PDF 90° clockwise
- Compute SHA-256 fingerprint of the original document bytes using Web Crypto

## Getting started

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

Build: `npm run build`.

## Security notes

- File operations execute client-side; the app does not send document contents to a backend.
- The SHA-256 feature detects changes **only when compared against a previously trusted fingerprint**. It does **not** verify a PDF digital signature, establish authorship, or prove a document is safe.
- Standard browser and supply-chain considerations still apply. For sensitive use, self-host and review dependencies.
- Password-protected PDFs, arbitrary existing-text editing, PDF signatures, secure redaction, and encryption are **not implemented** yet.
- Do not rely on this alpha version for legally binding signing or sensitive-document redaction.

## Roadmap

- [ ] PDF signature verification (PAdES / certificate chain validation)
- [ ] Certificate-backed signing, including incremental updates
- [ ] PDF encryption and secure password handling
- [ ] Comments, forms, and annotation editing
- [ ] PDF redaction with content removal and validation
- [ ] Rust WASM core and CLI; offline desktop distribution
- [ ] Tests, fuzzing, security review and reproducible builds

## License

Apache-2.0. See [LICENSE](LICENSE).

## Contributing

Issues and pull requests are welcome. Please report security vulnerabilities privately to the maintainer rather than posting proof-of-concept exploits publicly.
