import * as assert from 'assert';
import { parseBlamePorcelain, parseDiffHunks, parseCommitList } from '../src/git/porcelainParser';

function testDiffHunkParsing() {
  const sampleDiff = `diff --git a/file.txt b/file.txt
index 7a217ae..464fa02 100644
--- a/file.txt
+++ b/file.txt
@@ -3 +3,2 @@ line 2: modified
-line 3: old
+line 3: modified
+line 4: brand new line
@@ -10,3 +11,5 @@ line 9: context
`;

  const hunks = parseDiffHunks(sampleDiff);
  assert.strictEqual(hunks.length, 2, 'Should find 2 diff hunks');

  assert.strictEqual(hunks[0].oldStart, 3);
  assert.strictEqual(hunks[0].oldLines, 1);
  assert.strictEqual(hunks[0].newStart, 3);
  assert.strictEqual(hunks[0].newLines, 2);

  assert.strictEqual(hunks[1].oldStart, 10);
  assert.strictEqual(hunks[1].oldLines, 3);
  assert.strictEqual(hunks[1].newStart, 11);
  assert.strictEqual(hunks[1].newLines, 5);

  console.log('✓ testDiffHunkParsing passed');
}

function testBlamePorcelainParsing() {
  const sampleBlame = `51b1b85271fcd85523054a07b0c48ecaae97f954 1 1 1
author Alice
author-mail <alice@example.com>
author-time 1700000000
author-tz +0000
committer Alice
committer-mail <alice@example.com>
committer-time 1700000000
committer-tz +0000
summary Initial commit
filename file.txt
	line 1: pushed
a1e26ebe8d454dc72df7e875dacdca85698ee5ab 2 2 1
author Bob
author-mail <bob@example.com>
author-time 1700001000
author-tz +0000
committer Bob
committer-mail <bob@example.com>
committer-time 1700001000
committer-tz +0000
summary Local unpushed commit
previous 51b1b85271fcd85523054a07b0c48ecaae97f954 file.txt
filename file.txt
	line 2: unpushed
`;

  const unpushed = new Set<string>(['a1e26ebe8d454dc72df7e875dacdca85698ee5ab']);
  const blameMap = parseBlamePorcelain(sampleBlame, unpushed);

  assert.strictEqual(blameMap.size, 2, 'Should have 2 lines in blame map');

  const line1 = blameMap.get(1);
  assert.ok(line1, 'Line 1 should exist');
  assert.strictEqual(line1.shortHash, '51b1b85');
  assert.strictEqual(line1.author, 'Alice');
  assert.strictEqual(line1.summary, 'Initial commit');
  assert.strictEqual(line1.isPushed, true, 'Line 1 commit should be marked as pushed');

  const line2 = blameMap.get(2);
  assert.ok(line2, 'Line 2 should exist');
  assert.strictEqual(line2.shortHash, 'a1e26eb');
  assert.strictEqual(line2.author, 'Bob');
  assert.strictEqual(line2.summary, 'Local unpushed commit');
  assert.strictEqual(line2.isPushed, false, 'Line 2 commit should be marked as unpushed');

  console.log('✓ testBlamePorcelainParsing passed');
}

function testCommitListParsing() {
  const sampleLog = `a1e26ebe8d454dc72df7e875dacdca85698ee5ab	a1e26eb	Bob	2 hours ago	Add new feature
51b1b85271fcd85523054a07b0c48ecaae97f954	51b1b85	Alice	2 days ago	Initial commit
`;

  const commits = parseCommitList(sampleLog);
  assert.strictEqual(commits.length, 2, 'Should parse 2 commits');
  assert.strictEqual(commits[0].shortHash, 'a1e26eb');
  assert.strictEqual(commits[0].author, 'Bob');
  assert.strictEqual(commits[0].relativeDate, '2 hours ago');
  assert.strictEqual(commits[0].subject, 'Add new feature');

  assert.strictEqual(commits[1].shortHash, '51b1b85');
  assert.strictEqual(commits[1].author, 'Alice');

  console.log('✓ testCommitListParsing passed');
}

function runAll() {
  console.log('Running Git Porcelain Parser Unit Tests...\n');
  testDiffHunkParsing();
  testBlamePorcelainParsing();
  testCommitListParsing();
  console.log('\nAll unit tests passed successfully!');
}

runAll();
