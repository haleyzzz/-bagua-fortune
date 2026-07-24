# -*- coding: utf-8 -*-
"""
run.py — 命令行入口

示例：
  # 四柱 + 大运（公历）
  python run.py --birth 1990-05-20 --hour 14 --minute 30 --gender male --lon 116.4

  # 农历输入（含闰月）
  python run.py --birth 1990-04-26 --calendar lunar --gender female

  # 附带流年分析（40 岁看 2029 年）
  python run.py --birth 1990-05-20 --gender male --age 39 --flow-year 2029

  # 单日黄历查询
  python run.py --almanac 2026-07-24

输出标准 JSON（ensure_ascii=False），便于接口对接与结果校验。
"""

import argparse
import json
import sys
from pathlib import Path

# 允许以 `python run.py` 直接运行（把包路径加入 sys.path）
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from bazi import analyze_bazi, query_almanac, to_json  # noqa: E402


def main(argv=None):
    ap = argparse.ArgumentParser(description="八字命理分析系统 (JSON 输出)")
    ap.add_argument("--birth", help="出生日期 YYYY-MM-DD")
    ap.add_argument("--hour", type=int, default=0)
    ap.add_argument("--minute", type=int, default=0)
    ap.add_argument("--calendar", default="solar", choices=["solar", "lunar"])
    ap.add_argument("--is-leap", action="store_true", help="农历闰月")
    ap.add_argument("--gender", default="male", choices=["male", "female"])
    ap.add_argument("--lon", type=float, default=120.0, help="出生经度(度)")
    ap.add_argument("--tz", type=int, default=8, help="时区偏移(小时)")
    ap.add_argument("--age", type=float, default=None, help="当前年龄(用于定大运)")
    ap.add_argument("--flow-year", type=int, default=None, help="流年分析年份")
    ap.add_argument("--almanac", help="黄历查询 YYYY-MM-DD")
    ap.add_argument("--indent", type=int, default=2)
    args = ap.parse_args(argv)

    if args.almanac:
        out = query_almanac(args.almanac)
        print(to_json(out, args.indent))
        return

    if not args.birth:
        ap.error("需提供 --birth 或 --almanac")

    y, m, d = (int(x) for x in args.birth.split("-"))
    birth = {
        "year": y, "month": m, "day": d,
        "hour": args.hour, "minute": args.minute,
        "calendar_type": args.calendar,
        "is_leap": args.is_leap,
        "gender": args.gender,
        "longitude": args.lon,
        "tz_offset": args.tz,
        "age": args.age,
        "flow_year": args.flow_year,
    }
    out = analyze_bazi(birth)
    print(to_json(out, args.indent))


if __name__ == "__main__":
    main()
