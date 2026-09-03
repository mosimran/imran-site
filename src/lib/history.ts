// Appendix A. Newest first, and the single source for three things: the table on
// /history/, the four most recent rows shown on the index, and the masthead
// identifier, which is history.length - 1. They cannot disagree because there is
// one array.
//
// It lived in index.astro until 2026-09-03, when the index hit its 60 KB cap and
// the eleventh row would not fit. Appendix A grows by a row every time anything
// on this site is corrected, so a page that renders all of it has a size that
// grows with the site's own honesty. Moving it follows Sections 3 and 5.

export type Revision = { date: string; change: string }

export const history: Revision[] = [
  { date: '2026-09-03', change: 'Section 6.7 added: the deletion promised since the gate was built now has a form. security.txt expiry is checked after every deploy. Erratum 7.27.' },
  { date: '2026-09-03', change: 'Slack alerting switched on, so 6.2 and the 6.6 processor table now say the address goes there too. Erratum 7.26.' },
  { date: '2026-09-03', change: 'The analytics beacon is kept and disclosed rather than denied, and the CSP that had been silently blocking it since 2025 is opened to that one host. Erratum 7.25.' },
  { date: '2026-09-03', change: 'Section 6: the resume link is no longer single use, because mail scanners were consuming it before the recipient. Section 6.6 added, naming who else processes a request. Erratum 7.24.' },
  { date: '2026-09-03', change: 'The security.txt address published in section 14 had returned 404 since 2026-08-13. Fixed, and checked live from now on. Erratum 7.23.' },
  { date: '2026-09-03', change: 'Implementation 3.8 written. All eight notes in Section 3 now have a body, none carries an invented figure. Erratum 7.22.' },
  { date: '2026-09-03', change: 'Implementation 3.7 written as a disclaimed reference design; its state said unwritten while its summary said production. Erratum 7.21.' },
  { date: '2026-09-03', change: 'Implementation 3.5 written as a disclaimed reference design. No note carries prototype text now. Erratum 7.20.' },
  { date: '2026-09-03', change: "Implementation 3.4 written as a disclaimed reference design; its summary and figures were the prototype's. Erratum 7.19." },
  { date: '2026-09-03', change: 'Implementation 3.2 rewritten as a disclaimed reference design, with five failure modes common to the category and still no figures. Erratum 7.18.' },
  { date: '2026-09-03', change: "Implementation 3.2's figures removed as the prototype's, and its failure modes marked as prototype text rather than record. Erratum 7.17." },
  { date: '2026-09-03', change: 'Implementation 3.6 written: the audit evidence programme, with the SOC 2 boundary from 5.15 section 8 repeated on its face. Erratum 7.16.' },
  { date: '2026-09-03', change: 'Section 3 table generated from the collection: hand-written, it contradicted erratum 7.13. Errata 7.14, 7.15. Appendix A moves to /history/, leaving the four most recent rows here.' },
  { date: '2026-09-03', change: 'Implementation 3.3 written. Retitled for the guarantee rather than the migration, and its prototype figures corrected. Erratum 7.13.' },
  { date: '2026-09-02', change: 'Erratum 7.11 corrected: it denied technologies it could not check. Erratum 7.12.' },
  { date: '2026-09-02', change: 'Implementation 3.1 written and its placeholder figures corrected, erratum 7.11.' },
  { date: '2026-09-02', change: 'Section 3 moves to its own complete index at /impl/, leaving a short table here. Same arrangement Section 5 has used since T09.' },
  { date: '2026-09-02', change: 'Section 3 gains 3.7 and 3.8, both unwritten because no figures were supplied.' },
  { date: '2026-09-02', change: 'Status of This Memo no longer claims to contain everything a résumé would.' },
  { date: '2026-09-02', change: "Section 14's claim about feed-ranked platforms narrowed to what it was meant to say. Erratum 7.10." },
  { date: '2026-09-01', change: 'Section 5 gains seven papers, 5.17 through 5.23. The role corrected in eight places, erratum 7.9.' },
  { date: '2026-08-31', change: 'Paper 5.1 retitled and expanded, erratum 7.8. Section 5 gains 5.15 and 5.16, Section 3 gains 3.6. Tenure corrected, erratum 7.7.' },
  { date: '2026-08-14', change: 'Thirteen entries in Section 5 gained a body, figures and retirement conditions. The retracted 5.10 has its text restored, struck through. Erratum 7.5.' },
  { date: '2026-08-13', change: 'Section 6 completed. Sections 8 and 9 added: publishing model, feeds, machine readers, signatures. Renumbered; no gaps.' },
  { date: '2026-06-11', change: 'Paper 5.1 revised, fourth revision.' },
  { date: '2026-01-04', change: 'Confidence values applied retroactively to all papers published before 2026. Six of them moved.' },
  { date: '2025-08-20', change: 'First publication.' },
]
