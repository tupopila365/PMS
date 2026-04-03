package com.cbmp.boq;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Parses BOQ CSV exports (header row with flexible column names).
 * Expected columns: itemCode (or item_code, code), description, unit, quantity, rate, amount, section.
 */
public final class BoqCsvParser {

    private BoqCsvParser() {
    }

    public static List<Map<String, Object>> parse(String text) {
        List<String[]> rows = splitRows(text);
        if (rows.isEmpty()) {
            return List.of();
        }
        String[] header = rows.get(0);
        Map<String, Integer> col = indexHeader(header);
        List<Map<String, Object>> out = new ArrayList<>();
        for (int i = 1; i < rows.size(); i++) {
            String[] cells = rows.get(i);
            if (cells.length == 0 || allBlank(cells)) {
                continue;
            }
            String code = pickCell(col, cells, "itemcode", "item_code", "code", "ref", "reference");
            if (code == null || code.isBlank()) {
                continue;
            }
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("itemCode", code.trim());
            String desc = pickCell(col, cells, "description", "desc", "item", "details");
            if (desc != null && !desc.isBlank()) {
                m.put("description", desc.trim());
            }
            String unit = pickCell(col, cells, "unit", "uom", "units");
            if (unit != null && !unit.isBlank()) {
                m.put("unit", unit.trim());
            }
            BigDecimal qty = parseDecimal(pickCell(col, cells, "quantity", "qty", "qnty"));
            if (qty != null) {
                m.put("quantity", qty.doubleValue());
            }
            BigDecimal rate = parseDecimal(pickCell(col, cells, "rate", "unitrate", "unit_rate", "price"));
            if (rate != null) {
                m.put("rate", rate.doubleValue());
            }
            BigDecimal amount = parseDecimal(pickCell(col, cells, "amount", "total", "value", "cost"));
            if (amount == null && qty != null && rate != null) {
                amount = qty.multiply(rate);
            }
            if (amount != null) {
                m.put("amount", amount.doubleValue());
            }
            String section = pickCell(col, cells, "section", "worksection", "cbs", "wbs");
            if (section != null && !section.isBlank()) {
                m.put("section", section.trim());
            }
            out.add(m);
        }
        return out;
    }

    private static boolean allBlank(String[] cells) {
        for (String c : cells) {
            if (c != null && !c.isBlank()) {
                return false;
            }
        }
        return true;
    }

    private static List<String[]> splitRows(String text) {
        List<String[]> out = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return out;
        }
        String[] lines = text.split("\r\n|\n|\r");
        for (String line : lines) {
            if (line.isBlank()) {
                continue;
            }
            out.add(parseCsvLine(line));
        }
        return out;
    }

    /** Minimal CSV line parser with quoted fields. */
    static String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        cur.append('"');
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    cur.append(c);
                }
            } else {
                if (c == '"') {
                    inQuotes = true;
                } else if (c == ',') {
                    fields.add(cur.toString().trim());
                    cur.setLength(0);
                } else {
                    cur.append(c);
                }
            }
        }
        fields.add(cur.toString().trim());
        return fields.toArray(new String[0]);
    }

    private static Map<String, Integer> indexHeader(String[] header) {
        Map<String, Integer> m = new LinkedHashMap<>();
        for (int i = 0; i < header.length; i++) {
            String key = normKey(header[i]);
            if (!key.isEmpty()) {
                m.putIfAbsent(key, i);
            }
        }
        return m;
    }

    private static String normKey(String h) {
        if (h == null) {
            return "";
        }
        return h.trim().toLowerCase(Locale.ROOT).replaceAll("[\\s-]+", "");
    }

    private static String pickCell(Map<String, Integer> col, String[] cells, String... aliases) {
        for (String a : aliases) {
            Integer idx = col.get(a);
            if (idx != null && idx < cells.length) {
                String v = cells[idx];
                return v != null ? v : "";
            }
        }
        return null;
    }

    private static BigDecimal parseDecimal(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        String t = s.trim().replace(",", "");
        try {
            return new BigDecimal(t);
        } catch (Exception e) {
            return null;
        }
    }
}
