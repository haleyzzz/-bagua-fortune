/*
 * engine.js — 纯前端八字/黄历引擎 (UMD)
 * 逻辑平移自 bazi-system (Python)，历法数据来自 data.js (FORTUNE_DATA, 源自 lunardate/cnlunar 真值)。
 * 浏览器: 先加载 data.js 再加载本文件, 使用 window.BZ。
 * Node: require('./engine.js')。
 */
(function (global) {
  'use strict';

  var DATA = (typeof FORTUNE_DATA !== 'undefined')
    ? FORTUNE_DATA
    : (typeof require !== 'undefined' ? require('./data.js') : null);

  // ───────────────────────── 基础表 (对齐 core.py) ─────────────────────────
  var GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  var ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  var GAN_WUXING = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"];
  var GAN_YINYANG = ["阳", "阴", "阳", "阴", "阳", "阴", "阳", "阴", "阳", "阴"];
  var ZHI_WUXING = ["水", "土", "木", "木", "土", "火", "火", "土", "金", "金", "土", "水"];
  var ZHI_YINYANG = ["阳", "阴", "阳", "阴", "阳", "阴", "阳", "阴", "阳", "阴", "阳", "阴"];
  var PRODUCE = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
  var KE = { "木": "土", "土": "水", "水": "火", "火": "金", "金": "木" };
  var GANZHI = (function () { var a = []; for (var i = 0; i < 60; i++) a.push([i % 10, i % 12]); return a; })();
  function gzIndex(s, b) { for (var i = 0; i < 60; i++) if (GANZHI[i][0] === s && GANZHI[i][1] === b) return i; return -1; }

  // ───────────────────────── 遁法 (对齐 core.py) ─────────────────────────
  var MONTH_BASE_STEM = { 0: 2, 1: 4, 2: 6, 3: 8, 4: 0, 5: 2, 6: 4, 7: 6, 8: 8, 9: 0 };
  function monthStem(yearStem, monthBranch) {
    var base = MONTH_BASE_STEM[yearStem];
    // 注意: JS 的 % 对负数返回负值, 与 Python 不同, 需 +12 归正
    return (base + (((monthBranch - 2) % 12 + 12) % 12)) % 10;
  }
  var HOUR_BASE_STEM = { 0: 0, 1: 2, 2: 4, 3: 6, 4: 8, 5: 0, 6: 2, 7: 4, 8: 6, 9: 8 };
  function hourStem(dayStem, hourBranch) {
    return (HOUR_BASE_STEM[dayStem] + hourBranch) % 10;
  }

  // ───────────────────────── 年柱(立春界) (对齐 core.year_ganzhi) ─────────────────────────
  function yearGanzhi(solarDate, lichun) {
    var y = solarDate.getFullYear();
    var gzYear = (solarDate >= lichun) ? y : y - 1;
    var idx = (gzYear - 4) % 60;
    return [idx % 10, idx % 12];
  }

  // ───────────────────────── 时辰 ─────────────────────────
  function shichenBranch(hour) {
    var h = hour % 24;
    if (h === 23 || h === 0) return 0;
    return (h + 1) / 2 | 0;
  }
  function isLateZishi(hour) { return hour === 23; }

  // ───────────────────────── 十神 (修正: 同五行→比劫) ─────────────────────────
  function tenGod(other, dayMaster) {
    if (GAN_WUXING[other] === GAN_WUXING[dayMaster]) {
      if (other === dayMaster || GAN_YINYANG[other] === GAN_YINYANG[dayMaster]) return "比肩";
      return "劫财";
    }
    var ow = GAN_WUXING[dayMaster], ox = GAN_WUXING[other];
    var same = GAN_YINYANG[other] === GAN_YINYANG[dayMaster];
    if (PRODUCE[ox] === ow) return same ? "偏印" : "正印";
    if (PRODUCE[ow] === ox) return same ? "食神" : "伤官";
    if (KE[ox] === ow) return same ? "七杀" : "正官";
    if (KE[ow] === ox) return same ? "偏财" : "正财";
    return "未知";
  }

  // ───────────────────────── 建除 / 宜忌 / 胎神 (对齐 core.py) ─────────────────────────
  var JIANCHU = ["建", "除", "满", "平", "定", "执", "破", "危", "成", "收", "开", "闭"];
  function jianchuName(monthBranch, dayBranch) {
    return JIANCHU[((dayBranch - monthBranch) % 12 + 12) % 12];
  }
  var YIJI = {
    "建": [["出行", "祈福", "动土", "订盟", "纳采", "嫁娶", "安机械", "开市", "立券", "交易"], ["安葬", "行丧"]],
    "除": [["祭祀", "祈福", "嫁娶", "移徙", "开市", "出行", "解除", "疗病", "扫舍"], ["求仕", "上任"]],
    "满": [["祭祀", "祈福", "开市", "交易", "求财", "会友"], ["动土", "安葬", "移徙", "入宅", "破土"]],
    "平": [["祭祀", "修造", "动土", "嫁娶", "开市", "安床"], ["祈福", "求嗣", "词讼"]],
    "定": [["祭祀", "祈福", "嫁娶", "造屋", "装修", "入学", "纳畜"], ["词讼", "出行", "医疗", "疗病"]],
    "执": [["造屋", "修造", "嫁娶", "捕捉", "收购", "纳财"], ["开市", "移徙", "出行", "入宅"]],
    "破": [["破屋", "坏垣", "求医", "治病"], ["诸事不宜", "嫁娶", "动土", "开市", "出行"]],
    "危": [["安床", "祭祀", "祈福", "捕捉"], ["出行", "移徙", "入宅", "嫁娶", "登高"]],
    "成": [["嫁娶", "开市", "交易", "立券", "出行", "入学", "安床", "纳采"], ["词讼", "安葬", "修坟"]],
    "收": [["嫁娶", "纳采", "订盟", "开市", "交易", "立券", "捕捉", "纳财"], ["放债", "出行", "入宅", "安葬"]],
    "开": [["祭祀", "祈福", "开市", "交易", "入学", "动土", "出行", "纳财"], ["安葬", "放债", "针灸"]],
    "闭": [["安葬", "筑堤", "修仓", "补垣", "塞穴"], ["开市", "出行", "求医", "嫁娶", "针灸", "动土"]]
  };
  function yijiFromJianchu(name) { var v = YIJI[name] || [[], []]; return { "宜": v[0], "忌": v[1] }; }
  var GAN_TAISHEN = ["门", "户", "灶", "厕", "房", "床", "碓磨", "碓磨", "仓库", "仓库"];
  var ZHI_TAISHEN = ["碓磨", "厕", "门", "床", "灶", "房", "床", "仓", "栖", "栖", "房", "灶"];
  function taishen(ds, db) {
    return { "天干方位": GAN_TAISHEN[ds], "地支方位": ZHI_TAISHEN[db], "方位": GAN_TAISHEN[ds] + "·" + ZHI_TAISHEN[db] };
  }
  function gzStr(s, b) { return GAN[s] + ZHI[b]; }

  // ───────────────────────── 历法底层 (对齐 calendar.py, 用 FORTUNE_DATA) ─────────────────────────
  function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
  function jieqiDate(y, idx) {
    var v = DATA.jieqi[y][idx];
    return new Date(y, Math.floor(v / 100) - 1, v % 100);
  }
  function lichunOf(y) { return jieqiDate(y, 2); }

  // 春节公历日 (缓存)
  var _springCache = {};
  function lunarNewYearSolar(y) {
    if (_springCache[y]) return _springCache[y];
    var d = new Date(1900, 0, 31); // 1900 春节 1/31
    for (var yy = 1900; yy < y; yy++) {
      var e = DATA.lunar[yy - DATA.lunar_year_start];
      var days = 0; for (var i = 0; i < e.months.length; i++) days += e.months[i];
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
    }
    _springCache[y] = d; return d;
  }
  // 农历月索引 k -> 农历月号 (闰月用负值表示)
  function lunarMonthLabel(e, k) {
    if (e.leap > 0) {
      if (k < e.leap - 1) return k + 1;
      if (k === e.leap - 1) return e.leap;       // 正常 leap 月
      if (k === e.leap) return -e.leap;          // 闰月
      return k;
    }
    return k + 1;
  }
  function findLunarMonthIndex(e, month, isLeap) {
    for (var k = 0; k < e.months.length; k++) {
      var m = lunarMonthLabel(e, k);
      if (isLeap && m === -month) return k;
      if (!isLeap && m === month) return k;
    }
    return -1;
  }
  function lunarToSolar(year, month, day, isLeap) {
    var idx = year - DATA.lunar_year_start;
    if (idx < 0 || idx >= DATA.lunar.length) throw new Error("农历年份超出范围(1900-2098)");
    var e = DATA.lunar[idx];
    var k = findLunarMonthIndex(e, month, isLeap);
    if (k < 0) throw new Error("农历月份不存在");
    var offset = day - 1;
    for (var i = 0; i < k; i++) offset += e.months[i];
    var ny = lunarNewYearSolar(year);
    return new Date(ny.getFullYear(), ny.getMonth(), ny.getDate() + offset);
  }
  function solarToLunar(solar) {
    var y = solar.getFullYear();
    var ly = y, s0 = lunarNewYearSolar(y);
    if (solar < s0) { ly = y - 1; s0 = lunarNewYearSolar(y - 1); }
    var e = DATA.lunar[ly - DATA.lunar_year_start];
    var offset = Math.round((solar - s0) / 86400000);
    var acc = 0, mk = 0;
    for (var k = 0; k < e.months.length; k++) {
      if (offset < acc + e.months[k]) { mk = k; break; }
      acc += e.months[k];
    }
    var dayInMonth = offset - acc + 1;
    var lm = lunarMonthLabel(e, mk);
    var isLeap = lm < 0; if (isLeap) lm = -lm;
    return { year: ly, month: lm, day: dayInMonth, isLeap: isLeap };
  }
  // 日干支 (对齐验证公式: 1900-01-01=甲戌(序号10))
  function dayGanzhi(solar) {
    var t0 = Date.UTC(1900, 0, 1);
    var t = Date.UTC(solar.getFullYear(), solar.getMonth(), solar.getDate());
    var diff = Math.round((t - t0) / 86400000);
    var idx = ((10 + diff) % 60 + 60) % 60;
    return [idx % 10, idx % 12];
  }
  // 月支 (节气界, 对齐 cnlunar month8Char 支)
  var JIE_MONTH = [[22, 0, -1], [0, 1, 0], [2, 2, 0], [4, 3, 0], [6, 4, 0], [8, 5, 0], [10, 6, 0], [12, 7, 0], [14, 8, 0], [16, 9, 0], [18, 10, 0], [20, 11, 0], [22, 0, 0]];
  function monthBranch(solar) {
    var y = solar.getFullYear();
    var nodes = [];
    for (var i = 0; i < JIE_MONTH.length; i++) {
      var j = JIE_MONTH[i];
      var ny = (j[2] === -1) ? y - 1 : y;
      var v = DATA.jieqi[ny][j[0]];
      nodes.push({ date: new Date(ny, Math.floor(v / 100) - 1, v % 100), mb: j[1] });
    }
    nodes.sort(function (a, b) { return a.date - b.date; });
    var cur = nodes[0].mb;
    for (var n = 0; n < nodes.length; n++) {
      if (solar >= nodes[n].date) cur = nodes[n].mb; else break;
    }
    return cur;
  }
  // 历法信息 (对齐 calendar.get_cn_info)
  function getCnInfo(solar) {
    var d = dayGanzhi(solar);
    var mb = monthBranch(solar);
    var lc = lichunOf(solar.getFullYear());
    var ld = solarToLunar(solar);
    var lmCn = (ld.isLeap ? "闰" : "") + ZHI[(ld.month + 1) % 12];
    var lunarDisplay = ld.year + "年" + lmCn + "月" + ld.day + "日";
    return {
      day_stem: d[0], day_branch: d[1], month_branch: mb,
      lichun: lc, lunar_display: lunarDisplay
    };
  }

  // ───────────────────────── 四柱 (对齐 pillars.py) ─────────────────────────
  function equationOfTime(d) {
    var N = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);
    var B = 2 * Math.PI * (N - 1) / 365.24;
    return 229.18 * (0.000075 + 0.001868 * Math.cos(B) - 0.032077 * Math.sin(B) - 0.014615 * Math.cos(2 * B) - 0.040849 * Math.sin(2 * B));
  }
  function trueSolarTime(birth, hour, minute, longitude, tzOffset) {
    var meridian = tzOffset * 15.0;
    var eot = equationOfTime(birth);
    var correction = (longitude - meridian) * 4.0 - eot;
    var total = hour * 60 + minute + correction;
    var dayDelta = 0;
    while (total < 0) { total += 1440; dayDelta -= 1; }
    while (total >= 1440) { total -= 1440; dayDelta += 1; }
    var td = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate() + dayDelta);
    var th = Math.floor(total / 60);
    var tm = Math.round(total - th * 60);
    if (tm === 60) { tm = 0; th += 1; }
    return { date: td, hour: th, minute: tm };
  }
  function buildPillars(year, month, day, hour, minute, calType, gender, longitude, tzOffset, isLeap) {
    calType = calType || "solar"; gender = gender || "male";
    longitude = (longitude == null) ? 120.0 : longitude;
    tzOffset = (tzOffset == null) ? 8 : tzOffset;
    var originalSolar, inputKind;
    if (calType === "lunar") {
      originalSolar = lunarToSolar(year, month, day, isLeap);
      inputKind = "农历";
    } else {
      originalSolar = new Date(year, month - 1, day);
      inputKind = "公历";
    }
    var ts = trueSolarTime(originalSolar, hour, minute, longitude, tzOffset);
    var dayRoll = 0;
    if (isLateZishi(ts.hour)) dayRoll = 1;
    var pillarDate = new Date(ts.date.getFullYear(), ts.date.getMonth(), ts.date.getDate() + dayRoll);
    var info = getCnInfo(pillarDate);
    var ys = info.lichun ? yearGanzhi(pillarDate, info.lichun) : yearGanzhi(pillarDate, lichunOf(pillarDate.getFullYear()));
    var yb = ys[1];
    var ms = monthStem(ys[0], info.month_branch);
    var mb = info.month_branch;
    var ds = info.day_stem, db = info.day_branch;
    var hb = shichenBranch(ts.hour);
    var hs = hourStem(ds, hb);
    return {
      _birth_solar: originalSolar,
      _pillar_date: pillarDate,
      input: {
        kind: inputKind,
        solar: originalSolar.getFullYear() + "-" + pad(originalSolar.getMonth() + 1) + "-" + pad(originalSolar.getDate()),
        time: pad(hour) + ":" + pad(minute),
        longitude: longitude, tz_offset: tzOffset
      },
      true_solar_time: {
        date: ts.date.getFullYear() + "-" + pad(ts.date.getMonth() + 1) + "-" + pad(ts.date.getDate()),
        hour: ts.hour, minute: ts.minute,
        late_zishi: !!dayRoll,
        pillar_date: pillarDate.getFullYear() + "-" + pad(pillarDate.getMonth() + 1) + "-" + pad(pillarDate.getDate())
      },
      lunar_display: info.lunar_display,
      animal: ZHI[yb],
      pillars: {
        year: { stem: ys[0], branch: yb, gz: gzStr(ys[0], yb) },
        month: { stem: ms, branch: mb, gz: gzStr(ms, mb) },
        day: { stem: ds, branch: db, gz: gzStr(ds, db) },
        hour: { stem: hs, branch: hb, gz: gzStr(hs, hb) }
      }
    };
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // ───────────────────────── 大运 (对齐 dayun.py) ─────────────────────────
  function dayunDirection(yearStem, gender) {
    var yangYear = GAN_YINYANG[yearStem] === "阳";
    var male = gender === "male";
    var forward = (yangYear && male) || (!yangYear && !male);
    return forward ? 1 : -1;
  }
  var JIEQI_INDEX = { 2: 2, 3: 4, 4: 6, 5: 8, 6: 10, 7: 12, 8: 14, 9: 16, 10: 18, 11: 20, 0: 22, 1: 0 };
  function jieqiTarget(birth, monthBranch, direction) {
    var jqIdx = (direction === 1) ? JIEQI_INDEX[(monthBranch + 1) % 12] : JIEQI_INDEX[monthBranch];
    var thisTermsYear = birth.getFullYear();
    var target = jieqiDate(thisTermsYear, jqIdx);
    if (direction === 1) {
      if (target > birth) return target;
      return jieqiDate(thisTermsYear + 1, jqIdx);
    } else {
      if (target < birth) return target;
      return jieqiDate(thisTermsYear - 1, jqIdx);
    }
  }
  function computeDayun(birthSolar, yearStem, monthStemIdx, monthBranch, gender, nSteps) {
    nSteps = nSteps || 8;
    var direction = dayunDirection(yearStem, gender);
    var target = jieqiTarget(birthSolar, monthBranch, direction);
    var days = Math.abs(Math.round((target - birthSolar) / 86400000));
    var startAgeYears = days / 3.0;
    var fullYears = Math.floor(days / 3);
    var remDays = days % 3;
    var startAgeDisplay = fullYears + "岁" + (remDays * 4) + "个月";
    var monthIdx = gzIndex(monthStemIdx, monthBranch);
    var seq = [];
    for (var k = 1; k <= nSteps; k++) {
      var gzI = ((monthIdx + direction * k) % 60 + 60) % 60;
      var s = GANZHI[gzI][0], b = GANZHI[gzI][1];
      var start = fullYears + (k - 1) * 10;
      seq.push({
        step: k, gz: gzStr(s, b), stem: s, branch: b,
        start_age: start, start_age_decimal: Math.round((startAgeYears + (k - 1) * 10) * 100) / 100,
        end_age: start + 9
      });
    }
    return {
      direction: direction === 1 ? "顺排" : "逆排",
      days_to_jieqi: days,
      start_age_decimal: Math.round(startAgeYears * 100) / 100,
      start_age_display: startAgeDisplay,
      sequence: seq
    };
  }

  // ───────────────────────── 流年 (对齐 liunian.py) ─────────────────────────
  var SHEN_MEANING = {
    "比肩": "同辈、竞争、自我意识、合作分担", "劫财": "兄弟、朋友、破耗、资源争夺",
    "食神": "才华、口福、泄秀生财、女命子女", "伤官": "才艺、叛逆、克官显能、男命子女",
    "正财": "稳定收入、务实、男命妻星", "偏财": "横财、父亲、机遇、外缘人脉",
    "正官": "事业、名誉、约束规范、女命夫星", "七杀": "压力、权威、魄力挑战、偏夫偏官",
    "正印": "学识、贵人、庇护、母星", "偏印": "偏业、冷门、孤识、思虑过甚"
  };
  function flowYearGz(fy) { var idx = (fy - 4) % 60; return [idx % 10, idx % 12]; }
  function shenEntry(stem, dayMaster) {
    var name = tenGod(stem, dayMaster);
    return { stem: stem, stem_char: GAN[stem], "十神": name, "五行": GAN_WUXING[stem], "阴阳": GAN_YINYANG[stem], "含义": SHEN_MEANING[name] || "" };
  }
  function analyzeLiu(flowYear, dayMasterStem, pillars, currentDayun) {
    var fs = flowYearGz(flowYear);
    var flowShen = shenEntry(fs[0], dayMasterStem);
    var r = {
      flow_year: flowYear, flow_gz: gzStr(fs[0], fs[1]),
      flow_stem: fs[0], flow_branch: fs[1],
      day_master_stem: dayMasterStem, day_master_char: GAN[dayMasterStem],
      flow_shen: flowShen
    };
    if (pillars) {
      var pp = pillars.pillars;
      r.year_shen = shenEntry(pp.year.stem, dayMasterStem);
      r.month_shen = shenEntry(pp.month.stem, dayMasterStem);
      r.hour_shen = shenEntry(pp.hour.stem, dayMasterStem);
      r.self_shen = { stem: dayMasterStem, stem_char: GAN[dayMasterStem], "十神": "日主", "五行": GAN_WUXING[dayMasterStem], "阴阳": GAN_YINYANG[dayMasterStem], "含义": "命主自身" };
    }
    if (currentDayun) {
      r.dayun_shen = shenEntry(currentDayun.stem, dayMasterStem);
      r.dayun_gz = gzStr(currentDayun.stem, currentDayun.branch);
    }
    return r;
  }

  // ───────────────────────── 黄历 (对齐 almanac.py) ─────────────────────────
  function queryAlmanac(solarStr) {
    var p = solarStr.split("-");
    var solar = new Date(+p[0], +p[1] - 1, +p[2]);
    var info = getCnInfo(solar);
    var ys = yearGanzhi(solar, info.lichun);
    var ms = monthStem(ys[0], info.month_branch);
    var ds = info.day_stem, db = info.day_branch;
    var jc = jianchuName(info.month_branch, db);
    var yj = yijiFromJianchu(jc);
    var tai = taishen(ds, db);
    return {
      solar: solarStr,
      lunar_display: info.lunar_display,
      animal: ZHI[ys[1]],
      ganzhi: { year: gzStr(ys[0], ys[1]), month: gzStr(ms, info.month_branch), day: gzStr(ds, db) },
      jianchu: { name: jc, index: JIANCHU.indexOf(jc) },
      yiji: yj,
      taishen: tai
    };
  }
  // 月历: 返回该公历月每天黄历概要
  function getMonthAlmanac(year, month) {
    var dim = daysInMonth(year, month);
    var out = [];
    for (var d = 1; d <= dim; d++) {
      var solarStr = year + "-" + pad(month) + "-" + pad(d);
      var a = queryAlmanac(solarStr);
      out.push({
        day: d, solar: solarStr,
        gz: a.ganzhi.day, lunar_display: a.lunar_display,
        jianchu: a.jianchu.name, yi: a.yiji["宜"], ji: a.yiji["忌"]
      });
    }
    return out;
  }

  // ───────────────────────── 整合 API (对齐 api.analyze_bazi) ─────────────────────────
  function analyzeBazi(p) {
    var bp = buildPillars(p.year, p.month, p.day, p.hour || 0, p.minute || 0,
      p.calendar_type || "solar", p.gender || "male",
      p.longitude == null ? 120 : p.longitude, p.tz_offset == null ? 8 : p.tz_offset,
      p.is_leap || false);
    var pp = bp.pillars;
    var dayun = computeDayun(bp._birth_solar, pp.year.stem, pp.month.stem, pp.month.branch, p.gender || "male");
    var liu = null;
    if (p.flow_year) {
      var currentDayun = null;
      if (p.age != null) {
        for (var i = 0; i < dayun.sequence.length; i++) {
          var s = dayun.sequence[i];
          if (p.age >= s.start_age && p.age <= s.end_age) { currentDayun = { stem: s.stem, branch: s.branch }; break; }
        }
      }
      liu = analyzeLiu(p.flow_year, pp.day.stem, bp, currentDayun);
    }
    return { pillars: bp, dayun: dayun, liunian: liu };
  }

  var BZ = {
    GAN: GAN, ZHI: ZHI, JIANCHU: JIANCHU,
    gzStr: gzStr, tenGod: tenGod, monthStem: monthStem, hourStem: hourStem,
    dayGanzhi: dayGanzhi, monthBranch: monthBranch, lichunOf: lichunOf,
    lunarToSolar: lunarToSolar, solarToLunar: solarToLunar,
    buildPillars: buildPillars, computeDayun: computeDayun,
    analyzeLiu: analyzeLiu, queryAlmanac: queryAlmanac,
    getMonthAlmanac: getMonthAlmanac, analyzeBazi: analyzeBazi,
    shichenBranch: shichenBranch, jianchuName: jianchuName
  };

  global.BZ = BZ;
  if (typeof module !== 'undefined' && module.exports) module.exports = BZ;
})(typeof window !== 'undefined' ? window : globalThis);
