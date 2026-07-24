# -*- coding: utf-8 -*-
"""
almanac.py — 黄历查询

给定公历日期，输出：
  · 当日干支（及年/月干支，立春界）
  · 建除十二神
  · 宜 / 忌（由建除映射）
  · 胎神方位（天干 / 地支 双分量）
底层历法由 calendar（cnlunar）提供，建除/宜忌/胎神由 core 推导。
"""

from datetime import date

from . import calendar
from .core import (
    gz_str, year_ganzhi, month_stem, jianchu_name,
    yiji_from_jianchu, taishen, GAN, ZHI, JIANCHU,
)


def query(solar: date) -> dict:
    info = calendar.get_cn_info(solar)

    # 干支（立春界）
    y_s, y_b = year_ganzhi(solar, info["lichun"])
    m_s = month_stem(y_s, info["month_branch"])
    d_s, d_b = info["day_stem"], info["day_branch"]

    # 建除（用 core 推导，与 cnlunar 的 jianchu_idx 同源可校验）
    jc = jianchu_name(info["month_branch"], d_b)

    yi, ji = yiji_from_jianchu(jc)
    tai = taishen(d_s, d_b)

    return {
        "solar": solar.isoformat(),
        "lunar_display": info["lunar_display"],
        "animal": ZHI[y_b],
        "ganzhi": {
            "year": gz_str(y_s, y_b),
            "month": gz_str(m_s, info["month_branch"]),
            "day": gz_str(d_s, d_b),
        },
        "jianchu": {
            "name": jc,
            "index": JIANCHU.index(jc),
            "cnlib_index": info["jianchu_idx"],   # 第三方库对照，应一致
        },
        "yiji": {"宜": yi, "忌": ji},
        "taishen": tai,
    }
