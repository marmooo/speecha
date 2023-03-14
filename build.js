import { readLines } from "https://deno.land/std/io/mod.ts";

async function build(threshold) {
  const dict = new Map();
  const alphabets = "abcdefghijklmnopqrstuvwxyz".split("");
  for (const alphabet of alphabets) {
    const fileName = `google-ngram-small-en/dist/1gram/${alphabet}.csv`;
    const fileReader = await Deno.open(fileName);
    for await (const line of readLines(fileReader)) {
      if (!line) continue;
      const arr = line.split(",");
      const lemma = arr[0];
      if (!/^[a-z]+$/.test(lemma)) continue;
      const count = parseInt(arr[1]);
      dict.set(lemma, count);
    }
  }
  const arr = Array.from(dict);
  arr.sort((a, b) => b[1] - a[1]);
  const result = arr.slice(0, threshold).map(x => x[0]).join("\n");
  Deno.writeTextFileSync(`src/words.lst`, result);
}

const threshold = 100000;
await build(threshold);
