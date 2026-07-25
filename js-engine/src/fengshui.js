/*
 * fengshui.js — 风水择吉引擎 (UMD)
 * 玄空飞星(运盘+山向飞星+年星) + 奇门遁甲(局数+三奇六仪+九星八门八神 转盘) + 择日(黄历宜忌筛选)。
 * 浏览器: window.FENGSHUI   Node: require('./fengshui.js')
 * 说明: 飞星/奇门遵循传统规则推算，供学习参考；非专业堪舆定论。
 */
(function (global) {
  'use strict';

  var GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  var ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  var ZHI_WUXING = { "子": "水", "丑": "土", "寅": "木", "卯": "木", "辰": "土", "巳": "火", "午": "火", "未": "土", "申": "金", "酉": "金", "戌": "土", "亥": "水" };
  var PRODUCE = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
  var KE = { "木": "土", "土": "水", "水": "火", "火": "金", "金": "木" };

  // 九宫洛书: 中5, 乾6(西北), 兑7(西), 艮8(东北), 离9(南), 坎1(北), 坤2(西南), 震3(东), 巽4(东南)
  var GONG = [5, 6, 7, 8, 9, 1, 2, 3, 4]; // 顺飞次序(中→乾→兑→艮→离→坎→坤→震→巽)
  var GONG_NAME = { 5: "中宫", 6: "乾·西北", 7: "兑·西", 8: "艮·东北", 9: "离·南", 1: "坎·北", 2: "坤·西南", 3: "震·东", 4: "巽·东南" };
  var GONG_DIR = { 5: "中", 6: "西北", 7: "西", 8: "东北", 9: "南", 1: "北", 2: "西南", 3: "东", 4: "东南" };

  /* ============ 玄空飞星 ============ */
  // 三元九运: 1864 起, 每运20年; 9运循环
  function yunOf(year) {
    var period = Math.floor((year - 1864) / 20);
    var yun = (period % 9) + 1;
    var yuan = period < 3 ? "上元" : (period < 6 ? "中元" : "下元");
    return { yun: yun, yuan: yuan };
  }
  // 飞布一盘: 中宫放 center, 顺/逆 飞九宫
  function fly(center, reverse) {
    var pan = {};
    for (var i = 0; i < 9; i++) {
      var g = GONG[reverse ? (8 - i) : i];
      var star = ((center - 1 + i) % 9 + 9) % 9 + 1;
      pan[g] = star;
    }
    return pan;
  }
  // 24 山三元龙阴阳 (天/人/地元龙)
  // 天元: 子午卯酉阳, 乾巽艮坤阴; 地元: 甲庚丙壬阳, 辰戌丑未阴; 人元: 寅申巳亥阳, 癸丁乙辛阴
  var SHAN_YINYANG = {
    "子": 1, "午": 1, "卯": 1, "酉": 1, "乾": -1, "巽": -1, "艮": -1, "坤": -1,
    "甲": 1, "庚": 1, "丙": 1, "壬": 1, "辰": -1, "戌": -1, "丑": -1, "未": -1,
    "寅": 1, "申": 1, "巳": 1, "亥": 1, "癸": -1, "丁": -1, "乙": -1, "辛": -1
  };
  // 山→宫(地支序数映射): 子1坎... 乾6等
  var SHAN_GONG = {
    "子": 1, "丑": 8, "寅": 3, "卯": 3, "辰": 3, "巳": 4, "午": 9, "未": 2, "申": 7, "酉": 7, "戌": 7, "亥": 4,
    "乾": 6, "巽": 4, "艮": 8, "坤": 2, "甲": 3, "丙": 9, "庚": 7, "壬": 1, "癸": 1, "丁": 9, "乙": 3, "辛": 7,
    "辰2": 3, "戌2": 7, "丑2": 8, "未2": 2
  };
  function feixing(year, sitShan, faceShan) {
    // 坐山/朝向: 如 "子"/"午"
    var y = yunOf(year);
    var yunPan = fly(y.yun, false); // 运星入中 顺飞
    var result = {
      yun: y.yun, yuan: y.yuan, yunPan: yunPan,
      shanPan: null, xiangPan: null, sitShan: sitShan, faceShan: faceShan
    };
    if (sitShan && SHAN_YINYANG[sitShan] && faceShan && SHAN_YINYANG[faceShan]) {
      var sitGong = SHAN_GONG[sitShan];
      var faceGong = SHAN_GONG[faceShan];
      var shanCenter = yunPan[sitGong];   // 坐山宫的运星 = 山星入中
      var xiangCenter = yunPan[faceGong];  // 朝向宫的运星 = 向星入中
      var shanRev = SHAN_YINYANG[sitShan] < 0;
      var xiangRev = SHAN_YINYANG[faceShan] < 0;
      result.shanPan = fly(shanCenter, shanRev);
      result.xiangPan = fly(xiangCenter, xiangRev);
    }
    // 年星入中(流年飞星): 年紫白 =(year-3)%9 (1..9, 0→9)
    var ys = ((year - 3) % 9 + 9) % 9; if (ys === 0) ys = 9;
    result.yearStar = ys;
    result.yearPan = fly(ys, false);
    return result;
  }

  /* ============ 奇门遁甲 ============ */
  // 24 节气公历近似 (mm-dd)
  var JIEQI_MD = [
    ["小寒", 1, 6], ["大寒", 1, 20], ["立春", 2, 4], ["雨水", 2, 19], ["惊蛰", 3, 6], ["春分", 3, 21],
    ["清明", 4, 5], ["谷雨", 4, 20], ["立夏", 5, 6], ["小满", 5, 21], ["芒种", 6, 6], ["夏至", 6, 21],
    ["小暑", 7, 7], ["大暑", 7, 23], ["立秋", 8, 8], ["处暑", 8, 23], ["白露", 9, 8], ["秋分", 9, 23],
    ["寒露", 10, 8], ["霜降", 10, 24], ["立冬", 11, 8], ["小雪", 11, 22], ["大雪", 12, 7], ["冬至", 12, 22]
  ];
  // 阴阳遁十八局 [上,中,下]
  var JU_TABLE = {
    "冬至": [1, 7, 4], "小寒": [2, 8, 5], "大寒": [3, 9, 6], "立春": [8, 5, 2], "雨水": [9, 6, 3], "惊蛰": [1, 7, 4],
    "春分": [3, 9, 6], "清明": [4, 1, 7], "谷雨": [5, 2, 8], "立夏": [4, 1, 7], "小满": [5, 2, 8], "芒种": [6, 3, 9],
    "夏至": [9, 3, 6], "小暑": [8, 2, 5], "大暑": [7, 1, 4], "立秋": [2, 5, 8], "处暑": [1, 4, 7], "白露": [9, 3, 6],
    "秋分": [7, 1, 4], "寒露": [6, 9, 3], "霜降": [5, 8, 2], "立冬": [6, 9, 3], "小雪": [5, 8, 2], "大雪": [4, 7, 1]
  };
  var STAR = ["蓬", "芮", "冲", "辅", "禽", "心", "柱", "任", "英"]; // 九星(顺序对应宫)
  var STAR_FULL = ["天蓬", "天芮", "天冲", "天辅", "天禽", "天心", "天柱", "天任", "天英"];
  var DOOR = ["休", "死", "伤", "杜", "景", "惊", "开", "生"]; // 八门(对应宫)
  var GOD = ["值符", "螣蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天"];
  // 旬首 → 星/门 映射 (甲子戊→蓬/休 ...)
  var XUN_STAR = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }; // 甲子戊,甲戌己,甲申庚,甲午辛,甲辰壬,甲寅癸
  var XUN_DOOR = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };

  function currentJieqi(month, day) {
    var best = "冬至", bestDiff = 999;
    for (var i = 0; i < JIEQI_MD.length; i++) {
      var j = JIEQI_MD[i];
      var d = j[1] * 100 + j[2];
      var cur = month * 100 + day;
      var diff = cur - d;
      if (diff >= 0 && diff < bestDiff) { bestDiff = diff; best = j[0]; }
    }
    return best;
  }

  function qimen(year, month, day, hour) {
    // 节气 + 三元
    var jq = currentJieqi(month, day);
    var jqIdx = JIEQI_MD.findIndex(function (x) { return x[0] === jq; });
    var dayIn = (month * 100 + day) - (JIEQI_MD[jqIdx][1] * 100 + JIEQI_MD[jqIdx][2]);
    var yuan; // 0上 1中 2下
    if (dayIn < 5) yuan = 0; else if (dayIn < 10) yuan = 1; else yuan = 2;
    // 阳遁: 冬至(12/22)~夏至(6/21) 之间
    var isYang = isYangPeriod(month, day);
    var juArr = JU_TABLE[jq];
    var ju = juArr[yuan]; // 1..9 局
    var reverse = !isYang; // 阴遁逆飞

    // 时辰干支
    var totalDays = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(2000, 0, 1)) / 86400000);
    var dayGZ = ((totalDays % 60) + 60) % 60; // 甲子=0
    var dayStem = dayGZ % 10, dayBranch = dayGZ % 12;
    var hb = (hour === 23 || hour === 0) ? 0 : Math.floor((hour + 1) / 2);
    var hourGZ = ((dayStem % 5) * 12 + hb) % 60; // 五鼠遁简化
    var hourStem = hourGZ % 10, hourBranch = hourGZ % 12;

    // 旬首: floor(hourGZ/10) -> 0..5 (甲子/甲戌/甲申/甲午/甲辰/甲寅)
    var xun = Math.floor(hourGZ / 10);
    // 旬首对应的"仪": 戊己庚辛壬癸 (甲子→戊, 甲戌→己, 甲申→庚, 甲午→辛, 甲辰→壬, 甲寅→癸)
    var xunGanChar = GAN[(4 + xun) % 10];
    // 旬首全名: 甲 + 地支(子戌申午辰寅)
    var xunZhi = ZHI[(12 - 2 * xun) % 12];
    // 三奇六仪 地盘: 戊己庚辛壬癸丁丙乙 入中顺/逆飞
    var order = [4, 5, 6, 7, 8, 9, 2, 3, 1]; // 戊(4)己(5)庚(6)辛(7)壬(8)癸(9)丁(2)丙(3)乙(1)
    var di = {};
    for (var i = 0; i < 9; i++) {
      var g = GONG[reverse ? (8 - i) : i];
      di[g] = GAN[order[i]]; // 地盘干
    }
    // 值符星: 旬首对应的 九星 (甲子戊→蓬... 以 旬序 直接映射九星顺序)
    var zhiStarIdx = xun % 9; // 0蓬..5禽(寄)..
    // 值符落宫: 地盘中 旬首"仪"(戊己庚辛壬癸) 所在宫
    var zhiGong = 5;
    for (var g2 = 1; g2 <= 9; g2++) { if (di[g2] === xunGanChar) { zhiGong = g2; break; } }
    // 九星 天盘: 从值符落宫起, 依宫序顺/逆飞 (蓬→芮→冲→辅→禽→心→柱→任→英 循环)
    var tian = {};
    for (var i2 = 0; i2 < 9; i2++) {
      var gg = GONG[reverse ? (8 - i2) : i2];
      tian[gg] = STAR_FULL[(zhiStarIdx + i2) % 9];
    }
    // 八门: 值使 = 旬首对应门, 落宫 = 值符落宫 顺推到时支
    var zhiDoorIdx = xun % 8;
    var door0 = (zhiGong - 1 + hourBranch) % 9 + 1; // 简化为 时辰顺推
    var DOORSEQ = "开死惊休生伤杜景";
    var men = {};
    for (var i3 = 0; i3 < 9; i3++) {
      var gg3 = GONG[reverse ? (8 - i3) : i3];
      men[gg3] = DOORSEQ[(door0 - 1 + i3) % 8];
    }
    // 八神: 值符起 值符落宫, 顺/逆
    var shen = {};
    for (var i4 = 0; i4 < 9; i4++) {
      var gg4 = GONG[reverse ? (8 - i4) : i4];
      shen[gg4] = GOD[i4 % 8];
    }
    return {
      jieqi: jq, yuan: ["上元", "中元", "下元"][yuan], isYang: isYang, ju: ju,
      dayGZ: GAN[dayStem] + ZHI[dayBranch], hourGZ: GAN[hourStem] + ZHI[hourBranch],
      xun: "甲" + xunZhi + "旬首", di: di, tian: tian, men: men, shen: shen, zhiGong: zhiGong
    };
  }
  function isYangPeriod(month, day) {
    var v = month * 100 + day;
    // 阳遁: 12/22 ~ 次年6/21
    if (v >= 1222 || v <= 621) return true;
    return false;
  }

  /* ============ 择日 (黄历宜忌筛选) ============ */
  function zeri(year, month, purpose, queryAlmanacFn) {
    if (!queryAlmanacFn) return [];
    var dim = new Date(year, month, 0).getDate();
    var list = [];
    for (var d = 1; d <= dim; d++) {
      var solar = year + "-" + (month < 10 ? "0" : "") + month + "-" + (d < 10 ? "0" : "") + d;
      try {
        var a = queryAlmanacFn(solar);
        var yi = a.yiji["宜"].join("");
        var jc = a.jianchu.name;
        var ok = yi.indexOf(purpose) >= 0;
        list.push({ solar: solar, day: d, jianchu: jc, yi: a.yiji["宜"], ji: a.yiji["忌"], hit: ok });
      } catch (e) { /* skip */ }
    }
    return list.filter(function (x) { return x.hit; });
  }

  var API = {
    yunOf: yunOf, fly: fly, feixing: feixing, SHAN_YINYANG: SHAN_YINYANG,
    GONG: GONG, GONG_NAME: GONG_NAME, GONG_DIR: GONG_DIR,
    qimen: qimen, ZHI_WUXING: ZHI_WUXING, PRODUCE: PRODUCE, KE: KE,
    zeri: zeri, currentJieqi: currentJieqi
  };
  global.FENGSHUI = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
