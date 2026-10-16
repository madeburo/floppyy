import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import { deleteFile, exportBackup, fileName, getDraft, getFile, importBackup, listFiles, parseBackup, renameFile, saveFile, validateContent, writeDraft } from "../lib/personalFiles";

test("file names keep extensions and reject paths", () => {
  assert.equal(fileName("My note", "text"), "My note.txt");
  assert.equal(fileName("Picture.PNG", "image"), "Picture.PNG");
  for (const name of ["", "../file", "C:\\file", "bad\u0000name", "trailing."]) assert.throws(() => fileName(name, "text"));
  assert.equal(fileName("a".repeat(96), "text").length, 100);
  assert.throws(() => fileName("a".repeat(97), "text"));
});

test("backups reject unsupported formats and executable image content", () => {
  for (const raw of ["not json", "null", "{}", '{"format":"floppyy-files","version":2,"files":[]}']) assert.throws(() => parseBackup(raw));
  assert.throws(() => validateContent({ name: "test", kind: "image", content: "data:image/svg+xml,<svg/>" }));
  assert.throws(() => validateContent({ name: "test", kind: "image", content: "data:image/png;base64,YmFk" }));
});

test("files, drafts, conflicts, and backup imports are transactional", async () => {
  const note = await saveFile({ name: "Memo", kind: "text", content: "First version" });
  assert.equal((await getFile(note.id))?.content, "First version");
  await assert.rejects(saveFile({ name: "memo.txt", kind: "text", content: "Duplicate" }), /already exists/);
  await assert.rejects(saveFile({ name: "README.txt", kind: "text", content: "Duplicate" }), /already exists/);
  await writeDraft({ name: note.name, kind: "text", source: `file:${note.id}`, fileId: note.id, revision: note.revision, content: "Unsaved", savedContent: note.content });
  assert.equal((await getDraft("text", `file:${note.id}`))?.content, "Unsaved");
  const edited = await saveFile({ ...note, content: "Second version" });
  assert.equal(await getDraft("text", `file:${note.id}`), undefined);
  await assert.rejects(saveFile({ ...note, content: "Stale tab" }), /changed or was deleted/);
  assert.equal((await getFile(note.id))?.content, "Second version");
  await renameFile(edited, "Renamed");
  assert.equal((await getFile(note.id))?.name, "Renamed.txt");
  const backup = await exportBackup();
  assert.equal(parseBackup(backup).length, 1);
  assert.equal(await importBackup(backup), 1);
  assert.deepEqual((await listFiles()).map(f => f.name).sort(), ["Renamed (2).txt", "Renamed.txt"]);
  const before = (await listFiles()).length;
  await assert.rejects(importBackup(JSON.stringify({ format: "floppyy-files", version: 1, files: [{ name: "valid", kind: "text", content: "ok" }, { name: "bad", kind: "html", content: "no" }] })));
  assert.equal((await listFiles()).length, before);
  const current = (await getFile(note.id))!;
  await deleteFile(current);
  await assert.rejects(saveFile({ ...current, content: "Resurrect deleted" }), /changed or was deleted/);
  assert.equal(await getFile(note.id), undefined);
});

test("drafts for different documents are independent and long backup names stay valid", async () => {
  const draft = { kind: "text" as const, name: "Draft.txt", content: "Draft", savedContent: "" };
  await writeDraft({ ...draft, source: "" });
  await writeDraft({ ...draft, source: "readme", content: "Another draft" });
  await writeDraft("text", "readme");
  assert.equal((await getDraft("text"))?.content, "Draft");
  assert.equal(await getDraft("text", "readme"), undefined);
  const file = await saveFile({ name: "z".repeat(96), kind: "text", content: "\"\\\n unicode: \u00e9" });
  const raw = JSON.stringify({ format: "floppyy-files", version: 1, files: [file] });
  await importBackup(raw);
  const copies = (await listFiles()).filter(f => f.name.startsWith("zz"));
  assert.equal(copies.length, 2);
  for (const copy of copies) assert.equal(fileName(copy.name, copy.kind), copy.name);
  assert.equal(parseBackup(await exportBackup()).length, (await listFiles()).length);
});

test("concurrent saves reject one stale writer without replacing newer content", async () => {
  const file = await saveFile({ name: "Concurrent", kind: "text", content: "Initial" });
  const results = await Promise.allSettled([saveFile({ ...file, content: "A" }), saveFile({ ...file, content: "B" })]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(results.filter(result => result.status === "rejected").length, 1);
  assert.ok(["A", "B"].includes((await getFile(file.id))!.content));
});
