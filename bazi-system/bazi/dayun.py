# -*- coding: utf-8 -*-
"""
dayun.py — 大运计算

规则：
  · 阳年男 / 阴年女 → 顺排（干支 +1）
  · 阴年男 / 阳年女 → 逆排（干支 -1）
  · 起运岁数 = 出生到「本命月支对应之节」的天数 ÷ 3（三天为一岁）
  · 每一步大运十年；首运从起运岁开始，干支由月柱递推。
"""

from datetime import date

from . import calendar
from .core import GANZHI, ganzhi_index, gz_str, GAN, ZHI, is_yang_stem


def _direction(year_stem: int, gender: str) -> int:
    yang_year = is_yang_stem(year_stem)          # 甲丙戊庚壬=阳
    male = gender == "male"
    forward = (yang_year and male) or (not yang_year and not male)
    return 1 if forward else -1


def _jieqi_target(birth: date, month_branch: int, direction: int) -> date:
    """
    求起运所依的「节」日期：
      · 顺排 → 下一月起始之「节」（出生后最近的一个）
      · 逆排 → 本月起始之「节」（出生前最近的一个）
    """
    if direction == 1:
        jq_idx = calendar.month_jieqi_index((month_branch + 1) % 12)
    else:
        jq_idx = calendar.month_jieqi_index(month_branch)
    this_terms = calendar.get_term_dates(birth.year)
    target_this = this_terms[jq_idx]

    if direction == 1:          # 顺排 → 之后最近的节
        if target_this > birth:
            return target_this
        next_terms = calendar.get_term_dates(birth.year + 1)
        return next_terms[jq_idx]
    else:                       # 逆排 → 之前最近的节
        if target_this < birth:
            return target_this
        prev_terms = calendar.get_term_dates(birth.year - 1)
        return prev_terms[jq_idx]


def compute_dayun(birth: date, year_stem: int, month_stem: int,
                  month_branch: int, gender: str, n_steps: int = 8) -> dict:
    """
    返回大运结构化结果。
    birth: 公历出生日期（date）；year_stem/month_stem/month_branch 来自四柱。
    """
    direction = _direction(year_stem, gender)
    target = _jieqi_target(birth, month_branch, direction)
    days = abs((target - birth).days)
    start_age_years = days / 3.0
    full_years = days // 3
    rem_days = days % 3
    start_age_display = f"{full_years}岁{rem_days * 4}个月"  # 1天=4个月

    month_idx = ganzhi_index(month_stem, month_branch)
    seq = []
    for k in range(1, n_steps + 1):
        gz_i = (month_idx + direction * k) % 60
        s, b = GANZHI[gz_i]
        start = full_years + (k - 1) * 10
        seq.append({
            "step": k,
            "gz": gz_str(s, b),
            "stem": s, "branch": b,
            "start_age": int(start),
            "start_age_decimal": round(start_age_years + (k - 1) * 10, 2),
            "end_age": int(start) + 9,
        })

    return {
        "direction": "顺排" if direction == 1 else "逆排",
        "days_to_jieqi": days,
        "start_age_decimal": round(start_age_years, 2),
        "start_age_display": start_age_display,
        "sequence": seq,
    }
