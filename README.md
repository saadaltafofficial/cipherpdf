# CipherPDF

Open-source privacy-first PDF workspace built with **Svelte 5, Vite, PDF.js and pdf-lib**.

## Quick start

```bash
npm install
npm run dev
npm run build
npm run check
```

## Implemented

- Local PDF preview with paging
- Merge PDFs in sidebar order
- Extract page ranges, rotate pages
- Add a text annotation at PDF coordinates
- SHA-256 fingerprint of the original bytes
- PDF export and download without server-side uploads
- Responsive Svelte interface

## Security limitations

SHA-256 fingerprints do **not** authenticate document origin. Certificate validation, PAdES signatures, encryption, and irreversible redaction **are not implemented**. Inserting text does not edit existing PDF text. PDF processing happens locally, but the app is not security-audited. Don't use this release for sensitive document validation. Keep PDF dependencies patched.

## Milestones

- [x] Svelte application and local PDF tools
- [ ] Page thumbnails, page reordering and regression fixtures
- [ ] Standards-compliant AES-256 PDF encryption/decryption
- [ ] CMS/PAdES signatures and certificate-chain verification
- [ ] Certificate-backed signing and incremental PDF saves
- [ ] True irreversible redaction
- [ ] Hardened releases, fuzz tests, accessibility and security review

Apache-2.0 license.
