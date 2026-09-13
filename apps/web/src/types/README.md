# src/types (web)

Tipe **UI khusus web**. Kontrak data (`Member`, `Gender`, `MemberStatus`,
`ClassOption`, `MemberCreateBody`, `MemberUpdateBody`) tinggal di `@bisa/types`
(`packages/types`) dan di re-export dari `school.ts` supaya import `@/types/school`
yang sudah ada tetap jalan.

Aturan: jangan taruh tipe server/API di sini. Kontrak yang dipakai `apps/api`
wajib masuk `@bisa/types`.
