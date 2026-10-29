// Health OKZ の構文チェック。
// index.html の中の <script>（src なしのもの）を取り出し、JavaScript として読めるかを確認する。
// 読めない（構文エラー）ときは終了コード 1 で止まる → GitHub Actions が公開を止める。
// 古い iPhone Safari でも確実に動くよう、ES5（var・テンプレート文字列なし・アロー関数なし）で書く決まり。
// その決まりもここで機械的にチェックする（let / const / => / ` を使うとエラーになる）。
import { readFileSync } from "node:fs";
import * as acorn from "acorn";

const files = process.argv.slice(2);
if (files.length === 0) files.push("index.html");

let ng = 0;
for (const file of files) {
  const before = ng;
  const html = readFileSync(file, "utf8");
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let m, n = 0;
  while ((m = re.exec(html))) {
    const attrs = m[1] || "";
    if (/\bsrc\s*=/.test(attrs)) continue;
    if (/type\s*=\s*["']?(application\/(ld\+)?json|text\/template)/i.test(attrs)) continue;
    n++;
    const startLine = html.slice(0, m.index).split("\n").length;
    try {
      acorn.parse(m[2], { ecmaVersion: 5, sourceType: "script" });
    } catch (e) {
      ng++;
      const line = startLine + (e.loc ? e.loc.line - 1 : 0);
      console.error(`❌ ${file} ${line}行目付近: ${e.message}`);
    }
  }
  if (ng === before) console.log(`✅ ${file}: <script> ${n}個 すべて構文OK（ES5）`);
}
process.exit(ng ? 1 : 0);
