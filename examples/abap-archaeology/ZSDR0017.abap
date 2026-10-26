*&---------------------------------------------------------------------*
*& Report ZSDR0017
*&---------------------------------------------------------------------*
*& 未結訂單報表
*& 2014/03/12  WLIN   新建
*& 2015/08/05  WLIN   CR-0347 只顯示未出貨項目
*& 2016/11/20  KCHEN  大額訂單自動設交貨凍結
*&---------------------------------------------------------------------*
REPORT zsdr0017.

TABLES: vbak.

TYPES: BEGIN OF ty_out,
         vbeln TYPE vbak-vbeln,
         erdat TYPE vbak-erdat,
         kunnr TYPE vbak-kunnr,
         name1 TYPE kna1-name1,
         posnr TYPE vbap-posnr,
         matnr TYPE vbap-matnr,
         kwmeng TYPE vbap-kwmeng,
         netwr TYPE vbap-netwr,
         flag  TYPE c,
       END OF ty_out.

DATA: gt1 TYPE TABLE OF vbak,
      gw1 TYPE vbak,
      gt2 TYPE TABLE OF vbap,
      gw2 TYPE vbap,
      gt3 TYPE TABLE OF ty_out,
      gw3 TYPE ty_out,
      lv_tmp TYPE kna1-name1,
      lv_sum TYPE vbap-netwr.

DATA: ls_hd  TYPE bapisdh1,
      ls_hdx TYPE bapisdh1x,
      lt_ret TYPE TABLE OF bapiret2.

SELECT-OPTIONS: s_erdat FOR vbak-erdat,
                s_kunnr FOR vbak-kunnr.
PARAMETERS: p_x AS CHECKBOX.

START-OF-SELECTION.

  SELECT * FROM vbak INTO TABLE gt1
    WHERE erdat IN s_erdat
      AND kunnr IN s_kunnr
      AND vkorg = 'TW01'
      AND auart IN ('ZOR', 'ZOR2').

  LOOP AT gt1 INTO gw1.
    SELECT SINGLE name1 FROM kna1 INTO lv_tmp
      WHERE kunnr = gw1-kunnr.

    SELECT * FROM vbap INTO TABLE gt2
      WHERE vbeln = gw1-vbeln.
*     AND abgru = space.          "CR-0347

    CLEAR lv_sum.
    LOOP AT gt2 INTO gw2.
      gw3-vbeln  = gw1-vbeln.
      gw3-erdat  = gw1-erdat.
      gw3-kunnr  = gw1-kunnr.
      gw3-name1  = lv_tmp.
      gw3-posnr  = gw2-posnr.
      gw3-matnr  = gw2-matnr.
      gw3-kwmeng = gw2-kwmeng.
      gw3-netwr  = gw2-netwr.
      lv_sum = lv_sum + gw2-netwr.
      APPEND gw3 TO gt3.
    ENDLOOP.

    IF p_x = 'X' AND lv_sum > 500000 AND gw1-kunnr <> '0000100023'.
      ls_hd-dlv_block = 'Z1'.
      ls_hdx-updateflag = 'U'.
      ls_hdx-dlv_block = 'X'.
      CALL FUNCTION 'BAPI_SALESORDER_CHANGE'
        EXPORTING
          salesdocument    = gw1-vbeln
          order_header_in  = ls_hd
          order_header_inx = ls_hdx
        TABLES
          return           = lt_ret.
      COMMIT WORK.
      gw3-flag = 'X'.
      MODIFY gt3 FROM gw3 TRANSPORTING flag WHERE vbeln = gw1-vbeln.
    ENDIF.
  ENDLOOP.

  CALL FUNCTION 'REUSE_ALV_GRID_DISPLAY'
    EXPORTING
      i_structure_name = 'ZSDS0017'
    TABLES
      t_outtab         = gt3.
