-- 07-ledger-notes.sql — free-text note on ledger entries (e.g. check denial reasons).
alter table ledger add column if not exists note text;
