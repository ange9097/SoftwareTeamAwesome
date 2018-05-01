-- Start a transaction.
BEGIN;

-- Plan the tests.
SELECT tap.plan(7);

SET @testuser1='APerkins';
SET @testuser2='JLeslie';
SET @testuser3='JSmith';

-- Run the tests.
SELECT tap.pass( 'This should always pass' );

SELECT tap.eq(username, @testuser1, 'This verifies APerkins in users') FROM users WHERE username='APerkins';

SELECT tap.eq(username, @testuser2, 'This verifies JLeslie in users') FROM users WHERE username='JLeslie';

SELECT tap.eq(username, @testuser3, 'This verifies JSmith in users') FROM users WHERE username='JSmith';

SELECT tap.eq(username, @testuser1, 'This verifies APerkins in calendarEvents') FROM calendarEvents WHERE username='APerkins';

SELECT tap.eq(username, @testuser2, 'This verifies JLeslie in calendarEvents') FROM calendarEvents WHERE username='JLeslie';

SELECT tap.eq(username, @testuser3, 'This verifies JSmith in calendarEvents') FROM calendarEvents WHERE username='JSmith';
-- Finish the tests and clean up.
CALL tap.finish();
ROLLBACK;