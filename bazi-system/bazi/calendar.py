# -*- coding: utf-8 -*-
"""
calendar.py — 农历历法底层封装（基于 cnlunar / lunardate 算法引擎）

职责（只做「天文/历法」底座，不做八字推演）：
  · 由公历日期取得：日干支、月支（节气校正后的月地支）、建除十二神、当年立春日期、农历显示
  · 由农历日期（可含闰月）换算公历日期

注意：年柱由 core.year_ganzhi 依据「立春」自行推算，不依赖 cnlunar 的春节年柱。
"""

from datetime import datetime, date

try:
    from cnlunar import Lunar
except ImportError as e:  # pragma: no cover
    raise ImportError("需要 cnlunar：pip install cnlunar") from e

try:
    from lunardate import LunarDate
except ImportError as e:  # pragma: no cover
    raise ImportError("需要 lunardate：pip install lunardate") from e

from .core import GAN, ZHI, JIANCHU


def _char_index(table, ch):
    return table.index(ch)


def get_cn_info(solar: date) -> dict:
    """
    给定公历 date，返回历法底层信息。
    cnlunar 的月干支以「节气」为界（正确），年柱为「春节」界（八字不用）。
    """
    dt = datetime(solar.year, solar.month, solar.day)
    c = Lunar(dt)

    day8 = c.day8Char.strip()                 # 如 "己亥"
    month8 = c.month8Char.strip()             # 如 "乙未"

    day_stem = _char_index(GAN, day8[0])
    day_branch = _char_index(ZHI, day8[1])
    month_branch = _char_index(ZHI, month8[1])

    # 当年立春（节气列表第 2 项：小寒0 大寒1 立春2 ...）
    # cnlunar 的每个元素为 (month, day) 元组
    term_list = Lunar(datetime(solar.year, 6, 1)).thisYearSolarTermsDateList
    lm, ld = term_list[2]
    lichun = date(solar.year, lm, ld)

    # 农历显示信息（用 lunardate，避免 cnlunar.Lunar 缺字段）
    ld = LunarDate.from_solar_date(solar.year, solar.month, solar.day)
    lm_cn = ("闰" if ld.isLeapMonth else "") + ZHI[(ld.month + 1) % 12]  # 正月=寅(2)
    lunar_str = f"{ld.year}年{lm_cn}月{ld.day}日"

    jianchu_char = c.today12DayOfficer.strip()   # 建/除/满...
    jianchu_idx = JIANCHU.index(jianchu_char)

    return {
        "day_stem": day_stem,
        "day_branch": day_branch,
        "month_branch": month_branch,
        "month_branch_char": month8[1],
        "lichun": lichun,
        "lunar_display": lunar_str,
        "jianchu_idx": jianchu_idx,
        "jianchu_char": jianchu_char,
    }


def get_term_dates(year: int) -> list:
    """返回某公历年份的 24 节气 date 列表（索引：0小寒 1大寒 2立春 …）。"""
    raw = Lunar(datetime(year, 6, 1)).thisYearSolarTermsDateList
    return [date(year, m, d) for (m, d) in raw]


# 十二「节」（非中气）在 24 节气列表中的索引，按月支映射
_JIEQI_INDEX = {2: 2, 3: 4, 4: 6, 5: 8, 6: 10, 7: 12,
                 8: 14, 9: 16, 10: 18, 11: 20, 0: 22, 1: 0}


def month_jieqi_index(month_branch: int) -> int:
    """某月支对应的「节」在节气列表中的索引（寅→立春 等）。"""
    return _JIEQI_INDEX[month_branch]


def lunar_to_solar(year: int, month: int, day: int, is_leap: bool = False) -> date:
    """农历转公历。is_leap 表示闰月。"""
    ld = LunarDate(year, month, day, is_leap_month=is_leap)
    sd = ld.to_solar_date()
    return date(sd.year, sd.month, sd.day)
