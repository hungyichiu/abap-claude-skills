# Program ID Card: ZSDR0017

> English translation of [ZSDR0017_程式身分證.md](ZSDR0017_程式身分證.md). The sample program was written to show problems commonly found in legacy ABAP and contains no company data. No background file or knowledge base was available for this run, so every inference is based on the code alone.
> ✅ Fact　🔶 Inference　❓ Unknown

## 1. Read this first

### One-line summary
🔶 Lists order items for ZOR/ZOR2 orders in sales organization TW01. When p_x is checked, it sets delivery block Z1 on every order whose total net value exceeds 500,000.

### 🔥 Summary

**Claimed vs actual**
- The header says "open orders, showing only items not yet delivered", but there is no status filter at all: delivered and completed orders are listed too. The CR-0347 line is commented out, and it filtered on rejection reason, not delivery status.

**Highest risks**
- This "report" changes production data: checking p_x calls a BAPI that changes the order header.
- The BAPI's RETURN is never checked before COMMIT, so failed orders are still marked as blocked.
- There is no AUTHORITY-CHECK: anyone who can run the program can block orders.

**Questions that block further work**
- 🔥 Is anyone checking p_x today? Does any background job use a variant with it?
- 🔥 What does "open" mean for the business? Why was CR-0347 commented out?
- 🔥 Why is customer 0000100023 never blocked?

## 2. Program behavior

### Basic data
| Item | Value |
|---|---|
| Object | ZSDR0017 / Report |
| Original author | WLIN (2014) |
| Change log | 2014/03/12 WLIN created |
| | 2015/08/05 WLIN CR-0347 show undelivered only |
| | 2016/11/20 KCHEN auto-block large orders |
| Size | 93 lines, one main flow, no FORMs |

### ⚠️ Claimed vs actual
Claimed: an open-order report, with CR-0347 adding "show only items not yet delivered".

Actual: ✅ the program never reads delivery or processing status. Any order matching date, customer, sales organization and order type is listed.

```abap
*     AND abgru = space.          "CR-0347
```

✅ The CR-0347 condition is commented out and never took effect. 🔶 Even if enabled, ABGRU is the rejection reason: it would only exclude rejected items, which is not the same as "not yet delivered".

✅ The header only says "auto-block large orders". The 500,000 threshold and the excluded customer exist only in the code.

### Input
| Field | Meaning | Certainty |
|---|---|---|
| s_erdat | Order creation date | ✅ |
| s_kunnr | Sold-to customer | ✅ |
| p_x | Runs the auto-block when checked | ✅ behavior / 🔶 the name gives no hint |

### Processing flow
1. Read VBAK by date and customer range, plus hard-coded TW01 and ZOR/ZOR2.
2. LOOP over orders: for each order, read the customer name from KNA1 and all items from VBAP.
3. Sum the item net values per order and append each item to the output table.
4. If p_x is checked, net value > 500000 and the customer is not 0000100023: call the BAPI to set delivery block Z1, COMMIT immediately, and set the flag in the output table.
5. Display the ALV.

### Output
- ✅ ALV (structure ZSDS0017)
- ✅ Updates the delivery block on the order header (through the BAPI)

## 3. Lookup and to-do

### Data access
#### Reads
| Table | Purpose | WHERE | Meaning certain? |
|---|---|---|---|
| VBAK | Order header | vkorg='TW01', auart ZOR/ZOR2 | ❓ why only these two order types |
| KNA1 | Customer name | kunnr | ✅ |
| VBAP | Order items | vbeln | ✅ |

#### Writes
| Target | Action | When | Risk |
|---|---|---|---|
| Order header LIFSK (via BAPI) | Set Z1 | p_x checked, once per order | 🔴 changes standard business data |

#### Function modules / BAPIs called
| Name | Purpose | Return checked | COMMIT |
|---|---|---|---|
| BAPI_SALESORDER_CHANGE | Set delivery block | ❌ lt_ret ignored | COMMIT WORK inside the loop |
| REUSE_ALV_GRID_DISPLAY | Display | — | — |

### Risks and suspicious points
1. **BAPI failures are swallowed (lines 76–85)**: when the order is locked by someone else or the block code is invalid, the BAPI returns an error, but the program still commits and still sets the flag. Users see "blocked" in the ALV while the order is not blocked, and the large order ships as usual.
2. **No AUTHORITY-CHECK**: anyone with SE38 or transaction access can block every large TW01 order. A common audit finding.
3. **COMMIT inside the LOOP (line 83)**: if the run stops halfway, earlier orders are blocked and later ones are not, with no record of where it stopped.
4. **SELECT inside the LOOP (lines 51, 54)**: two database reads per order; a wider date range can time out.
5. **KNA1 read without checking sy-subrc or CLEAR (line 51)**: when the read fails, the previous order's customer name is reused, and the ALV shows rows with the wrong name.
6. **Hard-coded values**: TW01, ZOR/ZOR2, 500000, Z1, 0000100023. A new sales organization or threshold means a code change.
7. 🔶 **The 500,000 threshold ignores currency**: NETWR is in order currency, so USD and TWD orders share the same threshold.
8. 🔶 **ls_hd is not cleared on each pass**: harmless with one field today; any field added later will leak into the next order.

### ❓ Still to confirm
#### A. You can check yourself
- [ ] 🔥 Does a background job run this program, and does its variant check p_x? → SM37 for jobs, SE38 for variants
- [ ] 🔥 What does block code Z1 mean? → SPRO, or TVLS in SE16
- [ ] ⚡ When, and by whom, was CR-0347 commented out? → SE38 version management
- [ ] ⚡ Do the ZSDS0017 fields match the program's output structure? → SE11
- [ ] 💡 Who uses this program? → SE93 for the transaction, STAD for run history

#### B. Only a person can answer
- [ ] 🔥 What does "open" mean: not delivered, not billed, not completed? (ask the business)
- [ ] 🔥 Why is customer 0000100023 excluded? (ask sales / credit management)
- [ ] ⚡ Where does the 500,000 threshold come from, and does it still apply? (ask credit management)
- [ ] 💡 Why only ZOR/ZOR2? (ask the SD consultant)

### What could not be determined
**Syntax not understood**: none.

**Syntax understood, intent unclear**
- Excluded customer 0000100023 has no comment at all.
- The name p_x gives no hint that it means "run the block".
- Why a "report" changes data: KCHEN added it in 2016, with no original request number.

---
Next: use this ID card with abap-verify to design test cases, or run abap-review to turn the risks into a fix list.
