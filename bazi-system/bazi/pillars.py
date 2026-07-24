# -*- coding: utf-8 -*-
"""
pillars.py — 四柱排盘（年 / 月 / 日 / 时）

支持：
  · 公历 / 农历（含闰月）输入
  · 真太阳时校准（经度修正 + 时差方程），跨日自动顺延
  · 晚子时（23:00 后算次日，时支仍为子）
年柱以「立春」为界（core.year_ganzhi），月柱以「节气」为界（cnlunar 提供月支）。
"""

import math
from datetime import date, timedelta

from . import calendar
from .core import (
    gz_str, year_ganzhi, month_stem, hour_stem, shichen_branch,
    is_late_zishi, GAN, ZHI,
)
from .core import GAN, ZHI  # noqa: F401  (ZHI used for animal)


def equation_of_time(d: date) -> float:
    """时差方程（分钟），USNO 近似式，误差约 ±1 分钟。"""
    N = d.timetuple().tm_yday
    B = 2 * math.pi * (N - 1) / 365.24
    return 229.18 * (
        0.000075 + 0.001868 * math.cos(B) - 0.032077 * math.sin(B)
        - 0.014615 * math.cos(2 * B) - 0.040849 * math.sin(2 * B)
    )


def true_solar_time(birth: date, hour: int, minute: int,
                    longitude: float = 120.0, tz_offset: int = 8) -> tuple:
    """
    返回 (true_date, true_hour, true_minute)。
    真太阳时 = 标准时 + (经度 - 标准经线)/15×60 - 时差方程。
    """
    meridian = tz_offset * 15.0
    eot = equation_of_time(birth)
    correction = (longitude - meridian) * 4.0 - eot      # 分钟

    total = hour * 60 + minute + correction
    day_delta = 0
    while total < 0:
        total += 1440
        day_delta -= 1
    while total >= 1440:
        total -= 1440
        day_delta += 1

    true_date = birth + timedelta(days=day_delta)
    true_hour = int(math.floor(total / 60))
    true_minute = int(round(total - true_hour * 60))
    if true_minute == 60:
        true_minute = 0
        true_hour += 1
    return true_date, true_hour, true_minute


def build_pillars(year, month, day, hour=0, minute=0,
                  calendar_type="solar", gender="male",
                  longitude=120.0, tz_offset=8, is_leap=False) -> dict:
    """
    主入口。返回结构化四柱结果（含真太阳时中间量，便于校验）。
    calendar_type: "solar" | "lunar"
    gender: "male" | "female"
    """
    if calendar_type == "lunar":
        solar = calendar.lunar_to_solar(year, month, day, is_leap)
        input_kind = "农历"
    else:
        solar = date(year, month, day)
        input_kind = "公历"

    # 真太阳时校准
    t_date, t_hour, t_min = true_solar_time(solar, hour, minute, longitude, tz_offset)

    # 晚子时：真太阳时 23 点 → 次日，时支仍为子
    day_roll = 0
    if is_late_zishi(t_hour):
        day_roll = 1
    pillar_date = t_date + timedelta(days=day_roll)

    info = calendar.get_cn_info(pillar_date)

    # 年柱（立春界）
    y_s, y_b = year_ganzhi(pillar_date, info["lichun"])
    # 月柱（节气界，月支来自 cnlunar，月干用五虎遁）
    m_s = month_stem(y_s, info["month_branch"])
    m_b = info["month_branch"]
    # 日柱
    d_s, d_b = info["day_stem"], info["day_branch"]
    # 时柱（时支来自真太阳时，时干用五鼠遁）
    h_b = shichen_branch(t_hour)
    h_s = hour_stem(d_s, h_b)

    return {
        "input": {
            "kind": input_kind,
            "solar": f"{solar.isoformat()}",
            "time": f"{hour:02d}:{minute:02d}",
            "longitude": longitude,
            "tz_offset": tz_offset,
        },
        "true_solar_time": {
            "date": t_date.isoformat(),
            "hour": t_hour,
            "minute": t_min,
            "late_zishi": bool(day_roll),
            "pillar_date": pillar_date.isoformat(),
        },
        "lunar_display": info["lunar_display"],
        "animal": ZHI[y_b],
        "pillars": {
            "year":  {"stem": y_s, "branch": y_b, "gz": gz_str(y_s, y_b)},
            "month": {"stem": m_s, "branch": m_b, "gz": gz_str(m_s, m_b)},
            "day":   {"stem": d_s, "branch": d_b, "gz": gz_str(d_s, d_b)},
            "hour":  {"stem": h_s, "branch": h_b, "gz": gz_str(h_s, h_b)},
        },
        "_raw": {
            "day_stem": d_s, "day_branch": d_b,
            "month_branch": m_b, "jianchu_idx": info["jianchu_idx"],
        },
    }
