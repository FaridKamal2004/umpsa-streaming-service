import test from "node:test";
import assert from "node:assert/strict";
import { catalog, selectMovies, recommend } from "../src/catalog.js";

test("catalog has unique identifiers, credits, and HTTPS media", () => {
  assert.equal(new Set(catalog.map((m) => m.id)).size, catalog.length);
  for (const movie of catalog) {
    assert.ok(
      movie.minutes > 0 && movie.director && movie.credit && movie.license,
    );
    assert.equal(new URL(movie.video).protocol, "https:");
    assert.equal(new URL(movie.source).protocol, "https:");
  }
});
test("search is case insensitive and trims whitespace", () =>
  assert.deepEqual(
    selectMovies(catalog, { query: "  SINTEL  " }).map((m) => m.id),
    ["sintel"],
  ));
test("search includes directors and story text", () => {
  assert.equal(selectMovies(catalog, { query: "Colin Levy" })[0].id, "sintel");
  assert.equal(selectMovies(catalog, { query: "robots" })[0].id, "steel");
});
test("query, genre and saved-list scope combine", () => {
  assert.deepEqual(
    selectMovies(catalog, {
      query: "steel",
      genre: "Sci-fi",
      ids: ["steel"],
    }).map((m) => m.id),
    ["steel"],
  );
  assert.equal(
    selectMovies(catalog, { query: "steel", genre: "Fantasy" }).length,
    0,
  );
  assert.equal(selectMovies(catalog, { ids: [] }).length, 0);
});
test("all sort modes produce the expected order without mutating catalog", () => {
  const order = catalog.map((m) => m.id);
  assert.deepEqual(
    selectMovies(catalog, { sort: "newest" }).map((m) => m.year),
    [2012, 2010, 2008, 2006],
  );
  assert.deepEqual(
    selectMovies(catalog, { sort: "shortest" }).map((m) => m.minutes),
    [10, 11, 12, 15],
  );
  assert.equal(selectMovies(catalog, { sort: "title" })[0].id, "bunny");
  assert.deepEqual(
    catalog.map((m) => m.id),
    order,
  );
});
test("recommendations promote preferred genres and stay deterministic", () => {
  assert.deepEqual(
    recommend(catalog, [], {}).map((m) => m.id),
    catalog.map((m) => m.id),
  );
  assert.deepEqual(
    recommend(catalog, ["steel"], {})
      .slice(0, 2)
      .map((m) => m.genre),
    ["Sci-fi", "Sci-fi"],
  );
  assert.equal(
    recommend(catalog, [], { bunny: { seconds: 12 } })[0].id,
    "bunny",
  );
});
