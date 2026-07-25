/*
 * 河洛理数引擎 (Heluo Lishu)
 * ------------------------------------------------------------------
 * 定位: 传统「先天数 / 后天数」数理框架的演示性推演, 非考据定命。
 *  - 干支层: 复用已用 cnlunar 0.2.4 校验过的 LUNAR 引擎(年月日), 时柱由本引擎以五鼠遁确定性算出。
 *  - 起卦层: 采用通行「先天八卦数起卦法」(年月干支序数定上卦, 日时干支序数定下卦, 总序数定动爻)。
 *  - 全部为确定性数学, 可自测, 不依赖易错的节气/星历推算。
 * 输出: 先天数 / 后天数(洛书) / 本命卦·变卦(体用双立) / 元气五行 / 邵子心法演绎条文。
 * ------------------------------------------------------------------
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./lunar.js'));
  else root.HELUO = factory(root.LUNAR);
}(typeof self !== 'undefined' ? self : this, function (LUNAR) {
  'use strict';

  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 先天八卦序(1-8): 乾兑离震巽坎艮坤 —— 配先天数 1..8
  var XIANTIAN = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
  // 洛书(后天)数: 坎1 坤2 震3 巽4 中5 乾6 兑7 艮8 离9
  var LUOSHU = { '坎': 1, '坤': 2, '震': 3, '巽': 4, '乾': 6, '兑': 7, '艮': 8, '离': 9 };

  // 三爻(自下而上) —— 0=阴 1=阳
  var TRIGRAM_YAO = {
    '乾': [1, 1, 1], '兑': [1, 1, 0], '离': [1, 0, 1], '震': [1, 0, 0],
    '巽': [0, 1, 1], '坎': [0, 1, 0], '艮': [0, 0, 1], '坤': [0, 0, 0]
  };
  // 八宫五行
  var WUXING = {
    '乾': '金', '兑': '金', '离': '火', '震': '木', '巽': '木',
    '坎': '水', '艮': '土', '坤': '土'
  };
  // 五行生克(用于元气判读)
  var WX_KE = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };
  var WX_SHENG = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };

  // 邵子心法(演绎性条文, 取自《皇极经世·观物篇》意象, 非逐字考据)
  var SHAOZI = {
    '乾': '乾道变化, 各正性命; 天行健, 君子以自强不息。数极于九, 理究于太极。',
    '兑': '兑以说之, 万物得其所说; 泽润下而光交于上, 言出乎身加乎民。',
    '离': '离也者, 明也; 日月丽乎天, 百谷草木丽乎土。大人以继明照于四方。',
    '震': '震者动也, 万物出乎震; 洊雷震, 君子以恐惧修省, 立于不动之基。',
    '巽': '巽以申命, 随风巽; 君子以申命行事, 入乎幽而达乎显。',
    '坎': '坎者陷也, 水流而不盈; 君子以常德行习教事, 维心亨乃行有尚。',
    '艮': '艮其止, 止其所也; 兼山艮, 君子以思不出其位, 时止则止。',
    '坤': '坤厚载物, 德合无疆; 地势坤, 君子以厚德载物, 承天而行。'
  };

  function pmod(n, m) { return ((n % m) + m) % m; }

  // 时支序号(子0..亥11): 23-1子, 1-3丑, ... 21-23亥
  function hourZhiIndex(hour) {
    if (hour == null) hour = 12; // 默认午时
    var h = ((hour + 1) % 24);
    return Math.floor(h / 2) % 12;
  }
  // 五鼠遁: 时干序 = (日干序*2 + 时支序) % 10
  function hourGanIndex(dayGanIdx, zhiIdx) {
    return pmod(dayGanIdx * 2 + zhiIdx, 10);
  }

  // 干支串 -> {ganIdx, zhiIdx}  (如 "丙午" -> gan=2, zhi=6)
  function parseGZ(s) {
    return { ganIdx: GAN.indexOf(s[0]), zhiIdx: ZHI.indexOf(s[1]) };
  }

  // 由 6 爻(自下而上 0..5, 1阳0阴) 拆上下卦
  function trigramsFromYao(yao6) {
    var lower = [yao6[0], yao6[1], yao6[2]];
    var upper = [yao6[3], yao6[4], yao6[5]];
    return { lower: yaoName(lower), upper: yaoName(upper) };
  }
  function yaoName(tri) {
    for (var k in TRIGRAM_YAO) {
      var t = TRIGRAM_YAO[k];
      if (t[0] === tri[0] && t[1] === tri[1] && t[2] === tri[2]) return k;
    }
    return '乾';
  }

  function trigramYao(name) { return TRIGRAM_YAO[name].slice(); }

  // 组装 6 爻: 下卦(底) + 上卦(顶)
  function buildYao(lowerName, upperName) {
    return trigramYao(lowerName).concat(trigramYao(upperName));
  }

  // 主查询
  function query(y, m, d, hour) {
    var q = LUNAR.query(y, m, d, hour);
    var gz = q.ganzhi;

    var yG = parseGZ(gz.year8), mG = parseGZ(gz.month8), dG = parseGZ(gz.day8);
    var hz = hourZhiIndex(hour);
    var hg = hourGanIndex(dG.ganIdx, hz);
    var hourGZ = GAN[hg] + ZHI[hz];

    // 先天数配数: 天干序数(1-10) + 地支序数(1-12)
    function ord(g) { return { gan: g.ganIdx + 1, zhi: g.zhiIdx + 1 }; }
    var yO = ord(yG), mO = ord(mG), dO = ord(dG);
    var hO = { gan: hg + 1, zhi: hz + 1 };

    var upNum = pmod(yO.gan + yO.zhi + mO.gan + mO.zhi, 8); if (upNum === 0) upNum = 8;
    var lowNum = pmod(dO.gan + dO.zhi + hO.gan + hO.zhi, 8); if (lowNum === 0) lowNum = 8;
    var dong = pmod(yO.gan + yO.zhi + mO.gan + mO.zhi + dO.gan + dO.zhi + hO.gan + hO.zhi, 6); if (dong === 0) dong = 6;

    var upperName = XIANTIAN[upNum - 1];
    var lowerName = XIANTIAN[lowNum - 1];

    // 本卦 6 爻 + 动爻变
    var yao = buildYao(lowerName, upperName);          // 自下而上
    var changeIdx = dong - 1;                           // 动爻位置(0底..5顶)
    var yaoChanged = yao.slice();
    yaoChanged[changeIdx] = yaoChanged[changeIdx] ? 0 : 1;
    var tg = trigramsFromYao(yaoChanged);

    var benGua = upperName + lowerName;                // 上+下
    var bianGua = tg.upper + tg.lower;
    var tiName = lowerName;                             // 体(下)
    var yongName = upperName;                           // 用(上)

    var tiWX = WUXING[tiName], yongWX = WUXING[yongName];
    var yuanqi = tiWX;                                 // 元气以体卦五行为本

    // 先天数 / 后天数对照
    var xiantian = {
      year: yO, month: mO, day: dO, hour: hO,
      up: upNum, low: lowNum, dong: dong,
      upGua: upperName, lowGua: lowerName
    };
    var luoshu = {
      up: LUOSHU[upperName], low: LUOSHU[lowerName],
      upGua: upperName, lowGua: lowerName
    };

    return {
      meta: { solar: q.solar, lunar: q.lunar, gender: null },
      ganzhi: {
        year: gz.year8, month: gz.month8, day: gz.day8, hour: hourGZ
      },
      xiantian: xiantian,
      luoshu: luoshu,
      gua: {
        ben: benGua, benUpper: upperName, benLower: lowerName,
        bian: bianGua, bianUpper: tg.upper, bianLower: tg.lower,
        dong: dong, ti: tiName, yong: yongName,
        tiWX: tiWX, yongWX: yongWX, yuanqi: yuanqi,
        yao: yao, yaoChanged: yaoChanged
      },
      shaozi: SHAOZI[tiName]
    };
  }

  return {
    query: query,
    WUXING: WUXING, WX_KE: WX_KE, WX_SHENG: WX_SHENG,
    XIANTIAN: XIANTIAN, LUOSHU: LUOSHU, SHAOZI: SHAOZI,
    _internal: { parseGZ: parseGZ, hourZhiIndex: hourZhiIndex, hourGanIndex: hourGanIndex, trigramsFromYao: trigramsFromYao, yaoName: yaoName }
  };
}));
