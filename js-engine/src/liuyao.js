/*
 * liuyao.js — 六爻纳甲 (京房) 引擎 (UMD)
 * 铜钱摇卦(3钱×6) → 本卦/变卦, 纳甲干支, 世应, 六亲, 六兽, 动爻朱砂标记。
 * 寻宫/世应使用硬编码八宫表(京房规则)，避免算法歧义；其余(纳甲/六亲/六兽)由规则推算。
 * 浏览器: window.LIuyao   Node: require('./liuyao.js')
 */
(function (global) {
  'use strict';

  // 八经卦 五行
  var TRIGRAM_ELEM = { "乾": "金", "兑": "金", "离": "火", "震": "木", "巽": "木", "坎": "水", "艮": "土", "坤": "土" };
  // 64 卦名 (上卦*8+下卦 索引, 与 meihua 一致)
  var HEX_NAME = [
    "乾为天","天泽履","天火同人","天雷无妄","天风姤","天水讼","天山遁","天地否",
    "泽天夬","兑为泽","泽火革","泽雷随","泽风大过","泽水困","泽山咸","泽地萃",
    "火天大有","火泽睽","离为火","火雷噬嗑","火风鼎","火水未济","火山旅","火地晋",
    "雷天大壮","雷泽归妹","雷火丰","震为雷","雷风恒","雷水解","雷山小过","雷地豫",
    "风天小畜","风泽中孚","风火家人","风雷益","巽为风","风水涣","风山渐","风地观",
    "水天需","水泽节","水火既济","水雷屯","水风井","坎为水","水山蹇","水地比",
    "山天大畜","山泽损","山火贲","山雷颐","山风蛊","山水蒙","艮为山","山地剥",
    "地天泰","地泽临","地火明夷","地雷复","地风升","地水师","地山谦","坤为地"
  ];
  var NAME_TO_IDX = {};
  HEX_NAME.forEach(function (nm, i) { NAME_TO_IDX[nm] = i; });
  function upDownOf(name) { var i = NAME_TO_IDX[name]; return { up: ((i / 8) | 0) + 1, down: (i % 8) + 1 }; }

  // 地支五行 (与八字引擎同)
  var ZHI_WUXING = { "子": "水", "丑": "土", "寅": "木", "卯": "木", "辰": "土", "巳": "火", "午": "火", "未": "土", "申": "金", "酉": "金", "戌": "土", "亥": "水" };
  var ZHI_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  var GAN_NAME = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  var PRODUCE = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
  var KE = { "木": "土", "土": "水", "水": "火", "火": "金", "金": "木" };

  // 八纯卦 纳甲 (初,二,三,四,五,上) 干支
  var NAJIA = {
    "乾": ["甲子", "甲寅", "甲辰", "壬午", "壬申", "壬戌"],
    "坤": ["乙未", "乙巳", "乙卯", "癸丑", "癸亥", "癸酉"],
    "震": ["庚子", "庚寅", "庚辰", "庚午", "庚申", "庚戌"],
    "巽": ["辛丑", "辛亥", "辛酉", "辛未", "辛巳", "辛卯"],
    "坎": ["戊寅", "戊辰", "戊午", "戊申", "戊戌", "戊子"],
    "离": ["己卯", "己丑", "己亥", "己酉", "己未", "己巳"],
    "艮": ["丙辰", "丙午", "丙申", "丙戌", "丙子", "丙寅"],
    "兑": ["丁巳", "丁卯", "丁丑", "丁亥", "丁酉", "丁未"]
  };
  // 八宫 (宫名=八纯卦名), 每宫 8 卦: [卦名, 世爻(0初..5上)]
  var PALACES = {
    "乾": [["乾为天", 5], ["天风姤", 0], ["天山遁", 1], ["天地否", 2], ["风地观", 3], ["山地剥", 4], ["火地晋", 3], ["火天大有", 2]],
    "坎": [["坎为水", 5], ["水泽节", 0], ["水雷屯", 1], ["水火既济", 2], ["泽火革", 3], ["雷火丰", 4], ["地火明夷", 3], ["地水师", 2]],
    "艮": [["艮为山", 5], ["山火贲", 0], ["山天大畜", 1], ["山泽损", 2], ["火泽睽", 3], ["天泽履", 4], ["风泽中孚", 3], ["风山渐", 2]],
    "震": [["震为雷", 5], ["雷地豫", 0], ["雷水解", 1], ["雷风恒", 2], ["地风升", 3], ["水风井", 4], ["泽风大过", 3], ["泽雷随", 2]],
    "巽": [["巽为风", 5], ["风天小畜", 0], ["风火家人", 1], ["风雷益", 2], ["天雷无妄", 3], ["火雷噬嗑", 4], ["山雷颐", 3], ["山风蛊", 2]],
    "离": [["离为火", 5], ["火山旅", 0], ["火风鼎", 1], ["火水未济", 2], ["山水蒙", 3], ["风水涣", 4], ["天水讼", 3], ["天火同人", 2]],
    "坤": [["坤为地", 5], ["地雷复", 0], ["地泽临", 1], ["地天泰", 2], ["雷天大壮", 3], ["泽天夬", 4], ["水天需", 3], ["水地比", 2]],
    "兑": [["兑为泽", 5], ["兑水困", 0], ["兑地萃", 1], ["兑山咸", 2], ["水山蹇", 3], ["地山谦", 4], ["雷山小过", 3], ["雷泽归妹", 2]]
  };
  // 修正个别(避免与 HEX_NAME 不匹配的简称)
  PALACES["兑"][1][0] = "泽水困"; PALACES["兑"][2][0] = "泽地萃"; PALACES["兑"][3][0] = "泽山咸";

  // 构建 卦→宫 反查
  var HEX_PALACE = {}; // key "up-down" -> {palace, shi}
  Object.keys(PALACES).forEach(function (pal) {
    PALACES[pal].forEach(function (e) {
      var ud = upDownOf(e[0]);
      HEX_PALACE[ud.up + "-" + ud.down] = { palace: pal, shi: e[1] };
    });
  });

  // 六兽 (六神) 起法: 甲乙青龙, 丙丁朱雀, 戊勾陈, 己螣蛇, 庚辛白虎, 壬癸玄武
  var SHEN = ["青龙", "朱雀", "勾陈", "螣蛇", "白虎", "玄武"];
  function sixGodStart(dayGanIdx) { // dayGanIdx 0..9
    var g = dayGanIdx % 10;
    if (g === 0 || g === 1) return 0; // 甲乙
    if (g === 2 || g === 3) return 1; // 丙丁
    if (g === 4) return 2;           // 戊
    if (g === 5) return 3;           // 己
    if (g === 6 || g === 7) return 4;// 庚辛
    return 5;                        // 壬癸
  }

  // 摇卦: 返回 6 爻 (初..上) 的 {type:6/7/8/9, yin:true/false, moving:true/false}
  function shake() {
    var yaos = [];
    for (var i = 0; i < 6; i++) {
      var yang = 0;
      for (var c = 0; c < 3; c++) yang += (Math.random() < 0.5 ? 1 : 0);
      // yang=0 老阴6(阴动) yang=1 少阳7(阳) yang=2 少阴8(阴) yang=3 老阳9(阳动)
      var type, yin, moving;
      if (yang === 0) { type = 6; yin = true; moving = true; }
      else if (yang === 1) { type = 7; yin = false; moving = false; }
      else if (yang === 2) { type = 8; yin = true; moving = false; }
      else { type = 9; yin = false; moving = true; }
      yaos.push({ type: type, yin: yin, moving: moving, pos: i });
    }
    return yaos;
  }

  function trigramFromYao(y0, y1, y2) {
    // 返回 八卦数 1..8 (初中上)
    var p = (y0 ? 1 : 0) * 4 + (y1 ? 1 : 0) * 2 + (y2 ? 1 : 0);
    return p === 0 ? 8 : 8 - p;
  }
  function hexagramOf(yaos) {
    var down = trigramFromYao(!yaos[0].yin, !yaos[1].yin, !yaos[2].yin); // 阳=实心=!yin
    var up = trigramFromYao(!yaos[3].yin, !yaos[4].yin, !yaos[5].yin);
    return { up: up, down: down, idx: (up - 1) * 8 + (down - 1), name: HEX_NAME[(up - 1) * 8 + (down - 1)] };
  }
  function changedHexagram(yaos) {
    var yb = yaos.map(function (y) { return { yin: y.moving ? !y.yin : y.yin, moving: y.moving }; });
    return hexagramOf(yb);
  }

  // 互卦（互体）：取本卦二三四爻为下互、三四五爻为上互，得隐藏之卦
  function hugua(yaos) {
    var down = trigramFromYao(!yaos[1].yin, !yaos[2].yin, !yaos[3].yin); // 二三四
    var up = trigramFromYao(!yaos[2].yin, !yaos[3].yin, !yaos[4].yin);   // 三四五
    return { up: up, down: down, idx: (up - 1) * 8 + (down - 1), name: HEX_NAME[(up - 1) * 8 + (down - 1)] };
  }

  function analyze(yaos, dayGanIdx) {
    dayGanIdx = (dayGanIdx == null) ? (new Date().getFullYear() + new Date().getDate()) % 10 : dayGanIdx % 10;
    var ben = hexagramOf(yaos);
    var bian = changedHexagram(yaos);
    var ud = HEX_PALACE[ben.up + "-" + ben.down];
    if (!ud) throw new Error("寻宫失败: " + ben.name);
    var palace = ud.palace, shi = ud.shi, ying = (shi + 3) % 6;
    var palaceElem = TRIGRAM_ELEM[palace];
    var najia = NAJIA[palace]; // 6 干支
    var godStart = sixGodStart(dayGanIdx);

    var lines = [];
    for (var i = 0; i < 6; i++) {
      var gz = najia[i];
      var zhi = gz[1];
      var zhiElem = ZHI_WUXING[zhi];
      // 六亲
      var qin;
      if (zhiElem === palaceElem) qin = "兄弟";
      else if (PRODUCE[palaceElem] === zhiElem) qin = "子孙";
      else if (PRODUCE[zhiElem] === palaceElem) qin = "父母";
      else if (KE[palaceElem] === zhiElem) qin = "妻财";
      else qin = "官鬼";
      var god = SHEN[(godStart + i) % 6];
      lines.push({
        pos: i, gz: gz, zhi: zhi, zhiElem: zhiElem,
        yin: yaos[i].yin, type: yaos[i].type, moving: yaos[i].moving,
        qin: qin, god: god, isShi: i === shi, isYing: i === ying
      });
    }
    return {
      ben: ben, bian: bian, palace: palace, palaceElem: palaceElem,
      shi: shi, ying: ying, dayGan: GAN_NAME[dayGanIdx], lines: lines,
      hasMoving: yaos.some(function (y) { return y.moving; })
    };
  }

  var API = {
    HEX_NAME: HEX_NAME, NAJIA: NAJIA, SHEN: SHEN, TRIGRAM_ELEM: TRIGRAM_ELEM,
    shake: shake, analyze: analyze, upDownOf: upDownOf,
    hexagramOf: hexagramOf, changedHexagram: changedHexagram, hugua: hugua
  };
  global.LIuyao = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
