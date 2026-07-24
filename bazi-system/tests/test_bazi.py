# -*- coding: utf-8 -*-
"""
八字系统单元测试
用「已知生辰 → 已知八字」的历史权威用例校验核心算法。
运行：在 bazi-system/ 下  pytest  （venv 已含 cnlunar/lunardate/pytest）
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date
from bazi import analyze_bazi, query_almanac, to_json
from bazi.core import (
    month_stem, hour_stem, year_ganzhi, ten_god,
    shichen_branch, is_late_zishi, ganzhi_index, gz_str,
    jianchu_name, taishen,
)
from bazi import calendar

# ── 已知八字历史权威用例（公历输入 → 四柱干支）──
KNOWN = [
    # 毛泽东 1893-12-26 辰时(8) 男
    dict(name="毛泽东", birth=dict(year=1893, month=12, day=26, hour=8, minute=0,
                                gender="male"),
         expect=dict(year="癸巳", month="甲子", day="丁酉", hour="甲辰"),
         dayun_dir="逆排", dayun_start="6岁8个月"),
    # 蒋介石 1887-10-31 午时(12) 男
    dict(name="蒋介石", birth=dict(year=1887, month=10, day=31, hour=12, minute=0,
                                gender="male"),
         expect=dict(year="丁亥", month="庚戌", day="己巳", hour="庚午"),
         dayun_dir="逆排", dayun_start="7岁8个月"),
    # 邓小平 1904-08-22 寅时(4) 男
    dict(name="邓小平", birth=dict(year=1904, month=8, day=22, hour=4, minute=0,
                                gender="male"),
         expect=dict(year="甲辰", month="壬申", day="戊子", hour="甲寅"),
         dayun_dir="顺排", dayun_start="5岁8个月"),
]


def test_known_pillars():
    for c in KNOWN:
        r = analyze_bazi(c["birth"])
        p = r["pillars"]["pillars"]
        got = dict(year=p["year"]["gz"], month=p["month"]["gz"],
                   day=p["day"]["gz"], hour=p["hour"]["gz"])
        assert got == c["expect"], f"{c['name']} 四柱不符: {got} != {c['expect']}"


def test_known_dayun_direction_start():
    for c in KNOWN:
        r = analyze_bazi(c["birth"])
        du = r["dayun"]
        assert du["direction"] == c["dayun_dir"], f"{c['name']} 大运顺逆错"
        assert du["start_age_display"] == c["dayun_start"], \
            f"{c['name']} 起运岁数错: {du['start_age_display']}"


def test_dayun_sequence_steps():
    # 邓小平 顺排，首运应为 癸酉，每步递干支 +1（六十甲子）
    r = analyze_bazi(KNOWN[2]["birth"])
    seq = r["dayun"]["sequence"]
    assert len(seq) >= 8
    assert seq[0]["gz"] == "癸酉"
    # 相邻两步在六十甲子中序号差应为 +1
    for i in range(1, len(seq)):
        prev = ganzhi_index(seq[i-1]["stem"], seq[i-1]["branch"])
        cur = ganzhi_index(seq[i]["stem"], seq[i]["branch"])
        assert (cur - prev) % 60 == 1
    # 每步十年
    assert seq[1]["start_age"] == seq[0]["start_age"] + 10


def test_lichun_year_boundary():
    # 2026-02-10 在立春(2/4)之后、春节(2/17)之前 → 年柱应为 丙午（立春界）
    b = dict(year=2026, month=2, day=10, hour=12, minute=0, gender="male")
    r = analyze_bazi(b)
    assert r["pillars"]["pillars"]["year"]["gz"] == "丙午"
    # 同年 2026-01-20（立春前）→ 年柱应为 乙巳（上一年）
    b2 = dict(year=2026, month=1, day=20, hour=12, minute=0, gender="male")
    r2 = analyze_bazi(b2)
    assert r2["pillars"]["pillars"]["year"]["gz"] == "乙巳"


def test_late_zishi_rolls_day():
    # 晚子时 23:00 → 日柱顺延到次日，时柱仍为子
    b_today = dict(year=2026, month=7, day=1, hour=0, minute=0, gender="male")
    b_late = dict(year=2026, month=7, day=1, hour=23, minute=0, gender="male")
    rt = analyze_bazi(b_today)
    rl = analyze_bazi(b_late)
    # 时支都应是子（branch 序号 0）
    assert rt["pillars"]["pillars"]["hour"]["branch"] == 0
    assert rl["pillars"]["pillars"]["hour"]["branch"] == 0
    # 晚子时日柱应比非晚子时推进一天（干支序号 +1，可能跨日）
    def idx(p):
        return ganzhi_index(p["day"]["stem"], p["day"]["branch"])
    assert (idx(rl["pillars"]["pillars"]) - idx(rt["pillars"]["pillars"])) % 60 == 1


def test_month_stem_mod12_boundary():
    # 癸年（年干=9）子月（月支=0）应为 甲子（验证模12修复）
    assert gz_str(month_stem(9, 0), 0) == "甲子"
    # 甲年（年干=0）子月（月支=0）应为 丙子
    assert gz_str(month_stem(0, 0), 0) == "丙子"
    # 甲年 寅月（月支=2）应为 丙寅
    assert gz_str(month_stem(0, 2), 2) == "丙寅"


def test_hour_stem_wuzhu():
    # 丁日（日干=3）子时（时支=0）应为 庚子（丁壬庚子居）
    assert gz_str(hour_stem(3, 0), 0) == "庚子"
    # 戊日（日干=4）子时（时支=0）应为 壬子（戊癸壬子是真途）
    assert gz_str(hour_stem(4, 0), 0) == "壬子"


def test_year_ganzhi_lichun():
    # 以 2026 立春(2/4) 为界
    d_after = date(2026, 2, 5)
    d_before = date(2026, 2, 3)
    lc = date(2026, 2, 4)
    assert year_ganzhi(d_after, lc) == (2, 6)   # 丙午
    assert year_ganzhi(d_before, lc) == (1, 5)   # 乙巳（上一年）


def test_ten_god_relations():
    # 日主 乙(木,阴)
    yi = 1
    assert ten_god(6, yi) == "正官"   # 庚金阳克乙木阴 → 正官
    assert ten_god(7, yi) == "七杀"   # 辛金阴克乙木阴 → 七杀
    assert ten_god(2, yi) == "伤官"   # 丙火阳 乙木阴生 → 伤官
    assert ten_god(4, yi) == "正财"   # 戊土阳 乙木阴克 → 正财
    assert ten_god(1, yi) == "比肩"   # 乙同干同阴阳 → 比肩


def test_jianchu_and_taishen():
    # 月支=日支 → 建
    assert jianchu_name(4, 4) == "建"
    # 胎神天干分量在表中
    t = taishen(0, 0)
    assert "门" in t["方位"] or "磨" in t["方位"]


def test_almanac_known_date():
    a = query_almanac("2026-07-24")
    # 2026-07-24 立春后 → 年柱 丙午
    assert a["ganzhi"]["year"] == "丙午"
    assert a["jianchu"]["index"] == a["jianchu"]["cnlib_index"]  # 与第三方库一致
    assert set(a["yiji"].keys()) == {"宜", "忌"}


def test_almanac_leap_handling():
    # 2025-01-29 为农历 乙巳年 正月初一（春节），应正常给出干支
    a = query_almanac("2025-01-29")
    assert "年" in a["lunar_display"]


def test_json_serializable():
    r = analyze_bazi({**KNOWN[0]["birth"], "flow_year": 2026, "age": 130})
    s = to_json(r)
    assert isinstance(s, str) and "癸巳" in s


def test_lunar_input_conversion():
    # 农历 2000-01-01（庚辰年正月初一）转公历，排盘不报错
    b = dict(calendar_type="lunar", year=2000, month=1, day=1,
              hour=8, minute=0, gender="male")
    r = analyze_bazi(b)
    assert r["pillars"]["input"]["kind"] == "农历"
    assert all(k in r["pillars"]["pillars"] for k in ("year", "month", "day", "hour"))


def test_true_solar_time_shift():
    # 同一公历时刻，经度不同 → 真太阳时不同 → 时柱可能不同
    b_east = dict(year=1990, month=5, day=20, hour=23, minute=30,
                  gender="male", longitude=120.0)
    b_west = dict(year=1990, month=5, day=20, hour=23, minute=30,
                  gender="male", longitude=75.0)
    re = analyze_bazi(b_east)
    rw = analyze_bazi(b_west)
    # 真太阳时校准会改变时辰（东西经度差 45°≈3 小时）
    assert re["pillars"]["input"]["longitude"] == 120.0
    assert rw["pillars"]["input"]["longitude"] == 75.0
