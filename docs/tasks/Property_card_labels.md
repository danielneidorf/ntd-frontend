# Pastato charakteristikos card — data labels + sparse layout

**Date:** 2026-07-21 · **Mode:** plan → Daniel approves → execute · atomic commits, hash + counts.
**Repos:** backend `~/dev/bustodnr`, frontend `~/dev/ntd`. Verify heads/trees; state baselines in the plan.
**Evidence:** the served `property_profile` for `dev-existing`, read live this session:

```
purpose "Gyvenamoji" · premises_type "flat" · usage_group_label null
year_built 1975 · floors null · total_area_m2 null · heated_area_m2 52.4
heated_area_m2_source null · wall_material null
heating_type "Centralizuotas šilumos tiekimas" · ventilation_type "Natūrali"
```
Snapshot carries `usage_group: "residential_multi_other"` — so the group data exists upstream while the profile's label is null.

**Standing rule that fixes the location of three of these:** customer-facing Lithuanian lives in backend templates, never in TypeScript. All label work below is backend-side.

## Verify first
1. Where `usage_group_label` is meant to be populated, and why it is null while the snapshot carries the group. Is a code→LT mapping shipped (the earlier mock rendered „Gyvenamieji daugiabučiai pastatai") or was it never wired?
2. Where `premises_type` is set and whether any LT mapping for it exists anywhere.
3. `ventilation_type`'s source — is „Natūrali" the registry's own value, or ours?
4. The area-label branch shipped last week: quote its conditions, then confirm the untagged case falls into the „Bendras plotas" branch.
5. Why the dev fixture carries no `heated_area_m2_source` — the bench currently exercises the degraded branch, so every review of this card sees the wrong one. Tag the fixture as part of this task if that's all it takes.

## The fixes

**F1 — `premises_type` gets a Lithuanian label.** „flat" → „Butas" (and the rest of the value set — enumerate it, don't guess). Serve the label; the FE renders what it's given. A raw English code on a Lithuanian report is the defect; the field itself is correct to show.

**F2 — populate `usage_group_label`.** The group is load-bearing (our whole comparison methodology keys on it) and the data is present. Per the earlier ruling the label reads „Naudojimo grupė" with no „(STR 2.01.02)" — the code stays in citations.

**F3 — complete the ventilation value.** „Natūrali" is a fragment: serve „Natūrali ventiliacija" (and the rest of the set), or if the value must stay bare, change the label to „Ventiliacija". Propose one, with the value set quoted.

**F4 — untagged area must not claim either fact.** Today: `heated_area_m2_source == null` → the card prints „Bendras plotas" over what is actually the heated area. Three cases, explicitly:
- source = registry/certificate heated → **„Šildomas plotas"**
- source = total-area proxy → **„Bendras plotas"** + the existing disclosure line
- source **null/untagged** → **„Plotas"**, no provenance line, no claim either way

Last week's fix removed one false label; this removes the one it introduced. Test all three branches.

**F5 — sparse layout (Daniel's ruling).** With `floors` and `wall_material` genuinely absent for flats, the card must look deliberate at six fields and correct at ten. Constraints, not pixels: null fields are omitted entirely (already true); the remaining fields must not leave holes in a two-column grid — propose the adaptive rule in-plan (single column below a threshold, or a flow that keeps pairs adjacent); keep the semantic grouping already ruled (identity → areas → physique → systems) and **DOM order = semantic order** so mobile stacking preserves it. Screenshot before/after in the report.

## Out of scope
Energy-class / EPC surfaces (separate card) · the area *value* question · glazing · anything resolver-side.

## Verification
Backend and frontend suites from their baselines; F4's three branches pinned; the card rendered in Chrome after the fixture is tagged, both sparse and full cases. New LT strings join the B8-4 review list.