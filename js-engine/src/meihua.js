/*
 * meihua.js — 梅花易数引擎 (UMD)
 * 起卦：时间 / 数字 / 方位。体用生克断吉凶，本卦·互卦·变卦，爻辞(卦辞)解读。
 * 浏览器: window.MEHUA   Node: require('./meihua.js')
 */
(function (global) {
  'use strict';

  // 八经卦: 1乾 2兑 3离 4震 5巽 6坎 7艮 8坤
  var TRIGRAM = [
    null,
    { name: "乾", sym: "☰", elem: "金", nature: "天" },
    { name: "兑", sym: "☱", elem: "金", nature: "泽" },
    { name: "离", sym: "☲", elem: "火", nature: "火" },
    { name: "震", sym: "☳", elem: "木", nature: "雷" },
    { name: "巽", sym: "☴", elem: "木", nature: "风" },
    { name: "坎", sym: "☵", elem: "水", nature: "水" },
    { name: "艮", sym: "☶", elem: "土", nature: "山" },
    { name: "坤", sym: "☷", elem: "土", nature: "地" }
  ];
  var ELEM_COLOR = { 金: "#d9c27a", 木: "#7fbf7f", 火: "#e0795f", 水: "#6ea8d8", 土: "#c9a06a" };

  // 64 卦名 (按 上卦*8+下卦 索引 0..63)
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
  // 64 卦辞 (周易原文摘要)
  var HEX_TUAN = [
    "元亨利贞", "履虎尾，不咥人，亨", "同人于野，亨", "无妄，元亨利贞", "姤，女壮，勿用取女", "讼，有孚窒，惕中吉",
    "遁，亨，小利贞", "否之匪人，不利君子贞", "夬，扬于王庭", "兑，亨，利贞", "革，巳日乃孚", "随，元亨利贞",
    "大过，栋桡", "困，亨，贞大人吉", "咸，亨利贞，取女吉", "萃，亨，王假有庙", "大有，元亨", "睽，小事吉",
    "离，利贞，亨", "噬嗑，亨，利用狱", "鼎，元吉，亨", "未济，亨", "旅，小亨", "晋，康侯用锡马蕃庶",
    "大壮，利贞", "归妹，征凶", "丰，亨，王假之", "震，亨，震来虩虩", "恒，亨，无咎", "解，利西南", "小过，亨", "豫，利建侯行师",
    "小畜，亨", "中孚，豚鱼吉", "家人，利女贞", "益，利有攸往", "巽，小亨", "涣，亨", "渐，女归吉", "观，盥而不荐",
    "需，有孚，光亨", "节，亨", "既济，亨小", "屯，元亨利贞", "井，改邑不改井", "习坎，有孚维心亨", "蹇，利西南", "比，吉",
    "大畜，利贞", "损，有孚，元吉", "贲，亨", "颐，贞吉", "蛊，元亨", "蒙，亨，匪我求童蒙", "艮，其背", "剥，不利有攸往",
    "泰，小往大来", "临，元亨利贞", "明夷，利艰贞", "复，亨", "升，元亨", "师，贞丈人吉", "谦，亨君子有终", "坤，元亨，利牝马之贞"
  ];
  // 六十四卦大象传（取前八字意象，供“爻辞”层面参考）
  var HEX_DA = [
    "天行健，君子以自强不息","上天下泽，履；君子辨上下","天与火，同人；类族辨物","天下雷行，无妄；茂对时育万物","天下有风，姤；后以施命诰四方","天与水违行，讼；作事谋始","天下有山，遁；不恶而严","天地不交，否；俭德辟难",
    "泽上于天，夬；施禄及下","丽泽，兑；朋友讲习","泽中有火，革；治历明时","泽中有雷，随；向晦入宴息","泽灭木，大过；独立不惧","泽无水，困；致命遂志","山上有泽，咸；虚受人","泽上于地，萃；除戎器戒不虞",
    "火在天上，大有；遏恶扬善","上火下泽，睽；万物睽而其事类","明两作，离；大人以继明照于四方","雷电，噬嗑；明罚敕法","木上有火，鼎；正位凝命","火在水上，未济；慎辨物居方","山上有火，旅；明慎用刑","明出地上，晋；自昭明德",
    "雷在天上，大壮；非礼弗履","泽上有雷，归妹；永终知敝","雷电皆至，丰；折狱致刑","洊雷，震；恐惧修省","雷风，恒；立不易方","雷雨作，解；赦过宥罪","山上有雷，小过；行过乎恭","雷出地奋，豫；作乐崇德",
    "风行天上，小畜；懿文德","泽上有风，中孚；议狱缓死","风自火出，家人；言有物行有恒","风雷，益；见善则迁","随风，巽；申命行事","风行水上，涣；先王享于帝立庙","山上有木，渐；居贤德善俗","风行地上，观；省方观民设教",
    "云上于天，需；饮食宴乐","泽上有水，节；制数度议德行","水在火上，既济；思患预防","云雷，屯；经纶","木上有水，井；劳民劝相","水洊至，习坎；常德行习教事","水在山上，蹇；反身修德","地上有水，比；先王建万国亲诸侯",
    "天在山中，大畜；多识前言往行","山下有泽，损；惩忿窒欲","山下有火，贲；明庶政无敢折狱","山下有雷，颐；慎言语节饮食","山下有风，蛊；振民育德","山下出泉，蒙；果行育德","兼山，艮；思不出其位","山附于地，剥；厚下安宅",
    "天地交，泰；辅相天地宜","泽上有地，临；教思无穷","明入地中，明夷；莅众用晦","雷在地中，复；修身","地中生木，升；顺德积小","地中有水，师；容民畜众","地中有山，谦；裒多益寡","地势坤，厚载物"
  ];

  function trigramOf(n) { return TRIGRAM[((n - 1) % 8 + 8) % 8 + 1]; }
  function hexIndex(up, down) { return (up - 1) * 8 + (down - 1); }
  // 每卦三爻(初,中,上): 1=阳 0=阴  (先天八卦数 1..8)
  var YAO = [
    null,
    [1, 1, 1], // 乾
    [1, 1, 0], // 兑
    [1, 0, 1], // 离
    [1, 0, 0], // 震
    [0, 1, 1], // 巽
    [0, 1, 0], // 坎
    [0, 0, 1], // 艮
    [0, 0, 0]  // 坤
  ];
  function yaoToNum(a) { // a=[初,中,上] -> 八卦数
    var p = a[0] * 4 + a[1] * 2 + a[2];
    return p === 0 ? 8 : 8 - p;
  }

  // 地支序数 子1..亥12
  var ZHI_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

  function nowParts() {
    var d = new Date();
    return {
      yearZhi: ZHI_ORDER[(d.getFullYear() - 4) % 12], // 年支
      month: d.getMonth() + 1,
      day: d.getDate(),
      hourBranch: branchOfHour(d.getHours())
    };
  }
  function branchOfHour(h) {
    var zhiIdx;
    if (h === 23 || h === 0) zhiIdx = 0;
    else zhiIdx = Math.floor((h + 1) / 2);
    return ZHI_ORDER[zhiIdx];
  }

  // 起卦核心
  function cast(upN, downN, dongN) {
    upN = ((upN - 1) % 8 + 8) % 8 + 1;
    downN = ((downN - 1) % 8 + 8) % 8 + 1;
    dongN = ((dongN - 1) % 6 + 6) % 6 + 1; // 1..6
    var ben = hexIndex(upN, downN);
    // 本卦六爻: y[0..2]=下卦(初,中,上)  y[3..5]=上卦(初,中,上)
    var ly = YAO[downN], uy = YAO[upN];
    var y = [ly[0], ly[1], ly[2], uy[0], uy[1], uy[2]];
    // 互卦: 下互=(y1,y2,y3) 上互=(y2,y3,y4)
    var huDown = yaoToNum([y[1], y[2], y[3]]);
    var huUp = yaoToNum([y[2], y[3], y[4]]);
    // 变卦: 动爻阴阳反
    var yb = y.slice();
    yb[dongN - 1] = yb[dongN - 1] ? 0 : 1;
    var bianDown = yaoToNum([yb[0], yb[1], yb[2]]);
    var bianUp = yaoToNum([yb[3], yb[4], yb[5]]);
    return {
      benIdx: ben, up: upN, down: downN, dong: dongN,
      yaos: y, huUp: huUp, huDown: huDown,
      bianUp: bianUp, bianDown: bianDown,
      benName: HEX_NAME[ben], benTuan: HEX_TUAN[ben], benDa: HEX_DA[ben]
    };
  }

  // 体用: 动爻所在卦为用, 另一为体
  function tiYong(g) {
    var dongUp = g.dong >= 4; // 动爻在四~六爻 => 上卦动
    var ti, yong, tiIsDown;
    if (dongUp) { yong = g.up; ti = g.down; tiIsDown = true; }
    else { yong = g.down; ti = g.up; tiIsDown = false; }
    var tiE = trigramOf(ti).elem, yongE = trigramOf(yong).elem;
    return relate(tiE, yongE, tiIsDown ? "体=下卦" : "体=上卦");
  }
  // 生克关系判断 (体 vs 用)
  var PRODUCE = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  var KE = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
  function relate(tiE, yongE, note) {
    var verdict, level;
    if (tiE === yongE) { verdict = "比和"; level = "平吉"; }
    else if (PRODUCE[yongE] === tiE) { verdict = "用生体"; level = "吉"; } // 用生体
    else if (PRODUCE[tiE] === yongE) { verdict = "体生用"; level = "小耗"; } // 体生用, 泄气
    else if (KE[yongE] === tiE) { verdict = "用克体"; level = "凶"; }
    else { verdict = "体克用"; level = "吉"; }
    return { tiElem: tiE, yongElem: yongE, verdict: verdict, level: level, note: note };
  }
  function relText(r) {
    return r.verdict + "（" + r.tiElem + "体 · " + r.yongElem + "用 → " + r.level + "）";
  }

  // 入口: 时间起卦
  function fromTime(opt) {
    opt = opt || {};
    var np = nowParts();
    var yZ = ZHI_ORDER.indexOf(opt.yearZhi || np.yearZhi) + 1;
    var m = opt.month || np.month;
    var d = opt.day || np.day;
    var hB = ZHI_ORDER.indexOf(opt.hourZhi || np.hourBranch) + 1;
    var up = ((yZ + m + d) % 8) || 8;
    var down = ((yZ + m + d + hB) % 8) || 8;
    var dong = ((yZ + m + d + hB) % 6) || 6;
    var g = cast(up, down, dong);
    g.method = "时间起卦";
    g.meta = "年支 " + ZHI_ORDER[yZ - 1] + " · 月 " + m + " · 日 " + d + " · 时支 " + ZHI_ORDER[hB - 1];
    g.ty = tiYong(g);
    return g;
  }
  // 入口: 数字起卦
  function fromNumbers(nums) {
    nums = (nums || []).filter(function (x) { return x != null && x !== ""; }).map(Number);
    if (nums.length < 2) throw new Error("至少需要两个数字");
    var up = (nums[0] % 8) || 8;
    var down = (nums[1] % 8) || 8;
    var sum = nums.reduce(function (a, b) { return a + b; }, 0);
    var dong = (sum % 6) || 6;
    var g = cast(up, down, dong);
    g.method = "数字起卦";
    g.meta = "数字 " + nums.join(" · ");
    g.ty = tiYong(g);
    return g;
  }
  // 入口: 方位起卦 (方位化为数)
  function fromDirection(dirName, extra) {
    var DIR = { 东: 3, 南: 1, 西: 7, 北: 6, 东南: 5, 西南: 2, 西北: 8, 东北: 4, 中: 5 };
    var dN = DIR[dirName];
    if (!dN) throw new Error("未知方位");
    var np = nowParts();
    var yZ = ZHI_ORDER.indexOf(np.yearZhi) + 1;
    var m = np.month, d = np.day;
    var up = (dN % 8) || 8;
    var down = ((yZ + m + d) % 8) || 8;
    var dong = ((dN + (extra || 0) + yZ + m + d) % 6) || 6;
    var g = cast(up, down, dong);
    g.method = "方位起卦";
    g.meta = "方位 " + dirName + (extra ? " · 数" + extra : "");
    g.ty = tiYong(g);
    return g;
  }

  function hexInfo(idx) {
    return { name: HEX_NAME[idx], tuan: HEX_TUAN[idx], da: HEX_DA[idx], up: ((idx / 8) | 0) + 1, down: (idx % 8) + 1 };
  }

  var API = {
    TRIGRAM: TRIGRAM, ELEM_COLOR: ELEM_COLOR, HEX_NAME: HEX_NAME, ZHI_ORDER: ZHI_ORDER,
    trigramOf: trigramOf, hexInfo: hexInfo, hexIndex: hexIndex, cast: cast, tiYong: tiYong,
    fromTime: fromTime, fromNumbers: fromNumbers, fromDirection: fromDirection, relate: relate, relText: relText
  };
  global.MEHUA = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
