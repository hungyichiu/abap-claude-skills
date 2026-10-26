# ABAP Claude Skills

給 SAP ABAP 開發者用的 Claude skills。目前收錄 `abap-review`、`abap-archaeology`，之後會陸續加入其他 skill。

Claude skills for SAP ABAP developers. Currently includes `abap-review` and `abap-archaeology`; more skills will be added over time.

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

在 claude.ai 使用的話，把資料夾壓成 zip，在 Skills 管理頁按新增上傳。

For claude.ai, zip the folder and upload it from the Skills management page.

### 使用方式 Usage

貼上 ABAP 程式碼，說「幫我 review」或 "review this ABAP"。先告訴它系統是 ECC 還是 S/4HANA，結果會更準。

Paste your ABAP code and ask for a review. Mentioning whether you are on ECC or S/4HANA makes the result more accurate.

### 公司規範 Company conventions

如果你有公司的命名規則或 coding standard，可以自己建一個 `references/company-context.md`，寫明規範放在哪裡。有這個檔案時，skill 會先讀它，並優先套用公司規範。這個檔案已列在 `.gitignore`，不會被 commit。

If your company has naming rules or a coding standard, create your own `references/company-context.md` pointing to them. The skill reads it first when present and applies your conventions ahead of generic advice. The file is listed in `.gitignore` so it won't be committed.

### 相關 skill Related skills

`SKILL.md` 裡提到的 `abap-verify`、`abap-pair`、`abap-mentor` 等是同一套工作流程的其他 skill，還沒公開。沒有它們，`abap-review` 一樣能用。

Other skills mentioned in `SKILL.md` (`abap-verify`, `abap-pair`, `abap-mentor`, …) belong to the same workflow and are not yet published. `abap-review` works on its own without them.

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

[`examples/abap-archaeology/`](examples/abap-archaeology/) contains a sample legacy report, `ZSDR0017.abap`, and the [program ID card](examples/abap-archaeology/ZSDR0017_程式身分證.md) this skill produced for it. It was written to show problems commonly found in legacy ABAP and does not come from any company's code.

公司專屬資訊的做法同 `abap-review`：自己建 `references/company-context.md`，它已列在 `.gitignore`。

Company-specific context works the same way as in `abap-review`: create your own `references/company-context.md`, which is listed in `.gitignore`.

---

---

## License

MIT
