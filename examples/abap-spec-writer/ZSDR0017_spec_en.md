<div align="center">

# ZSDR0017

### Order Item Report and Delivery Block for Large Orders — Program Specification

Request number: to be confirmed (the original program header only mentions CR-0347; the block feature added in 2016 has no number)

</div>

> **About this translation:** this is an English translation of the sample [`ZSDR0017_規格書.md`](ZSDR0017_規格書.md). `abap-spec-writer` itself writes specs in Traditional Chinese. If the two versions differ, the Chinese one is the original.

---

## 1. Document Information

| Item | Details |
|---|---|
| Program name | ZSDR0017 |
| Request number | To be confirmed |
| Subject | List order items, with the option to set a delivery block on large orders |
| Document version | v0.1 |
| Document status | Draft, awaiting confirmation from the requester |
| Developers | WLIN (created 2014), KCHEN (added the block feature 2016) |
| Requester | To be confirmed |

This spec was written after taking over the program, and it is based on the current code.

What the program actually does differs from what its header says (see Section 2). So the current behavior is written down first, for the requester to confirm what should stay and what should change.

## 2. Background and Purpose

**The two things the program does today:**

1. It lists every item of standard orders in the Taiwan sales organization: order number, customer, material, quantity and amount.
2. When the user ticks "Apply block", any order worth more than 500,000 in total automatically gets a delivery block, so it cannot ship until someone releases it manually.

**The problem the program was originally meant to solve (to be confirmed):**

- The header says "Open Orders Report", and CR-0347 in 2015 asked to "show only items not yet shipped".
- But the current code has no filter on shipping status, so shipped and completed orders are listed too.
- The requester needs to define whether "open" means not shipped, not billed or not completed. That decides whether the report has to change.

**The purpose of the block feature (to be confirmed):** presumably, large orders need a credit or manager check before they ship. The code gives no source for the 500,000 threshold or the exempt customer.

**Acceptance criteria (based on current behavior, to be revised once the requester confirms):**

1. Given a creation date and customer range, the items in the report match the order items in the system.
2. With "Apply block" ticked, orders worth more than 500,000 in total show block code Z1 on the order.
3. With it unticked, the program only displays data and changes no orders.

## 3. Glossary

| Term | Meaning |
|---|---|
| Sales organization TW01 | The organizational unit responsible for sales in Taiwan. The program only looks at this one. |
| Order types ZOR / ZOR2 | Two company-defined order types. The program only looks at these two. |
| Delivery block | A flag on an order that "freezes" it: no delivery can be created until someone removes the flag manually. |
| Block code Z1 | The delivery block reason code the program sets. Its business meaning is to be confirmed. |
| Order net value | The sum of all item amounts on one order, excluding tax, in the order's own currency. |
| BAPI | A standard interface provided by SAP. The program uses one to change orders, with the same effect as changing them manually on the order screen. |
| ALV | SAP's table-style report screen, which supports sorting, filtering and exporting to Excel. |

## 4. Functional Scope

### 4.1 Selection Screen

| Field | Maps to | Required/Optional | Notes |
|---|---|---|---|
| Order creation date | Creation date on the order header | Optional | Accepts a range. Left empty, it reads all dates, which can be a lot of data, so always entering one is recommended. |
| Customer | Sold-to customer on the order header | Optional | Accepts multiple values or a range. Left empty, it means all customers. |
| Apply block | Checkbox | Optional | Orders are changed only when this is ticked; otherwise the program only shows the report. Its technical name on the screen is `p_x`, which says nothing about its purpose, so take extra care when running the program. |

Sales organization TW01 and order types ZOR / ZOR2 are hardcoded and cannot be changed on the screen.

### 4.2 Process Overview

1. Read order headers using the selection screen criteria plus the fixed sales organization and order types.
2. For each order, read the customer name and all items, and add one report line per item.
3. Add up the item amounts for the whole order at the same time.
4. If "Apply block" is ticked and the order meets the conditions, set delivery block Z1 and mark the order in the report.
5. Display the report.

## 5. Processing Logic

### 5.1 Reading Orders

The program only looks at orders in sales organization TW01 with order type ZOR or ZOR2, then applies the creation date and customer from the screen.

