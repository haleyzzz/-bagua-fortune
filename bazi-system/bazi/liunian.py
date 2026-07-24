# -*- coding: utf-8 -*-
"""
liunian.py — 流年分析 + 十神关系

  · 给定年份 → 流年干支（立春界，与四柱同年柱同算法）
  · 以「日主」为参照，输出 流年 / 四柱各干 / 当前大运 的十神关系
  · 附十神含义表，便于结构化解读与接口对接
"""

from .core import GANZHI, GAN, gz_str, ten_god, GAN_WUXING, GAN_YINYANG


SHEN_MEANING = {
    "比肩": "同辈、竞争、自我意识、合作分担",
    "劫财": "兄弟、朋友、破耗、资源争夺",
    "食神": "才华、口福、泄秀生财、女命子女",
    "伤官": "才艺、叛逆、克官显能、男命子女",
    "正财": "稳定收入、务实、男命妻星",
    "偏财": "横财、父亲、机遇、外缘人脉",
    "正官": "事业、名誉、约束规范、女命夫星",
    "七杀": "压力、权威、魄力挑战、偏夫偏官",
    "正印": "学识、贵人、庇护、母星",
    "偏印": "偏业、冷门、孤识、思虑过甚",
}


def flow_year_gz(flow_year: int) -> tuple:
    idx = (flow_year - 4) % 60
    return idx % 10, idx % 12


def _shen_entry(stem: int, day_master: int) -> dict:
    name = ten_god(stem, day_master)
    return {
        "stem": stem,
        "stem_char": GAN[stem],
        "十神": name,
        "五行": GAN_WUXING[stem],
        "阴阳": GAN_YINYANG[stem],
        "含义": SHEN_MEANING.get(name, ""),
    }


def analyze(flow_year: int, day_master_stem: int,
            pillars: dict = None, current_dayun: dict = None) -> dict:
    """
    flow_year: 流年公历年份
    day_master_stem: 日主天干序号（四柱之日干）
    pillars: build_pillars 返回的 pillars 字典（可选，用于呈现原局十神）
    current_dayun: 当前大运字典（可选，来自 dayun.compute_dayun）
    """
    f_s, f_b = flow_year_gz(flow_year)
    flow_shen = _shen_entry(f_s, day_master_stem)

    result = {
        "flow_year": flow_year,
        "flow_gz": gz_str(f_s, f_b),
        "flow_stem": f_s,
        "flow_branch": f_b,
        "day_master_stem": day_master_stem,
        "day_master_char": GAN[day_master_stem],
        "flow_shen": flow_shen,
    }

    # 原局四柱十神（以日主为参照）
    if pillars:
        pp = pillars["pillars"]
        result["year_shen"] = _shen_entry(pp["year"]["stem"], day_master_stem)
        result["month_shen"] = _shen_entry(pp["month"]["stem"], day_master_stem)
        result["hour_shen"] = _shen_entry(pp["hour"]["stem"], day_master_stem)
        # 日主自身
        result["self_shen"] = {
            "stem": day_master_stem, "stem_char": GAN[day_master_stem],
            "十神": "日主", "五行": GAN_WUXING[day_master_stem],
            "阴阳": GAN_YINYANG[day_master_stem], "含义": "命主自身",
        }

    # 当前大运十神
    if current_dayun:
        du_s = current_dayun["stem"]
        result["dayun_shen"] = _shen_entry(du_s, day_master_stem)
        result["dayun_gz"] = gz_str(du_s, current_dayun["branch"])

    return result
