# ABAP Claude Skills

接手沒有文件的 ABAP 程式、上線前要 review、要補規格書和測試案例、正式區出事要查原因時，讓 Claude 照 SAP 開發實務一步步做事的 5 支 Claude skills。

Five Claude skills that make Claude follow real SAP development practice when you inherit an undocumented ABAP program, review code before go-live, write a spec or test cases, or investigate a production issue.

| Skill | 什麼時候用 When to use | 產出 Output | 範例 Example |
|---|---|---|---|
| [abap-review](#abap-review) | 寫完或改完程式、上線前 / Before go-live | 三級問題清單 / Findings in three levels | — |
| [abap-archaeology](#abap-archaeology) | 接手沒文件的舊程式 / Inheriting undocumented code | 程式身分證 / Program ID card | [中文](examples/abap-archaeology/ZSDR0017_程式身分證.md)、[English](examples/abap-archaeology/ZSDR0017_program_id_card_en.md) |
| [abap-spec-writer](#abap-spec-writer) | 要給 PM、業務看的規格書 / Spec for PMs and business users | 規格書 md／docx / Spec in md or docx | [中文](examples/abap-spec-writer/ZSDR0017_規格書.md)、[English](examples/abap-spec-writer/ZSDR0017_spec_en.md) |
| [abap-verify](#abap-verify) | 開發完還沒驗證 / Built but never tested | 測試案例表 / Test case table | [中文](examples/abap-verify/ZSDR0017_QAS測試案例表.md) |
| [sap-anomaly-investigation](#sap-anomaly-investigation) | 資料不對、dump、逾時 / Wrong data, dumps, timeouts | 排查紀錄 / Investigation record | [中文](examples/sap-anomaly-investigation/ZSDR0017_排查紀錄.md) |

接手一支程式的建議順序：`abap-archaeology` 看懂 → `abap-spec-writer` 寫成規格書 → `abap-verify` 設計測試 → `abap-review` 列修正清單。上線後出事再用 `sap-anomaly-investigation`。所有範例都用同一支虛構的示範程式 `ZSDR0017`。

Suggested order when you inherit a program: `abap-archaeology` to understand it, `abap-spec-writer` to document it, `abap-verify` to test it, `abap-review` for a fix list. Use `sap-anomaly-investigation` when something goes wrong after go-live. All examples use the same fictional sample program, `ZSDR0017`.

### 安裝 Installation

Claude Code：把要用的資料夾複製到 skills 目錄。

Claude Code: copy the folders you want into your skills directory.

```bash
git clone https://github.com/hungyichiu/abap-claude-skills.git
cp -r abap-claude-skills/skills/abap-review ~/.claude/skills/
```

claude.ai：把單一 skill 資料夾（例如 `skills/abap-review`）壓成 zip，在 **Customize › Skills** 按 **+** › **Create skill** › **Upload a skill** 上傳，再把它打開。

claude.ai: zip a single skill folder (for example `skills/abap-review`), then in **Customize › Skills** click **+** › **Create skill** › **Upload a skill**, upload it, and toggle it on.

---

## abap-review

對 ABAP 程式碼做結構化 code review，把問題分成三級，讓人知道先修哪個。

A structured code review for ABAP that sorts findings into three levels, so you know what to fix first.

| 等級 Level | 意思 Meaning |
|---|---|
| 🔴 Blocker | 上線前必修 / Must fix before go-live |
| 🟡 建議 Suggestion | 遲早會痛 / Will hurt later |
| ⚪ 風格 Style | 可改可不改 / Optional |

### 它會檢查什麼 What it checks

1. 意圖不符：程式實際做的事，和名稱、標頭、CR 描述的不一樣。
2. SAP 常見地雷：`FOR ALL ENTRIES` 空內表撈全表、LOOP 裡 SELECT、`BINARY SEARCH` 前沒 SORT、BAPI 沒檢查 `RETURN` 就 `COMMIT WORK`、缺 `AUTHORITY-CHECK`、寫死的值。
3. 模組特有陷阱（MM / SD / FI）：語法正確、但數字會錯的地方。
4. ECC 與 S/4HANA、各 NetWeaver 版本的語法差異。
5. 上線風險：這次修改是不是收不回的「單向門」，用來決定要審多深。
6. ATC / Code Inspector 大概會抓到什麼。

<!-- -->

1. Intent mismatch: the code does something other than what its name, header or change request says.
2. Common SAP pitfalls: empty driver tables in `FOR ALL ENTRIES`, SELECT inside LOOP, `BINARY SEARCH` without SORT, `COMMIT WORK` without checking BAPI `RETURN`, missing `AUTHORITY-CHECK`, hard-coded values.
3. Module-specific traps (MM / SD / FI): syntactically correct code that produces wrong numbers.
4. Syntax differences between ECC and S/4HANA and across NetWeaver releases.
5. Go-live risk: whether the change is an irreversible "one-way door", which sets how deep the review should go.
6. What ATC / Code Inspector is likely to flag.

它只提出建議，不會直接改你的程式。

It only suggests fixes; it never edits your code.

### 安裝 Installation

把 `skills/abap-review` 資料夾複製到 Claude Code 的 skills 目錄：

Copy the `skills/abap-review` folder into your Claude Code skills directory:

```bash
git clone https://github.com/hungyichiu/abap-claude-skills.git
cp -r abap-claude-skills/skills/abap-review ~/.claude/skills/
```

### 使用方式 Usage

貼上 ABAP 程式碼，說「幫我 review」或 "review this ABAP"。先告訴它系統是 ECC 還是 S/4HANA，結果會更準。

Paste your ABAP code and ask for a review. Mentioning whether you are on ECC or S/4HANA makes the result more accurate.

### 公司規範 Company conventions

如果你有公司的命名規則或 coding standard，可以自己建一個 `references/company-context.md`，寫明規範放在哪裡。有這個檔案時，skill 會先讀它，並優先套用公司規範。這個檔案已列在 `.gitignore`，不會被 commit。

If your company has naming rules or a coding standard, create your own `references/company-context.md` pointing to them. The skill reads it first when present and applies your conventions ahead of generic advice. The file is listed in `.gitignore` so it won't be committed.

### 相關 skill Related skills

`SKILL.md` 裡提到的 `abap-pair`、`abap-mentor` 等是同一套工作流程的其他 skill，還沒公開。沒有它們，`abap-review` 一樣能用。

Other skills mentioned in `SKILL.md` (`abap-pair`, `abap-mentor`, …) belong to the same workflow and are not yet published. `abap-review` works on its own without them.

## abap-archaeology

接手一支沒有文件、原作者已離職的 ABAP 程式時，產出一份「程式身分證」：用途、輸入輸出、讀寫的表、呼叫的 BAPI / FM、處理流程、風險點，以及一份「還需要確認的清單」。

For taking over an undocumented ABAP program whose author has left. It produces a structured "program ID card": purpose, inputs and outputs, tables read and written, BAPIs / function modules called, processing flow, risks, and a checklist of what still needs confirming.

### 它的做法 How it works

1. 確定性分級：每句話標明 ✅ 事實（程式碼讀得出來）、🔶 推測（附推論依據）、❓ 未知（要查系統或問人）。
2. 第零關：先比對程式「宣稱做什麼」和「實際做什麼」，意圖不符通常是最重要的發現。
3. 身分證分三層：先看這裡（給要報告的人）、程式行為（給要動程式的人）、查找與待辦。
4. 特別留意「安靜地錯」的寫法：`BINARY SEARCH` 前沒 SORT、`sy-subrc` 沒檢查、1:N 表只讀到第一筆、`SHKZG` 沒處理。

<!-- -->

1. Certainty grading: every statement is marked ✅ fact (readable from the code), 🔶 inference (with its basis) or ❓ unknown (needs a system lookup or a person).
2. Step zero: compare what the program claims to do with what it actually does. An intent mismatch is often the most important finding.
3. The ID card has three layers: read this first (for reporting), program behavior (for whoever changes it), and lookup and to-do.
4. Extra attention to silent failures: `BINARY SEARCH` without SORT, unchecked `sy-subrc`, reading only the first row of a 1:N table, ignoring `SHKZG`.

它只負責「看懂」，不改你的程式，也不貼修正後的 ABAP。

It is for understanding only; it does not change your code or paste corrected ABAP.

### 安裝與使用 Installation and usage

```bash
git clone https://github.com/hungyichiu/abap-claude-skills.git
cp -r abap-claude-skills/skills/abap-archaeology ~/.claude/skills/
```

貼上程式碼（或給 SE38 / ADT 匯出的檔案），說「幫我分析這支程式」或 "what does this ABAP program do"。先告訴它系統是 ECC 還是 S/4HANA，判讀會更準。

Paste the code (or an export from SE38 / ADT) and ask what the program does. Mentioning whether you are on ECC or S/4HANA makes the reading more accurate.

### 範例 Example

[`examples/abap-archaeology/`](examples/abap-archaeology/) 有一支示範用的舊程式 `ZSDR0017.abap`，和用這個 skill 產出的[程式身分證](examples/abap-archaeology/ZSDR0017_程式身分證.md)。這支程式是依 legacy ABAP 常見的問題寫成的示範，不是任何公司的程式碼。

[`examples/abap-archaeology/`](examples/abap-archaeology/) contains a sample legacy report, `ZSDR0017.abap`, and the [program ID card](examples/abap-archaeology/ZSDR0017_程式身分證.md) this skill produced for it. It was written to show problems commonly found in legacy ABAP and does not come from any company's code. An [English translation](examples/abap-archaeology/ZSDR0017_program_id_card_en.md) of the ID card is included.

產出節錄 Output excerpt：

```markdown
### One-line summary
🔶 Lists order items for ZOR/ZOR2 orders in sales organization TW01. When p_x is checked,
it sets delivery block Z1 on every order whose total net value exceeds 500,000.

**Claimed vs actual**
- The header says "open orders, showing only items not yet delivered", but there is no
  status filter at all: delivered and completed orders are listed too.

**Highest risks**
- This "report" changes production data: checking p_x calls a BAPI that changes the order header.
- The BAPI's RETURN is never checked before COMMIT, so failed orders are still marked as blocked.
```

公司專屬資訊的做法同 `abap-review`：自己建 `references/company-context.md`，它已列在 `.gitignore`。

Company-specific context works the same way as in `abap-review`: create your own `references/company-context.md`, which is listed in `.gitignore`.

---

## abap-spec-writer

把已開發或接手的 ABAP 程式整理成一份給 PM、業務看的規格書。預設產出 md，要求時才另外產出 docx。

Turns an ABAP program you built or inherited into a specification that PMs and business users can read. Markdown by default; a .docx only when asked.

### 它的做法 How it works

1. 規格書只寫「這支程式做什麼、為什麼這樣設計」。除錯過程、語法修正、逐日修改歷程不寫進來，那是風險清單和程式身分證的工作。
2. 從程式碼讀不出來的（需求背景、需求方、某條規則是業務要求還是開發者自己決定的），動筆前一次問完。沒人知道的寫「待確認」，不自己編。
3. 每條核心規則配輸入／輸出範例和邊界條件（剛好等於門檻、空值、重複執行），讀的人能照著驗證。
4. 給不懂 ABAP 的人讀：技術詞第一次出現就接一句白話，「提升效率」這類空話後面一定要接具體內容。
5. 交付前照 9 條清單自檢，包括「行為描述和目前的程式碼一致」「沒有把推測寫成事實」。

<!-- -->

1. The spec covers what the program does and why it was designed that way. Debugging history, syntax fixes and day-by-day change logs stay out; they belong in a risk list or program ID card.
2. Anything the code can't tell you (business background, requester, whether a rule came from the business or the developer) is asked once, up front. Nobody knows? It's marked "to be confirmed", never made up.
3. Every core rule comes with input/output examples and edge cases (exactly at the threshold, empty values, re-runs), so readers can verify it.
4. Written for people who don't read ABAP: technical terms are explained in plain words on first use, and vague claims like "improves efficiency" must be backed by specifics.
5. A 9-point self-check before delivery, including "behavior matches the current code" and "no inference written as fact".

它只整理文件，不改你的程式。

It writes documentation only; it does not change your code.

### 安裝與使用 Installation and usage

```bash
git clone https://github.com/hungyichiu/abap-claude-skills.git
cp -r abap-claude-skills/skills/abap-spec-writer ~/.claude/skills/
```

貼上程式碼，或給它程式碼和程式身分證，說「幫我寫規格書」或 "write a spec for this ABAP program"。要 Word 檔就說「另外產一份 docx」，需要先 `npm install docx`。

Paste the code, or the code plus a program ID card, and ask for a spec. For a Word file, ask for a .docx as well; this needs `npm install docx`.

### 範例 Example

[`examples/abap-spec-writer/`](examples/abap-spec-writer/) 是用同一支示範程式 `ZSDR0017` 寫出的[規格書](examples/abap-spec-writer/ZSDR0017_規格書.md)（另附 [PDF 版](examples/abap-spec-writer/ZSDR0017_規格書.pdf)，看匯出後的分頁效果；英文翻譯見 [md](examples/abap-spec-writer/ZSDR0017_spec_en.md)、[PDF](examples/abap-spec-writer/ZSDR0017_spec_en.pdf)），材料是 [`examples/abap-archaeology/`](examples/abap-archaeology/) 的程式碼和程式身分證。接手時先用 `abap-archaeology` 看懂，再用這個 skill 把現況寫成規格書給需求方確認。

[`examples/abap-spec-writer/`](examples/abap-spec-writer/) contains a [spec](examples/abap-spec-writer/ZSDR0017_規格書.md) in Traditional Chinese (plus a [PDF](examples/abap-spec-writer/ZSDR0017_規格書.pdf) showing the exported page layout; English translation: [md](examples/abap-spec-writer/ZSDR0017_spec_en.md), [PDF](examples/abap-spec-writer/ZSDR0017_spec_en.pdf)) for the same sample program, `ZSDR0017`, written from the code and program ID card in [`examples/abap-archaeology/`](examples/abap-archaeology/). When you inherit a program, use `abap-archaeology` to understand it, then this skill to write up its current behavior for the requester to confirm.

產出節錄 Output excerpt：

```markdown
## 2. Background and Purpose

**The two things the program does today:**
1. It lists every item of standard orders in the Taiwan sales organization.
2. When the user ticks "Apply block", any order worth more than 500,000 in total
   automatically gets a delivery block, so it cannot ship until someone releases it manually.

**The problem the program was originally meant to solve (to be confirmed):**
- The header says "Open Orders Report", but the current code has no filter on shipping status.
```

---

## abap-verify

為一支 ABAP 程式設計完整的測試案例表，特別是「開發完但沒驗證過」、接手來的程式。產出的表可以照著做、可以交給主管、測完就是測試紀錄。

Designs a full set of test cases for an ABAP program, especially one that was built but never verified, or one you inherited. The result is something you can follow step by step, hand to your manager, and keep as the test record once it's done.

### 它的做法 How it works

1. 八個面向逐一檢查：正常流程、邊界值、異常、空資料、大量資料、權限、重複執行、跨期間跨組織。不適用的要寫「不適用，因為……」，不默默跳過。
2. 先做，不先問：驗證範圍、環境、通過標準用最保守的假設直接產出，三個問題放進文件的「請主管確認」區。
3. 讀程式碼找到的高風險疑點放最前面，每一條對應到哪個案例會把它測出來。
4. 寫入類案例一律記前值、執行、記後值、逐欄比對、`SM13` 查 update，沒該變的欄位被改到也算 bug。
5. 不假裝知道業務規則：預期結果取決於沒人說清楚的規則時，寫「需確認：……」，不編一個看起來合理的答案。
6. 案例分高中低優先級；案例多時拆成設計表、追蹤表和逐案例的執行 Checklist。

<!-- -->

1. Eight angles, checked one by one: happy path, edge cases, errors, empty data, volume, authorization, re-runs, and cross-period / cross-org. Angles that don't apply say "not applicable, because…" instead of being skipped silently.
2. Do first, ask later: scope, environment and pass criteria start from the most conservative assumptions, and the three open questions go into a "for your manager to confirm" section.
3. High-risk findings from reading the code come first, each mapped to the test case that will expose it.
4. Every write test follows the same order: record before values, run, record after values, compare field by field, check `SM13`. A field that changed but shouldn't have is a bug too.
5. No pretending to know business rules: when the expected result depends on a rule nobody has spelled out, it says "to be confirmed: …" instead of inventing a plausible answer.
6. Cases are ranked high / medium / low. With many cases, they are split into a design table, a tracking table and a step-by-step checklist per case.

它只設計測試，不改你的程式，也不替你執行。

It designs tests only; it does not change your code or run anything for you.

`SKILL.md` 裡提到的 `sap-transport-env-inventory`、`abap-ask-coach`、`obsidian-note-format` 還沒公開，沒有它們一樣能用。

`sap-transport-env-inventory`, `abap-ask-coach` and `obsidian-note-format`, mentioned in `SKILL.md`, are not yet published; `abap-verify` works without them.

### 安裝與使用 Installation and usage

```bash
git clone https://github.com/hungyichiu/abap-claude-skills.git
cp -r abap-claude-skills/skills/abap-verify ~/.claude/skills/
```

貼上程式碼，最好連同程式身分證，說「幫我設計測試案例」或 "how should I test this ABAP program"。先告訴它系統是 ECC 還是 S/4HANA。

Paste the code, ideally with its program ID card, and ask for test cases. Mention whether you are on ECC or S/4HANA.

### 範例 Example

[`examples/abap-verify/`](examples/abap-verify/) 是同一支示範程式 `ZSDR0017` 的[測試案例表](examples/abap-verify/ZSDR0017_QAS測試案例表.md)：23 個案例、5 個高風險疑點，依執行順序拆成三本執行記錄。材料是 [`examples/abap-archaeology/`](examples/abap-archaeology/) 的程式碼和程式身分證，以及 [`examples/abap-spec-writer/`](examples/abap-spec-writer/) 的規格書。skill 在 Obsidian 裡產出的連結是 `[[wikilink]]`，範例為了在 GitHub 上點得開，改成一般的 md 連結。

[`examples/abap-verify/`](examples/abap-verify/) contains the [test case table](examples/abap-verify/ZSDR0017_QAS測試案例表.md) (in Traditional Chinese) for the same sample program, `ZSDR0017`: 23 cases and 5 high-risk findings, split into three execution logs by run order. It was built from the code and program ID card in [`examples/abap-archaeology/`](examples/abap-archaeology/) and the spec in [`examples/abap-spec-writer/`](examples/abap-spec-writer/). The skill writes Obsidian `[[wikilinks]]`; the example uses standard Markdown links so they work on GitHub.

產出節錄 Output excerpt（高風險疑點表 / high-risk findings table）：

```markdown
| # | 疑點（行號） | 為什麼可疑 | 會怎麼錯 | 對應案例 |
|---|---|---|---|---|
| 1 | BAPI 沒看 RETURN 就 COMMIT（76–86） | 失敗也照樣標 flag | 報表說已凍結，訂單其實沒凍結 | T17 |
| 2 | 沒有 AUTHORITY-CHECK | 能跑程式就能改訂單 | 不該凍結的人凍結了訂單 | T21 |
| 5 | 50 萬門檻沒管幣別（73） | NETWR 是訂單幣別 | 外幣大單不凍結，日圓小單被凍結 | T16 |
```

公司專屬資訊的做法同 `abap-review`：自己建 `references/company-context.md`，寫明公司的測試環境和 client 用途，「驗證環境」就會照它填。這個檔案已列在 `.gitignore`。

Company-specific context works the same way as in `abap-review`: create your own `references/company-context.md` describing your test systems and clients, and the skill fills in the test environment from it. The file is listed in `.gitignore`.

---

## sap-anomaly-investigation

程式上線後出事時的排查與修復流程：使用者回報資料不一致、程式疑似改錯資料、程式 dump 或逾時跑不出資料，要查出原因、修正程式或正式區資料的案子。

An investigation and repair process for when something goes wrong after go-live: users report inconsistent data, a program seems to have written wrong data, or a program dumps or times out. It covers finding the cause and fixing the program or the production data.

### 它的做法 How it works

1. 4 個階段 12 步：釐清事實、找出原因、對策、修復收尾。dump（`ST22`）另有分支，骨架相同、證據來源不同。
2. 推論和證據分開寫：程式碼判讀、憑記憶的表和欄位名稱標 🔶；只有 SQL、log、版本紀錄、dump、實測結果才算證據。
3. 證據來自系統紀錄，不來自人的記憶：先查變更紀錄、job log、版本紀錄；查無紀錄也不等於沒發生，要先確認那張表有沒有寫變更紀錄。
4. 找對照組：同一張單據、同一次執行的正常件並排比對所有欄位，縮小到「產生那個欄位的步驟」。
5. 假設被推翻兩次就回到第一階段補事實，不提第三個假設。
6. 修復有順序：修前先匯出清單、修正方式在測試區驗證、程式先上線，最後才修正式區資料，否則修好的資料會被舊程式改回去。

<!-- -->

1. 4 phases, 12 steps: establish the facts, find the cause, decide the fix, repair and close. Dumps (`ST22`) have their own branch with the same skeleton and different evidence.
2. Inference and evidence are written separately: readings of the code and table or field names from memory are marked 🔶. Only SQL results, logs, version history, dumps and test results count as evidence.
3. Evidence comes from system records, not people's memory: check change documents, job logs and version history first. "No record found" doesn't mean nothing happened; first check whether that table writes change documents at all.
4. Find a reference case: put a normal record from the same document or the same run next to the broken one and compare every field, narrowing it down to the step that produced the odd field.
5. If two hypotheses have been ruled out, go back to phase one and fill in the facts instead of proposing a third.
6. Repair in order: export the list before changing anything, verify the fix in the test system, deploy the program first, and only then fix production data. Otherwise the old program will undo your fix.

它只在正式區查詢，不寫入；沒有變更需求（CR）不改程式。

It only queries production and never writes to it; it doesn't change programs without a change request.

`SKILL.md` 裡提到的 `abap-debug-coach`、`hana-sql-dbacockpit`、`sap-transport-env-inventory`、`work-chat-reply`、`conversation-closeout` 還沒公開，沒有它們一樣能用。

`abap-debug-coach`, `hana-sql-dbacockpit`, `sap-transport-env-inventory`, `work-chat-reply` and `conversation-closeout`, mentioned in `SKILL.md`, are not yet published; `sap-anomaly-investigation` works without them.

### 安裝與使用 Installation and usage

```bash
git clone https://github.com/hungyichiu/abap-claude-skills.git
cp -r abap-claude-skills/skills/sap-anomaly-investigation ~/.claude/skills/
```

描述你看到的異常（哪些單據、什麼欄位不對、從什麼時候開始），說「幫我排查」或 "help me investigate this data issue"。dump 的話貼上 `ST22` 的內容。

Describe what you're seeing (which documents, which fields are wrong, since when) and ask for an investigation. For a dump, paste the `ST22` content.

### 範例 Example

[`examples/sap-anomaly-investigation/`](examples/sap-anomaly-investigation/) 是同一支示範程式 `ZSDR0017` 上線後出事的[排查紀錄](examples/sap-anomaly-investigation/ZSDR0017_排查紀錄.md)：一張美金大單沒被交貨凍結就出貨了。兩個假設被證據推翻後，用對照組找到真正的原因（門檻沒管幣別），再圈出影響範圍、提出修正和驗證案例、排好修復順序，附用過的 SQL。案件、單號、數字都是虛構的。

[`examples/sap-anomaly-investigation/`](examples/sap-anomaly-investigation/) contains an [investigation record](examples/sap-anomaly-investigation/ZSDR0017_排查紀錄.md) (in Traditional Chinese) for the same sample program, `ZSDR0017`, after go-live: a large USD order shipped without being blocked. After two hypotheses are ruled out by evidence, a side-by-side comparison with a blocked order finds the real cause (the threshold ignores currency). The record then scopes the impact, proposes a fix with test cases, and sets the repair order, with all the SQL used. The case, document numbers and figures are fictional.

產出節錄 Output excerpt：

```markdown
### 一句話
`ZSDR0017` 用訂單幣別的金額直接跟 500,000 比，美金、歐元訂單永遠到不了門檻，
所以從 2016 年加上自動凍結起，非台幣的大單一張都沒被凍結過。

| 項目 | 內容 |
|---|---|
| 原因 | ✅ 已確定：門檻沒管幣別 |
| 影響範圍 | ✅ 37 張，已出貨 35 張、未出貨 2 張 |
| 正式區資料 | 還沒動，清單已匯出留底 |
```

(One line: `ZSDR0017` compares the order-currency amount directly with 500,000, so USD and EUR orders never reach the threshold; no non-TWD large order has been blocked since 2016.)

### 公司實例 Company cases

skill 會在需要時讀 `references/company-cases.md`（若存在）：公司的 client、自建程式的已知行為、過去案件的實例。自己建這個檔案就能套用；它已列在 `.gitignore`。

The skill reads `references/company-cases.md` when present: your clients, known behavior of in-house programs, and past cases. Create your own to use it; the file is listed in `.gitignore`.

---

## 常見問題 FAQ

**Claude skill 是什麼？要付費方案嗎？ / What is a Claude skill? Do I need a paid plan?**

Skill 是一個資料夾，裡面的 `SKILL.md` 告訴 Claude 遇到某類工作時照什麼流程做。Claude Code 和 claude.ai 都能用；各方案能不能上傳 skill，以 Anthropic 官方說明為準。

A skill is a folder whose `SKILL.md` tells Claude which process to follow for a type of task. It works in Claude Code and claude.ai; check Anthropic's documentation for which plans support uploading skills.

**ECC 和 S/4HANA 都能用嗎？ / Does it work for ECC and S/4HANA?**

都能用。先告訴 Claude 你的系統是 ECC 還是 S/4HANA，語法和地雷判斷會更準。

Yes. Tell Claude whether you are on ECC or S/4HANA first; syntax checks and pitfall detection get more accurate.

**它會改我的程式或寫入正式區嗎？ / Will it change my code or write to production?**

不會。`abap-review` 只提建議，`abap-archaeology` 只負責看懂，`abap-spec-writer` 只寫文件，`abap-verify` 只設計測試，`sap-anomaly-investigation` 在正式區只查詢、不寫入，沒有 CR 不改程式。

No. `abap-review` only suggests, `abap-archaeology` only explains, `abap-spec-writer` only documents, `abap-verify` only designs tests, and `sap-anomaly-investigation` only queries production and never changes programs without a change request.

**程式碼會傳到哪裡？ / Where does my code go?**

skill 本身不連外、不上傳任何東西。你貼給 Claude 的程式碼照你使用的 Claude 方案和公司政策處理，貼公司程式前請先確認公司規定。

The skills themselves make no network calls and upload nothing. Code you paste into Claude is handled under your Claude plan and your company's policy; check your company's rules before pasting company code.

**公司的命名規則、client 怎麼套進去？ / How do I add company conventions?**

在 skill 資料夾裡自己建 `references/company-context.md`（`sap-anomaly-investigation` 另有 `references/company-cases.md`），skill 會先讀它。這兩個檔案已列在 `.gitignore`，不會被 commit。

Create your own `references/company-context.md` in the skill folder (`sap-anomaly-investigation` also reads `references/company-cases.md`). Both are listed in `.gitignore` and won't be committed.

---

## 作者 Author

[@hungyichiu](https://github.com/hungyichiu)，SAP ABAP 開發者。最後更新：2026-11。

[@hungyichiu](https://github.com/hungyichiu), SAP ABAP developer. Last updated: 2026-11.

## License

MIT
