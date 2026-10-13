# ABAP 地雷清單

按「會怎麼出事」分類，不是按語法分類。review 時逐區掃過。
每項標註預設等級（🔴 Blocker / 🟡 建議 / ⚪ 風格），實際等級要看情境調整——
例如 `SELECT *` 在一張只有 200 筆的自建設定表上不算問題。

## 目錄
0. [意圖不符（最容易漏、也最致命）](#0-意圖不符)
1. [效能爆炸](#1-效能爆炸)
2. [資料錯誤（安靜地錯）](#2-資料錯誤安靜地錯)
3. [交易一致性](#3-交易一致性)
4. [權限與安全](#4-權限與安全)
5. [環境相依 / 硬寫死](#5-環境相依--硬寫死)
6. [Dump 來源](#6-dump-來源)
7. [模組特有陷阱（MM / SD / FI）](#7-模組特有陷阱)
8. [可維護性](#8-可維護性)
9. [ABAP 版本與 ECC / S4 差異](#9-abap-版本與-ecc--s4-差異)

---

## 0. 意圖不符

**先做這一關，再開始掃 pattern。** 實務上最危險的缺陷不是寫法錯，是**程式沒有在做它宣稱要做的事**——而任何語法檢查清單都抓不到這種問題。

**🔴 程式的實際行為與名稱／標頭／CR 描述不符**
把三件事並排比對：程式名稱與標頭註解說它要做什麼、CR 單號描述的需求、程式碼實際做了什麼。
常見情境：程式名稱寫的是「批次結案」，主流程卻只更新了單據上的某個日期欄位——該結的單一張都沒結，反而默默改掉了一批正式資料。

**🔴 標頭的修改記錄提到的功能，程式碼裡是註解狀態**
例如標頭的修改記錄寫「加入某類料號排除」，但對應的 `IF ... CONTINUE.` 整段被註解掉。代表某個需求**從未生效**，而且沒人知道。這是 Blocker，不是可維護性問題。

**🔴 呼叫 BAPI 但沒帶到真正需要的參數**
BAPI 的 `X` 結構（如 `poheaderx` / `poitemx`）沒設對，等於什麼都沒改。BAPI 也不會報錯——它會回一個成功訊息。
檢查方法：用 `SE37` 打開該 BAPI 看介面文件，確認要達成目的必須送哪些欄位。

**🟡 篩選條件與宣稱的範圍不符**
例如宣稱處理「採購單」但 `SELECT FROM ekko` 沒過濾 `bstyp = 'F'`，結果合約（K）與排程協議（L）也被抓進來一起處理。

---

## 1. 效能爆炸

**🔴 `FOR ALL ENTRIES` 驅動內表可能為空**
內表空的時候整個 WHERE 條件失效，變成撈全表。這是 ABAP 最經典的災難。
```abap
" 危險
SELECT * FROM ekpo INTO TABLE lt_ekpo
  FOR ALL ENTRIES IN lt_ekko WHERE ebeln = lt_ekko-ebeln.

" 正確
IF lt_ekko IS NOT INITIAL.
  SELECT ebeln ebelp matnr menge FROM ekpo INTO TABLE lt_ekpo
    FOR ALL ENTRIES IN lt_ekko WHERE ebeln = lt_ekko-ebeln.
ENDIF.
```

**🔴 LOOP 裡面 SELECT**
每一圈打一次資料庫。100 筆還好，10 萬筆就是 10 萬次 round trip。
改法：迴圈外一次撈進內表，迴圈內用 `READ TABLE`。

> ⚠️ **改的時候會撞到一個限制**：`FOR ALL ENTRIES` **不能跟聚合函數（`SUM`/`COUNT`/`MAX`）或 `GROUP BY` 併用**，這是 Open SQL 的硬性規定。所以看到 `LOOP` 裡有 `SELECT SUM( ... )` 時，不能直接照上面的方式改。做法是：先用 `FOR ALL ENTRIES` 把明細一次撈進內表，再在 ABAP 層用 `LOOP ... COLLECT` 或 `LOOP AT ... GROUP BY`（7.40+）彙總。

**🔴 巢狀 LOOP 沒有用 key 收斂（O(n²)）**
兩個各 1 萬筆的內表巢狀 LOOP = 1 億次比對。
改法：內層改用 `LOOP AT ... WHERE`（配 sorted table）或 `READ TABLE ... BINARY SEARCH`，或直接把內表宣告成 sorted / hashed。

**🟡 `SELECT *` 而不指定欄位**
多搬不需要的欄位，也讓資料庫沒辦法用 index-only 掃描。

**🟡 `SELECT` 沒有 WHERE 條件，或 WHERE 沒吃到 index**
檢查 WHERE 是否從表的主鍵左邊開始連續。用 `ST05` 開 SQL trace 看實際執行計畫。

**🟡 `SELECT ... ENDSELECT` 逐筆處理**
除非資料量真的很大且要串流處理，否則改成 `INTO TABLE` 一次撈。

**🟡 在資料庫層可以做的事拿到 ABAP 層做**
彙總、排序、join 盡量交給資料庫。S/4 上更要遵守 code push-down 原則（CDS View / AMDP）。

**⚪ 大內表沒有及時 `FREE`**

---

## 2. 資料錯誤（安靜地錯）

**🔴 `READ TABLE ... BINARY SEARCH` 但內表沒先排序**
沒排序的 binary search 會**找不到本來存在的資料**，而且完全不報錯。DEV 資料少時可能剛好正確，PRD 就開始錯——這種環境相依的錯最難查。
改法：把內表宣告成 `SORTED TABLE`（編譯器保證排序），或在 `READ` 之前明確 `SORT ... BY <key>`。

**🔴 `sy-subrc` 沒檢查就用結果**
`SELECT SINGLE`、`READ TABLE`、`CALL FUNCTION`、`AUTHORITY-CHECK` 之後不檢查 `sy-subrc`，程式會安靜地用錯的資料算下去。這種錯不會報錯，只會算錯。

失敗時工作區到底變成什麼，要看是哪種敘述——這個差別決定了錯誤有多隱蔽：

| 敘述 | 失敗時目標變數 |
|---|---|
| `READ TABLE ... INTO ls_x` | **維持原值不變**（上一圈的髒資料）← 最危險 |
| `SELECT SINGLE ... INTO ls_x` | **維持原值不變** ← 最危險 |
| `SELECT ... INTO TABLE lt_x` | 內表被清空（比較好察覺） |
| `SELECT SUM( ) INTO lv_x` | 無資料時回 0 或 initial |

所以在 LOOP 內用 `READ TABLE ... INTO` 時，除了檢查 `sy-subrc`，工作區也要在迴圈開頭 `CLEAR`。

**🔴 `sy-subrc` 被中間的敘述覆寫**
`sy-subrc` 是全域的，任何敘述都可能改它。要在**緊接的下一行**檢查。

**🔴 `READ TABLE` 只讀到 1:N 關係中的任意一筆**
例如用 `ebeln + ebelp` 去 `READ` EKET（交貨排程），但一個採購項目可以有多筆排程行（`ETENR`）。這時 `READ TABLE` 拿到的是第一筆，不是你要的那筆，也不是全部。
要先想清楚業務上該取哪一筆（最早？最晚？加總？），再決定用 `READ`、`LOOP AT ... WHERE` 還是彙總。

**🟡 `FOR ALL ENTRIES` 會自動去除重複列**
結果內表筆數可能比預期少。需要保留重複的話，WHERE 條件裡要包含足以區分的 key 欄位。

**🟡 `FOR ALL ENTRIES` 的 WHERE 沒包含目標表的完整 key**
會拿到不完整或錯誤的對應關係。

**🟡 內表 `APPEND` vs `MODIFY` 用錯**
該更新的地方用 append，產生重複資料。

**🟡 沒有 `ORDER BY` 就假設資料有順序**
Open SQL 不保證回傳順序。在 ECC 上「剛好會照 key 排」的程式，搬到 HANA 就開始錯。要順序就明確 `SORT`。

**🟡 金額 / 數量的小數位與幣別**
不同幣別小數位不同（JPY 沒有小數）。直接拿 SAP 內部值顯示或計算會錯。

**🟡 單位（UoM）沒換算就相加**
同一個料號的採購單位、庫存單位、基本單位可能不同。跨單位直接加總是常見的靜默錯誤。要用 `MD_CONVERT_MATERIAL_UNIT` 之類的 FM 換算。

**🟡 日期跨年度 / 期間邊界**
WHERE 條件寫死年度、或用 `sy-datum` 推算期間但沒考慮會計年度變式。

**🟡 用未初始化的日期做減法**
`sy-datum - ls_x-eindt`，當 `eindt` 是 initial（`00000000`）時會得到約 7,300,000 天。如果後面有「超過 N 天算逾期」的判斷，這筆會穩穩被誤判。

**⚪ 前置零沒處理**
料號、單號常有前置零問題。用 `CONVERSION_EXIT_ALPHA_INPUT` 補零再比對。

---

## 3. 交易一致性

**🔴 呼叫 BAPI 後沒檢查 `RETURN` table 就 COMMIT**
BAPI 的錯誤放在 `RETURN` 裡回來，不會 raise exception。不檢查等於把錯誤吞掉。
注意要檢查的訊息類型不只 `E`：`A`（abort）和 `X`（dump 等級）也是失敗。
```abap
CALL FUNCTION 'BAPI_XXX_CREATE' ... TABLES return = lt_return.

LOOP AT lt_return TRANSPORTING NO FIELDS WHERE type CA 'EAX'.
  EXIT.
ENDLOOP.
IF sy-subrc = 0.
  CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
  " 把 lt_return 的訊息記下來，不要吞掉
ELSE.
  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT' EXPORTING wait = 'X'.
ENDIF.
```

**🔴 `COMMIT WORK` 放在 LOOP 裡面**
中途失敗會留下處理一半的狀態，資料不一致且難以回復。真的要分批 commit，必須設計成可續跑（記錄處理到哪筆）。

**🔴 直接 `UPDATE` / `MODIFY` / `DELETE` 標準 SAP 表**
繞過 SAP 的一致性檢查與後續處理（統計更新、文件流、稽核軌跡），是最容易出大事的寫法。應該用 BAPI 或標準 FM。

**🔴 `ENQUEUE` 沒有對應的 `DEQUEUE`**
鎖沒放掉，別人動不了那筆資料，要等到使用者登出。

**🔴 計數器 / 成功訊息沒有依實際結果累加**
`gv_cnt = gv_cnt + 1` 放在沒檢查 RETURN 的 BAPI 之後，最後顯示的「已處理 N 筆」是假的。使用者會相信這個數字。

**🟡 `BAPI_TRANSACTION_COMMIT` 沒帶 `WAIT = 'X'`**
不等 update 完成就返回，後面立刻讀那筆資料會讀不到。

**🟡 沒有冪等性設計**
同一批資料重跑會產生第二次過帳。有寫入的程式一定要想：中途 dump 之後重跑會怎樣？

**🟡 混用 `CALL TRANSACTION` 與 BAPI 但沒統一 commit 策略**

---

## 4. 權限與安全

**🔴 完全沒有 `AUTHORITY-CHECK`**
自建 report 讓所有人看到所有組織的資料，是常見的稽核缺失。

MM 採購相關的權限物件，依你要控制的層級選：

| 物件 | 控制什麼 |
|---|---|
| `M_BEST_EKO` | 採購組織（**組織層級**，報表最常用） |
| `M_BEST_WRK` | 工廠（**組織層級**） |
| `M_BEST_EKG` | 採購群組 |
| `M_BEST_BSA` | 採購單據類型（不是組織層級，別拿來當組織控管） |

FI 常用 `F_BKPF_BUK`（公司代碼）。不確定該用哪個時，查標準 T-code（如 `ME23N`）用了什麼——用 `SU53` 或 `ST01` trace 最快。

**🔴 `AUTHORITY-CHECK` 之後沒檢查 `sy-subrc`**
等於沒檢查。

**🟡 只在選擇畫面檢查權限，沒在資料層過濾**
使用者可以繞過（直接跑背景 job 或用其他 variant）。

**🟡 用 Native SQL（`EXEC SQL`）**
繞過 client 隔離與權限層，也不可攜。

**🟡 除錯用的後門**
例如「如果使用者是 XXX 就跳過檢查」。legacy 程式偶爾會有，要抓出來。

---

## 5. 環境相依 / 硬寫死

**🔴 硬寫死的 client / 公司代碼 / 工廠 / 使用者 ID**
在 DEV 跑得好好的，搬到 PRD 就錯，或是漏掉其他公司代碼的資料。改成 selection screen 參數、常數、或設定表。

**🟡 硬寫死的路徑（AL11 目錄、Windows 路徑）** → 用邏輯檔名（`FILE` T-code 定義）。

**🟡 硬寫死的 RFC destination** → 不同環境的名稱不同。

**🟡 寫死的文字訊息** → 用 message class 或 text element，否則無法多語系。

**🟡 業務判斷綁在寫死的文字上**
例如 `IF gs_out-stat = '逾期'`。在別的登入語系下這個比較會失效。狀態應該用代碼（`'X'`、`'01'`）判斷，顯示時才轉文字。

**⚪ 寫死的日期 / 期間** → 通常是測試殘留。

---

## 6. Dump 來源

**🔴 除以零** — 分母沒檢查是否為 0。

**🔴 ALV 的 `i_structure_name` 與實際內表結構不符**
`REUSE_ALV_GRID_DISPLAY` 傳了一個 DDIC 結構名稱，但 `t_outtab` 是本地 `TYPES` 定義的內表。兩者欄位不一致就會 dump 或顯示錯亂。
改法：確認 DDIC 結構存在且欄位一致，或改用 `REUSE_ALV_FIELDCATALOG_MERGE` / 手動建 field catalog。

**🔴 型別 / 長度不符的搬移** — 字串轉數字失敗。用 `TRY...CATCH cx_sy_conversion_error`。

**🟡 未初始化的物件參照** — 呼叫 null reference 的 method。

**🟡 `OPEN DATASET` 沒有檢查 `sy-subrc`**

**🟡 背景執行時做了只有線上才能做的事**
呼叫 GUI 相關 FM（`GUI_DOWNLOAD`、`POPUP_TO_CONFIRM`）在背景會 dump。用 `sy-batch` 判斷。

**🟡 記憶體不足** — 一次撈太多資料進內表。加分頁或 package size。

**🟡（7.40+ 程式碼才會遇到）表達式讀取不存在的列**
`lt_tab[ 1 ]` 或 `lt_tab[ key = x ]` 找不到時會 dump（舊的 `READ TABLE` 是設 `sy-subrc`）。
用 `VALUE #( lt_tab[ ... ] OPTIONAL )` 或 `TRY...CATCH cx_sy_itab_line_not_found`。

---

## 7. 模組特有陷阱

這一區是新手最容易安靜出錯的地方——語法完全正確，數字就是不對。

### MM（採購 / 庫存）

**🔴 彙總 `EKBE`（採購歷史）沒有處理 `SHKZG`**
`EKBE-MENGE` 永遠是正數，借貸方向記在 `SHKZG`（`S` 借 / `H` 貸）。直接 `SUM( menge )` 會把退貨、沖銷當成加項，收貨量高估。
```abap
" 錯：收貨 100、退貨 100，算出來是 200
SELECT SUM( menge ) FROM ekbe ... WHERE bewtp = 'E'.

" 對：撈明細後依 shkzg 加減
LOOP AT lt_ekbe INTO ls_ekbe.
  IF ls_ekbe-shkzg = 'H'.  lv_qty = lv_qty - ls_ekbe-menge.
  ELSE.                    lv_qty = lv_qty + ls_ekbe-menge.
  ENDIF.
ENDLOOP.
```
`MSEG`（物料憑證明細）同理。

**🟡 `EKKO` 沒過濾 `BSTYP`**
`F` = 採購單、`K` = 合約、`L` = 排程協議、`A` = 詢價。不過濾會把不該處理的單據一起抓進來。

**🟡 `EKET`（交貨排程）是 1:N**
一個採購項目可以有多筆排程行（`ETENR`）。要想清楚該取哪一筆。

**🟡 刪除與完成旗標沒過濾**
`EKKO-LOEKZ` / `EKPO-LOEKZ`（刪除）、`EKPO-ELIKZ`（交貨完成）、`EKPO-EREKZ`（發票完成）。漏掉會處理到不該處理的單。

**🟡 `MATNR` 長度**
S/4 若啟用長料號是 40 碼。寫死 18 碼會截斷。

### FI（財務）

**🟡 `BSEG` 的借貸方向同樣看 `SHKZG`**，`DMBTR` 是正數。
**🟡 `BKPF-XBLNR`、沖銷憑證（`STBLG`）** 沒排除的話會重複計算。
**🟡 特別總帳（`UMSKZ`）** 沒處理會漏掉預付款、押金等。

### SD（銷售）

**🟡 `VBAK`/`VBAP` 的 `ABGRU`（拒絕原因）** 沒過濾會算到已拒絕的訂單。
**🟡 開立發票狀態 `VBUK`/`VBUP`** 在 S/4 已併入 `VBAK`/`VBAP`，跨版本要注意。

---

## 8. 可維護性

**🟡 沒有任何錯誤處理** — 失敗時使用者只看到空白畫面或 dump。

**🟡 一個 FORM / METHOD 幾百行**

**🟡 大段被註解掉的程式碼**
先跟標頭的修改記錄比對（見 §0）：如果是某個 CR 宣稱做過的功能，那是 🔴 Blocker 不是可維護性問題。如果只是歷史殘留，建議確認後刪除——但不要自己決定刪。

**🟡 變數名稱與實際用途不符** — copy-paste 殘留，是誤解的溫床。

**⚪ 死碼** — 宣告了但沒用到的變數（如建了 field catalog 內表卻沒填也沒傳）。

**⚪ 沒有程式標頭註解**（用途、作者、CR 單號、修改記錄）

**⚪ 匈牙利命名不一致**（`lv_` / `lt_` / `ls_` / `gv_` 混用）

---

## 9. ABAP 版本與 ECC / S4 差異

**review 前先確認版本，建議才有意義。** 查法：登入系統 → `系統 → 狀態` → 元件資訊。

### EhP 與 NetWeaver 對照

「ECC 6.0」本身不代表 ABAP 版本——決定語法的是底下的 NetWeaver release：

| ERP 版本 | NetWeaver | 可用的重要語法 |
|---|---|---|
| ECC 6.0（無 EhP）～ EhP4 | 7.00 / 7.01 | 傳統語法 |
| ECC 6.0 EhP5 | 7.02 | String template `\|...\|`、`boolc`、method chaining |
| ECC 6.0 EhP6 | 7.31 | 同上 |
| **ECC 6.0 EhP7** | **7.40** | **Inline declaration `DATA(x)`、`VALUE #( )`、`CORRESPONDING`、`COND`/`SWITCH`、`FOR`、`NEW`、table expression `itab[ ]`、`LOOP AT ... GROUP BY`、CDS View** |
| ECC 6.0 EhP8 | 7.50 | 再加上 `REDUCE` 增強、`FILTER` 等 |
| S/4HANA | 7.51+ | `SELECT ... FROM @itab`(7.52)、AMDP、RAP |

> 常見誤解：以為 ECC 就等於舊語法。**EhP7 已經是 7.40，7.4 系列的新語法都能用。**
> 但要注意：能用不代表該用——如果整支程式是舊風格，混入新語法會降低一致性。
> 判斷原則：改既有程式時跟隨原風格；寫新程式時用當前版本的最佳寫法。

### S/4 特有 / 建議
- CDS View 取代 ABAP 層的大量 join 與彙總
- AMDP（HANA SQLScript）處理重運算
- RAP 做 Fiori 後端
- 部分 ECC 表在 S/4 變成 compatibility view（`MARD`、部分 `BSEG` 相關），效能特性不同
- 很多彙總表被移除（改為即時計算）

### S/4 上已淘汰或不建議
- Dynpro / Module Pool 新開發（改用 Fiori）
- 依賴已移除的彙總表
- 依賴資料庫回傳順序（HANA 上更明顯，見 §2）
