# greymoth-devkit — MASTER 要件定義

> 単一 MASTER（req-flow 順守・凍結しない／実装中の決定はここへ書き戻す）
> 2026-06-22 起票 / greymoth (m.hirakawa07)

---

## 0. なぜ作るか（前提＝portfolio 監査の結論）

同日の portfolio 監査（4回目の独立監査）が出した結論は明確だ。**問題は「何を作るか」じゃなく、作った 119 個が1つも外から見えていないこと。** 信用・実績・配布が 62 repo 全部で実質ゼロ。だから新規プロダクトは増やさない。

このリポジトリは新規プロダクトではない。**28 個の live app で何度も書き直してきた共通コードを1本の公開 OSS に抽出し、「散らかり」を「1本の強い物語」に変える** ための統合資産。監査 §5／§8 のレーン1（信用）に正面で対応する。

却下した代替案＝Antigravity 生成の「4-Nexus 統廃合（既存を archive・全 UI 破棄・private headless API へ結合）」。届ける相手のいない build-trap で、監査結論と逆向き・no-delete と衝突するため self-kill で棄却済み。**既存プロダクトは一切 archive／削除しない。** これは純粋な追加作業。

## 1. 一行の物語（README の核）

> greymoth の 28 個のツールの裏側にある共通エンジン。決定論ルールを入れると、共有できる「判定カード」が出てくる。LLM 不使用・データは端末から出ない。

deterministic rules in → shareable verdict card out。zero-LLM・zero-network。これが「ツールを作る人」の信用になる。

## 2. パッケージ構成（4本＋デモ）

合成の流れ：`rules-core`（採点）→ `scorecard`（判定バッジ）→ `sharecard`（拡散カード）。全部 `tokens` で統一。

| package | 役割 | 出所（正準化元） | 依存 |
|---|---|---|---|
| `@greymoth/tokens` | デザイントークン（色・字・余白・verdict-stamp）。CSS vars + TS export | 全 app に手書きされた greymoth aesthetic | なし |
| `@greymoth/rules-core` | 決定論ルールエンジン。Rule/Finding 型 + evaluator + 0–100 rollup | reviewos / audit-ledger 13本 / llm-shield | なし |
| `@greymoth/scorecard` | 0–100 score + verdict-stamp バッジ（SVG/HTML 文字列・framework 非依存） | geo/aeo/overfit/cancel-friction の score UI | tokens |
| `@greymoth/sharecard` | born-to-share 1200×630 カード生成（zero-dep SVG・server/edge/browser 可搬） | 105sharecard / ccwrapped / inkdex / dream-atlas | tokens, scorecard |

設計判断：carrier は **SVG 文字列**（Canvas でなく）。理由＝server/edge/browser どこでも動く・依存ゼロ・@vercel/og にも食わせられる・テストで文字列 assert できる（決定論検証が容易）。Canvas 版は phase2。

## 3. 技術スタック（ponytail＝最小依存）

- TypeScript only（CLAUDE.md）。ESM（`"type":"module"`）。
- monorepo＝npm workspaces（追加ツールなし）。
- build＝`tsc` で各 package → `dist/`（型定義込み）。
- test＝Node 24 native `node:test`（runtime 依存ゼロ。jest/vitest 不採用）。
- runtime 依存＝**ゼロ**（4 package とも純関数）。dev 依存＝typescript のみ。
- bundler／eslint 重装備なし。lint は tsc strict で代替。

## 4. デザイン要件（design-ref 入口・HARD）

- generic dark-devtool（dark+mint+mono）禁止＝AI-slop（memory 教訓）。
- 固有 identity＝riso/活版の紙面・paper-black 地・oxblood/vermillion 朱・IBM Plex Mono・**verdict-stamp**（ゴム印を捺したような判定バッジ）。
- story landing は配布面そのもの。既視感 SaaS 却下。design-ref で direction→reference→build。
- 全成果（scorecard/sharecard）の実描画を chrome --headless --screenshot で目視検証（reference_headless_chrome_render_verify）。

## 5. 配布 readiness（DoD の核＝監査の本体）

「作った」で終わらせない。npm publish の**手前**まで完成させ、公開の一手だけ残す：
- 各 package に正しい package.json（name/version/exports/files/license/repo）。
- root README＝1本の強い物語（Show HN / Zenn にそのまま出せる質）。
- LICENSE（MIT・gitrepo HARD）。
- 公開後の配布文（Show HN / Zenn 草稿）を `docs/LAUNCH.md` に用意。
- 実際の publish（npm login / 2FA）は人手なので俺の TODO として明記。

## 6. AUDIT（100% 絶対・workflow HARD）

- 全 package `tsc --noEmit` 型エラー 0。
- 全 package `node --test` green（各 package に test）。
- demo が 4 package を実合成して実カードを出力（fixture でない実データ）。
- landing + sharecard を headless Chrome で実描画スクショ→目視 OK。
- 検証後にのみ TODO を `[●]`。

## 7. TODO（[●]=検証後のみ）

- [●] T1 実態確認：4 explorer の実コード/値を統合（paper-black→実は warm paper/ink と判明・修正）
- [●] T2 scaffold：root package.json(workspaces)/tsconfig.base/.gitignore/LICENSE/git init
- [●] T3 design direction：実 token を locked direction とし frontend-design で build
- [●] T4 `@greymoth/tokens`：実 token を単一 source 化 + test（8 green・tokens.css 生成）
- [●] T5 `@greymoth/rules-core`：evaluate(線形)+noisyOr(リスク)+rollup（18 green）
- [●] T6 `@greymoth/scorecard`：verdict+stamp(svg/html)（14 green・escape順バグ自己検出→修正）
- [●] T7 `@greymoth/sharecard`：1200×630 SVG カード+serial（12 green）
- [●] T8 demo：実合成 pipeline（rules→score→verdict→card）実 SVG 3枚出力
- [●] T9 story landing：frontend-design + headless Chrome 実描画検証（card+landing 目視 OK）
- [●] T10 AUDIT 100%：`npm test` = build 全 + 52 tests green
- [●] T11 README（物語）+ 各 package README + docs/LAUNCH.md + REFERENCES.md
- [ ] T12 git commit + tag 復元点 / memory 刻む（このコミットで実施）
- [ ] T13【人手・配布】npm publish（@greymoth login）+ GitHub public + Pages（docs/LAUNCH.md）

## 8. 非目標（やらないこと）

- 既存 app の archive／削除／UI 破棄（no-delete・監査結論と逆）。
- 4-Nexus 統廃合・private headless API 群（build-trap）。
- 新規プロダクト機能の発明（抽出と正準化に限定）。
- 重装備ツールチェーン（turbo/changesets/jest 等）。phase2 で必要になってから。
