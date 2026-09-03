-- Adds a view counter. Needed because the token stopped burning on first read
-- on 2026-09-03: it is now valid for its whole 24 hour life, so `redeemed_at`
-- records the first open and can no longer tell anybody how often a link was
-- used. Section 6.4 promises the timestamps detect token sharing, and without
-- this column that promise would have quietly stopped being true.
--
-- Additive with a default, so existing rows keep working and a rollback is a
-- column nobody reads.
ALTER TABLE cv_token ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
