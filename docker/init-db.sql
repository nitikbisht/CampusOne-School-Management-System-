-- Runs once, when the local Postgres volume is first created.
-- Separate database for automated integration tests so they never touch dev data.
CREATE DATABASE campusone_test OWNER campusone;