It does not filter on shipping, billing or completion status, and it does not exclude rejected items.

> **Core rule: the report's scope is not "open orders"**
>
> Shipped orders, completed orders and orders with rejected items all appear in the report.
>
> Example: an order created in March and fully shipped in March still lists every item when you query March.
>
> Until the requester defines "open", do not use this report as an open-order list.

### 5.2 Building Report Lines

Each order item gets one line, showing order number, creation date, customer, customer name, item number, material, quantity and amount.

The customer name is read from the customer master.

**Known limitation:** if a customer cannot be read from the customer master, the line shows the customer name from the previous order instead of staying blank. This doesn't happen when the customer master is in good order, but if a name doesn't match the customer number, trust the customer number.

### 5.3 Delivery Block for Large Orders

> **Core rule: an order is blocked only when all three conditions are met**
>
> 1. "Apply block" is ticked on the selection screen.
> 2. The order net value is greater than 500,000 (exactly 500,000 is not blocked).
> 3. The customer is not 0000100023.
>
> When all three are met, the program sets delivery block Z1 on the order and marks every line of that order as blocked.

| Scenario | Order net value | Customer | "Apply block" ticked | Result |
|---|---|---|---|---|
| Standard large order | 500,001 | 0000100001 | Yes | Blocked |
| Exactly at the threshold | 500,000 | 0000100001 | Yes | Not blocked |
| Exempt customer | 900,000 | 0000100023 | Yes | Not blocked |
| Not ticked | 900,000 | 0000100001 | No | Not blocked, display only |

**Edge cases:**

1. **Currency:** the threshold is compared in the order's own currency, with no conversion. An order of USD 20,000 is not blocked; an order of JPY 600,000 is. Whether the threshold should always be in TWD is to be confirmed.
2. **Re-run:** running the program again on a blocked order sets Z1 again, and the report marks it as blocked as usual. Nothing fails, but the report can't show which orders were newly blocked this time.
3. **Block fails:** if someone else has the order open for editing, or the block code can't be used, the block doesn't go through, yet the report still marks the order as blocked. For now, the only way to know whether it worked is to check the block code on the order.
4. **Interrupted run:** each order is saved right after it is blocked. If the program stops halfway, earlier orders are blocked and later ones aren't, and the report keeps no record of where it stopped.

## 6. Output Fields

| Field | Data type | Notes |
|---|---|---|
| Order number | VBAK-VBELN | Each item of an order takes one line, so order numbers repeat. |
| Creation date | VBAK-ERDAT | The creation date on the order header, not the item's delivery date. |
| Customer | VBAK-KUNNR | Sold-to customer number. If it doesn't match the customer name, trust this field (see 5.2). |
| Customer name | KNA1-NAME1 | The first name line in the customer master. |
| Item | VBAP-POSNR | Order item number. |
| Material | VBAP-MATNR | The material on this item. |
| Quantity | VBAP-KWMENG | Order quantity in the sales unit on the order. The report has no unit column. |
| Amount | VBAP-NETWR | Item net value, excluding tax, in the order currency. The report has no currency column, so amounts from orders in different currencies can't simply be added up. |
| Blocked | One character | X means the program submitted a block for this order during this run. It doesn't guarantee the block succeeded (see 5.3, edge case 3). |

Whether the field structure ZSDS0017 used by the report screen matches the table above exactly is to be confirmed.

## 7. Out of Scope

| Item | Current state |
|---|---|
| Open-status filter | Not implemented. The definition of "open" is to be confirmed by the requester. |
| CR-0347, show only unshipped items | The condition is disabled in the code and never took effect. |
| Authorization check | None. Anyone who can run the program can block orders. |
| Handling of failed blocks | None. A failed block is still marked as blocked. |
| Currency conversion | None. The threshold is compared directly in the order currency. |
| Exempt customer 0000100023 | Reason for the exemption is to be confirmed. |
| Source of the 500,000 threshold | To be confirmed, along with whether it still applies. |
| Only TW01 and ZOR / ZOR2 | Reason to be confirmed. |
| Meaning of block code Z1 | To be confirmed. |
| Background jobs | Whether a scheduled job runs this program, and whether it ticks "Apply block", is to be confirmed. |
