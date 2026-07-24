# 八字命理分析系统（bazi-system）

纯 Python 实现的中国传统命理算法库，覆盖**四柱排盘 / 大运推算 / 流年十神 / 黄历查询**四大模块。
所有干支推算基于农历历法算法引擎（`cnlunar` + `lunardate`），核心逻辑为可独立单元测试的纯函数。

## 功能模块

| 模块 | 文件 | 能力 |
|------|------|------|
| 四柱排盘 | `bazi/pillars.py` | 年/月/日/时四柱干支；公历·农历（含闰月）输入；真太阳时校准；晚子时处理 |
| 大运推算 | `bazi/dayun.py` | 阳年男/阴年女顺排、反之逆排；起运岁数 = 距最近「节」天数 ÷ 3；十步十年大运序列 |
| 流年分析 | `bazi/liunian.py` | 任意年份流年干支（立春界）；以日主为参照输出四柱/流年/大运十神关系 |
| 黄历查询 | `bazi/almanac.py` | 指定日期干支、建除十二神、宜忌、每日胎神方位 |
| 内核 | `bazi/core.py` | 六十甲子、五虎遁/五鼠遁、立春年柱校正、十神、建除、宜忌、胎神（纯函数，零依赖） |
| 历法底座 | `bazi/calendar.py` | 封装 `cnlunar`/`lunardate`，提供日干支、节气月支、立春日期、农历显示 |

## 关键正确性设计

- **年柱以「立春」为界**，非农历正月初一（常见 bug：2026-02-10 年柱应为丙午，而非春节后的乙巳）。
- **月柱以「节气」为界**，月干按五虎遁推导；偏移量按 12 个月为一周天取模，避免子/丑月错位（曾导致毛泽东月柱误算为壬子，实为甲子）。
- **真太阳时** = 标准时 + (经度−标准经线)×4 分钟 − 时差方程，跨日自动顺延。
- **起运岁数** 取出生到本命月支对应「节」的天数（顺排取后、逆排取前），三天为一岁。
- 建除十二神与第三方库 `cnlunar` 交叉校验一致。

## 安装

```bash
python -m venv venv && venv/Scripts/pip install cnlunar lunardate pytest
```

## 使用

### 命令行（JSON 输出）

```bash
# 四柱 + 大运（公历）
python run.py --birth 1990-05-20 --hour 10 --gender male

# 农历输入（含闰月）
python run.py --birth 1990-04-26 --calendar lunar --gender female

# 附带流年分析（36 岁看 2026 年）
python run.py --birth 1990-05-20 --gender male --age 36 --flow-year 2026

# 单日黄历查询
python run.py --almanac 2026-07-24
```

### 代码调用

```python
from bazi import analyze_bazi, query_almanac, to_json

r = analyze_bazi({
    "year": 1990, "month": 5, "day": 20, "hour": 10, "minute": 0,
    "gender": "male", "flow_year": 2026, "age": 36,
})
print(to_json(r, indent=2))          # 结构化结果

a = query_almanac("2026-07-24")     # 黄历
print(a["ganzhi"], a["yiji"], a["taishen"])
```

## 测试

```bash
pytest tests/ -q
```

覆盖：三位历史权威八字（毛泽东/蒋介石/邓小平）、立春年界边界、晚子时跨日、月干模 12 边界、五鼠遁、十神关系、黄历与第三方库一致性、农历闰月、真太阳时经度偏移、JSON 可序列化等，共 15 例，全部通过。

## 输出格式

所有接口返回 / 输出标准 Python `dict`，`to_json` 以 `ensure_ascii=False` 序列化为中文可读 JSON，便于接口对接与结果校验。

## 声明

本系统基于传统历法算法实现，用于文化研究与程序化校验，**不构成任何命理断言或人生建议**。
