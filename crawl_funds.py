import concurrent.futures
import json
import re
import urllib.parse
import urllib.request

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def fetch_url(url, timeout=6):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.read().decode("cp950", errors="ignore")
    except Exception:
        return ""


def parse_dividend(kind, code):
    """抓取最近期配息資料與近 12 期歷史"""
    url_map = {
        "A": f"https://mlivul.moneydj.com/w/wr/wr10.djhtm?a={code}",
        "B": f"https://mlivul.moneydj.com/w/wb/wb05.djhtm?a={code}",
        "D": f"https://mlivul.moneydj.com/w/wfv/wfv04.djhtm?a={code}",
    }
    url = url_map.get(kind)
    if not url:
        return 0.0, "", []

    content = fetch_url(url)
    trs = re.findall(r"<tr[^>]*>(.*?)</tr>", content, re.S)
    history = []

    for tr in trs:
        tds = re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)
        clean = [re.sub(r"<[^>]+>", "", t).strip() for t in tds]
        if len(clean) >= 2 and any(clean[0].startswith(y) for y in ["2026", "2025", "2024", "2023"]):
            if kind in ["A", "B"] and len(clean) >= 4:
                try:
                    amt = float(clean[3]) if clean[3] not in ["-", ""] else 0.0
                    base_nav = float(clean[4]) if len(clean) >= 5 and clean[4] not in ["-", ""] else 0.0
                    history.append({"date": clean[1], "amt": amt, "nav": base_nav})
                except ValueError:
                    pass
            elif kind == "D" and len(clean) >= 2:
                try:
                    amt = float(clean[1]) if clean[1] not in ["-", ""] else 0.0
                    history.append({"date": clean[0], "amt": amt, "nav": 0.0})
                except ValueError:
                    pass

    div_amt = history[0]["amt"] if history else 0.0
    div_date = history[0]["date"] if history else ""
    return div_amt, div_date, history[:12]


def crawl_and_analyze():
    print("[1/3] 取得三商美邦投資型專區全標的清單...")
    list_url = "https://mlivul.moneydj.com/w/djjson/MLISearchJSON.djjson?PK=0&m=0"
    raw_json = fetch_url(list_url, timeout=12)
    if not raw_json:
        print("錯誤: 無法取得基金清單")
        return

    data = json.loads(raw_json)
    all_funds = data.get("ResultSet", {}).get("Result", [])

    # 篩選「月配」標的
    monthly_funds = [f for f in all_funds if f.get("V41") == "月配"]
    print(f"-> 全區共 {len(all_funds)} 檔標的，找到 {len(monthly_funds)} 檔月配息商品")

    def process_item(r):
        code = r.get("V2", "")
        name = r.get("V3", "")
        kind = r.get("V42", "")
        currency = r.get("V26", "")
        f_type = r.get("V5", "")
        rr = r.get("V28", "")
        status = r.get("V43", "")

        try:
            nav = float(r.get("V18", 0))
        except ValueError:
            nav = 0.0

        try:
            std = float(r.get("V23", 999)) if r.get("V23") not in ["-", ""] else 999.0
        except ValueError:
            std = 999.0

        try:
            sharpe = float(r.get("V21", 0)) if r.get("V21") not in ["-", ""] else 0.0
        except ValueError:
            sharpe = 0.0

        try:
            ret_1y = float(r.get("V13", 0)) if r.get("V13") not in ["-", ""] else 0.0
        except ValueError:
            ret_1y = 0.0

        try:
            ret_3y = float(r.get("V15", 0)) if r.get("V15") not in ["-", ""] else 0.0
        except ValueError:
            ret_3y = 0.0

        try:
            ret_ytd = float(r.get("V17", 0)) if r.get("V17") not in ["-", ""] else 0.0
        except ValueError:
            ret_ytd = 0.0

        # 抓取配息歷史
        div_amt, div_date, history = parse_dividend(kind, code)
        ann_yield = round((div_amt * 12 / nav * 100), 2) if nav > 0 and div_amt > 0 else 0.0

        # 計算綜合穩定評分 (Score)
        # 高配息率加分，標準差高懲罰，近1年報酬為正加分
        penalty = max(0.1, 1 - (std / 35.0))
        score = round(ann_yield * penalty + (ret_1y * 0.15), 2) if ann_yield > 0 and std < 900 else 0.0

        bank_code = r.get("V29", "")
        # 三商美邦 MoneyDJ 官方標準連結規範 (支援 main.html iframe 與保單商品代號綁定，避免過濾跳轉錯誤)
        if kind == "A":
            sub_url = f"/w/wr/wr01.djhtm?a={code}-{bank_code}" if bank_code else f"/w/wr/wr01.djhtm?a={code}"
        elif kind == "B":
            sub_url = f"/w/wb/wb01.djhtm?a={code}-{bank_code}" if bank_code else f"/w/wb/wb01.djhtm?a={code}"
        elif kind == "C":
            sub_url = f"/ETFWeb/html/ET011001.djhtm?#ETFID={code}~{bank_code}" if bank_code else f"/ETFWeb/html/ET011001.djhtm?#ETFID={code}"
        elif kind == "D":
            sub_url = f"/w/wfv/wFV01.djhtm?a={bank_code or code}"
        elif kind == "E":
            sub_url = f"/w/wcurr/currencyaccount01.djhtm?a={bank_code or code}"
        else:
            sub_url = f"/w/wb/wb01.djhtm?a={code}"

        official_link = f"https://mlivul.moneydj.com/main.html?sUrl={urllib.parse.quote(sub_url)}"

        return {
            "code": code,
            "bank_code": bank_code,
            "name": name,
            "kind": kind,
            "type": f_type,
            "currency": currency,
            "rr": rr,
            "status": status,
            "nav": nav,
            "std": round(std, 2) if std < 900 else None,
            "sharpe": sharpe,
            "ret_1y": ret_1y,
            "ret_3y": ret_3y,
            "ret_ytd": ret_ytd,
            "div_amt": div_amt,
            "div_date": div_date,
            "ann_yield": ann_yield,
            "score": score,
            "history": history,
            "link": official_link,
        }

    print("[2/3] 多執行緒爬取歷史配息與計算性價比...")
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        for item in executor.map(process_item, monthly_funds):
            results.append(item)

    # 排序：優先以綜合評分由高到低排序
    results.sort(key=lambda x: x["score"], reverse=True)

    print("[3/3] 寫入 funds-data.json 與 funds-data.js (免伺服器雙擊直接開)...")
    output_data = {
        "updated_at": "2026-10-03",
        "total_funds": len(all_funds),
        "monthly_funds_count": len(results),
        "funds": results,
    }
    with open("funds-data.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    with open("funds-data.js", "w", encoding="utf-8") as f:
        f.write("window.FUNDS_DATA = " + json.dumps(output_data, ensure_ascii=False) + ";\n")

    print(f"完成！成功分析 {len(results)} 檔月配息商品，已同步輸出 funds-data.json 與 funds-data.js")


if __name__ == "__main__":
    crawl_and_analyze()
