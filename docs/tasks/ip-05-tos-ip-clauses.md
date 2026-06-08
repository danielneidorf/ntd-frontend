# IP-05 · ToS IP-clauses — session brief

**Owner:** Daniel · MB NTD
**Due:** Sun 7 Jun 2026 (date-locked — first paying customers in the 29 Jun–31 Jul launch window must be bound by these terms from transaction #1)
**Estimated effort:** ~1.5 hrs
**Deliverable:** an updated ToS file in the repo, committed, with a 1-paragraph summary of what changed and what was left as TBD.

---

## 1. Why this exists

IP-05 is the **customer-facing legal layer** of the four-layer IP stack. The other three are:

- **IP-01** — copyright assignment deed (Daniel → MB NTD). Status: check whether signed.
- **IP-02** — trade-secret protocol v1 (`trade_secret_protocol_v1.md`). Status: ✓ DONE 31 May. Classification, marking, access controls, "reasonable measures" record.
- **IP-06** — LICENSE/COPYRIGHT files + PDF footer DB-rights notice. Status: scheduled 14 Jun.
- **IP-07/08** — TM filing (NTD wordmark, LT €180) + defensive domains (ntd.pl / .eu / .com). Status: scheduled 30 Jun.

IP-02 locks the methodology down **internally** (file headers · access controls · reasonable measures). IP-05 locks it down **externally** — so a customer can't claim derived rights from using the product. Without IP-05, the rest of the stack has weaker teeth.

---

## 2. The five clauses to add

Add to the existing ToS (or create a new "Intellectual Property" section if none exists). The five clauses, drafted once, should be mirrored consistently in LT and EN versions (LT is binding per governing-law clause; EN is reference).

### 2.1 Ownership

MB NTD owns the platform, the reports it generates, the methodology behind them, and the database of accumulated/derived facts. The customer receives a **non-exclusive, non-transferable, revocable license** to use the product for their own purposes; they do not acquire any IP rights through purchase or use.

### 2.2 Methodology

The analytical methodology — including but not limited to the 17 usage groups × 7 era bands carrier-inference logic, EPC fallback rules, the Block 1 / Block 2 internals, and any derived heuristics — is the **proprietary trade secret of MB NTD** (cf. IP-02). The customer acknowledges this proprietary status and agrees not to attempt to extract, document, or commercialize the methodology.

This is the public-facing companion to the IP-02 protocol.

### 2.3 Database rights

The accumulated database (per-property readings, derived energy intensities, normalized facts, etc.) is protected under **Directive 96/9/EC** (EU Database Directive) — *sui generis* rights granted to the maker of a database in whose obtaining, verification, or presentation there has been substantial investment. The customer may consult their individual report but **may not extract or re-utilize substantial parts** of the database, whether quantitatively or qualitatively assessed, nor systematically extract insubstantial parts in a manner inconsistent with normal use.

Pairs with IP-06 (14 Jun), which puts the matching `© MB NTD · Database rights reserved (Direktyva 96/9/EB)` notice in the PDF footer.

### 2.4 No reverse-engineering

The customer shall not decompile, disassemble, reverse-engineer, or otherwise attempt to derive the source code, algorithms, methodology, or trade secrets of the product, whether from the product surface, output reports, API responses, or any other means. Pattern-inference attacks on the methodology are included in this prohibition.

### 2.5 Governing law and jurisdiction

This agreement is governed by **Lithuanian law**. Any dispute arising from or related to the agreement shall be submitted to the exclusive jurisdiction of the **competent courts of the Republic of Lithuania**. This is critical for enforceability — without it, a foreign customer could litigate in a jurisdiction with weaker IP protections and the rest of the stack loses teeth.

---

## 3. Pre-draft checks (do these first)

1. **Locate the current ToS.** Likely paths to probe: `docs/legal/`, `docs/external/`, repo root, or the landing-page source. If there isn't one in the repo, check whether there's a placeholder draft anywhere or whether this is a green-field write. If green-field: note that the deliverable is a fresh ToS *with* the five clauses, not just a clauses snippet.
2. **Cross-reference the License Agreement** — `MB-NTD-IP-2026-01` (Software & IP License Agt, signed 17 May). The ToS clauses must use the same definitions, same scope language, same governing-law clause as the License Agt — these documents have to say the same thing in the same words. Pull the License Agt and lift the controlling wording where there's overlap.
3. **Cross-reference IP-02 trade-secret protocol v1** for the precise definition of "methodology" and what is classified — the ToS methodology clause should track that vocabulary exactly.
4. **Check IP-01 status.** If the copyright assignment from Daniel → MB NTD is not yet signed, the ownership clause should still say "MB NTD owns…" because the assignment is being executed, but flag this as a coordination point.
5. **Check the language posture.** Is the current ToS LT-only, EN-only, or bilingual? If bilingual, both versions need updating; if monolingual, decide whether IP-05 is the right time to introduce a parallel-language version (probably no — keep scope tight).

---

## 4. Open questions to resolve while drafting

- **Quantitative thresholds for "substantial part"** in the database clause: the EU Database Directive doesn't define a hard number; the LT/EU case law is the guide. Note in the brief what threshold (if any) to state explicitly versus leave to "as assessed under applicable law."
- **Whether to add a separate "feedback and improvements" clause** (customer feedback assigned to MB NTD on a non-exclusive royalty-free basis) — strictly speaking this is not on the IP-05 list, but it's the natural neighbor. Recommend **adding it** if the existing ToS doesn't already have one. ~10 min of incremental work.
- **AI-output clause** — should the ToS state that AI-generated portions of reports (the P7-B AI voice/chat layer) carry the same MB NTD ownership? Probably yes — flag it. ~10 min of incremental work.

---

## 5. Acceptance criteria

- [ ] All five clauses present and consistent with License Agt MB-NTD-IP-2026-01 and IP-02 trade-secret protocol v1.
- [ ] Governing-law clause specifies Lithuanian law + LT court jurisdiction explicitly.
- [ ] Database clause cites Direktyva 96/9/EB by name (or its LT equivalent transposition).
- [ ] Methodology clause uses the same proprietary-information vocabulary as IP-02.
- [ ] LT version is the binding text (if bilingual).
- [ ] Diff is committed with a clear message: `IP-05 · add IP clauses to ToS (ownership · methodology · DB rights · no reverse-engineering · governing law)`.
- [ ] 1-paragraph summary in chat: what was changed, what was left as TBD, any blockers that need Daniel's input before the 7 Jun lock.

---

## 6. Out of scope (don't drift)

- The PDF footer / LICENSE / COPYRIGHT files — those are IP-06, scheduled 14 Jun. Don't conflate.
- The actual trademark filing — IP-07, scheduled 30 Jun.
- Privacy policy / GDPR clauses — separate document, separate sequence; the ToS update should not bundle GDPR rework.
- The address cascade from the JAR-4 buveinė change — if the ToS has an MB NTD address in it, leave it as-is; the address update is a separate sequential task post-JAR-4 (see Gantt §H).

---

## 7. Reference files in the workspace

- `ntd-ip-protection-plan-v1.md` — §3.1 contains the full IP-05 specification.
- `ip-03-vpb-call-prep-brief.md` — context on the IP-04 VPB call outcome (NTD wordmark only, no QuickScan-Lite, no logo) — relevant because it locks the scope of the marks the ToS protects.
- `ntd_9day_gantt_3_11_jun.html` — current Gantt; §B (Strategic / IP) has the IP-05 bar on Sun 7 Jun and the surrounding context.

---

## 8. What to deliver back

1. The updated ToS file path(s) in the repo.
2. A diff or short summary of the actual clause text used.
3. A list of any TBDs left for Daniel's decision (e.g. "kept the 'substantial part' threshold as 'as assessed under applicable law' — confirm or specify").
4. Confirmation that the License Agt and trade-secret protocol vocabulary were cross-checked.

That's it. Sun 7 Jun is the hard date — the August-onwards trade-secret file headers (IP-09) and the 30 Jun TM filing (IP-07) both assume IP-05 has shipped.