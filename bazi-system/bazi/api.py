# -*- coding: utf-8 -*-
"""
api.py — 统一编排与 JSON 输出

analyze_bazi : 四柱 + 大运 +（可选）流年 合并为结构化结果
query_almanac : 单日期黄历查询
to_json       : 统一 JSON 序列化（ensure_ascii=False）
"""

import json
from datetime import date

from . import pillars, dayun, liunian, almanac


def analyze_bazi(birth: dict) -> dict:
    """
    birth 字段：
      year, month, day, hour=0, minute=0
      calendar_type="solar"|"lunar", is_leap=False
      gender="male"|"female"
      longitude=120.0, tz_offset=8
      flow_year=None  （可选，给定则附带流年分析）
    返回结构化 dict。
    """
    p = pillars.build_pillars(
        birth["year"], birth["month"], birth["day"],
        birth.get("hour", 0), birth.get("minute", 0),
        calendar_type=birth.get("calendar_type", "solar"),
        gender=birth.get("gender", "male"),
        longitude=birth.get("longitude", 120.0),
        tz_offset=birth.get("tz_offset", 8),
        is_leap=birth.get("is_leap", False),
    )

    pp = p["pillars"]
    y_s, m_s, m_b, d_s = (pp["year"]["stem"], pp["month"]["stem"],
                               pp["month"]["branch"], pp["day"]["stem"])

    # 大运以「公历出生日」为基准（真太阳时不影响起运天数统计的日期差）
    solar = date.fromisoformat(p["input"]["solar"])
    du = dayun.compute_dayun(solar, y_s, m_s, m_b, birth.get("gender", "male"))

    result = {
        "birth": birth,
        "pillars": p,
        "dayun": du,
    }

    # 当前大运（按 起运 + 年龄推算，可选）
    age = birth.get("age")
    if age is not None:
        start = du["start_age_decimal"]
        if age >= start:
            k = int((age - start) // 10) + 1
            k = max(1, min(k, len(du["sequence"])))
            result["current_dayun"] = du["sequence"][k - 1]

    # 流年分析
    fy = birth.get("flow_year")
    if fy is not None:
        cur_du = result.get("current_dayun")
        result["liunian"] = liunian.analyze(
            fy, d_s, pillars=p,
            current_dayun=cur_du,
        )

    return result


def query_almanac(solar_iso: str) -> dict:
    return almanac.query(date.fromisoformat(solar_iso))


def to_json(obj, indent: int = 2) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=indent)
