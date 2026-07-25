/*
 * tarot.js — 塔罗牌库 (RWS 78 张) (UMD)
 * window.TAROT  Node: require('./tarot.js')
 * 数据: 22 大阿尔卡那 + 56 小阿尔卡那; 每张含 正位/逆位 解读。
 */
(function (global) {
  'use strict';

  var MAJOR = [
    ["0", "The Fool", "愚者", "新的开始、纯真、冒险、无限可能", "鲁莽、犹豫、逃避、漫无目的"],
    ["1", "The Magician", "魔术师", "意志、创造、行动力、资源整合", "欺骗、能力未发挥、操纵、拖延"],
    ["2", "The High Priestess", "女祭司", "直觉、潜意识、神秘、内在智慧", "压抑直觉、秘密、疏离、迷失"],
    ["3", "The Empress", "皇后", "丰盛、母性、孕育、感官之美", "依赖、停滞、过度保护、空虚"],
    ["4", "The Emperor", "皇帝", "权威、秩序、稳定、掌控", "专制、僵化、失控、滥用权力"],
    ["5", "The Hierophant", "教皇", "传统、信仰、引导、制度", "墨守成规、背离本心、伪善"],
    ["6", "The Lovers", "恋人", "爱、结合、重要抉择、价值观契合", "失衡、分歧、错误选择、疏离"],
    ["7", "The Chariot", "战车", "意志胜利、前进、专注、突破", "失控、方向迷失、内耗、放弃"],
    ["8", "Strength", "力量", "勇气、柔韧、自制、内在力量", "自我怀疑、软弱、暴躁、怯懦"],
    ["9", "The Hermit", "隐士", "内省、独处、追寻真理、指引", "孤立、逃避、固执、迷惘"],
    ["10", "Wheel of Fortune", "命运之轮", "转机、循环、机遇、命运", "厄运、被动、抗拒变化、低谷"],
    ["11", "Justice", "正义", "公平、因果、清醒、责任", "偏颇、逃避后果、失衡、纠纷"],
    ["12", "The Hanged Man", "倒吊人", "臣服、换个视角、牺牲、顿悟", "无谓牺牲、停滞、抗拒、困顿"],
    ["13", "Death", "死神", "结束与重生、转化、放下", "恐惧改变、执念、停滞不前"],
    ["14", "Temperance", "节制", "平衡、调和、耐心、疗愈", "失衡、极端、急躁、失序"],
    ["15", "The Devil", "恶魔", "欲望、束缚、执念、物质", "沉溺、被控、恐惧、挣脱的契机"],
    ["16", "The Tower", "高塔", "突变、崩塌、觉醒、解放", "抗拒崩塌、反复受创、未解的危机"],
    ["17", "The Star", "星星", "希望、疗愈、灵感、宁静", "失望、迷茫、失去信心、枯竭"],
    ["18", "The Moon", "月亮", "潜意识、幻象、不安、直觉", "迷惑、欺骗、恐惧、真相不明"],
    ["19", "The Sun", "太阳", "喜悦、成功、活力、明朗", "短暂阴影、过度乐观、延迟的喜悦"],
    ["20", "Judgement", "审判", "觉醒、赦免、召唤、清算", "自我否定、悔憾、回避召唤"],
    ["21", "The World", "世界", "圆满、完成、整合、达成", "未竟、缺口、延迟的圆满"]
  ];

  function minor(suitEn, suitCn, elem) {
    var nums = [
      ["Ace", "王牌", "新生的" + elem + "、源头、契机、潜能"],
      ["Two", "二", "选择、合作、权衡、萌芽"],
      ["Three", "三", "扩展、成长、协作、成果初现"],
      ["Four", "四", "稳固、沉淀、守成、局限"],
      ["Five", "五", "冲突、失落、动荡、重整"],
      ["Six", "六", "调和、顺利、回望、稳定"],
      ["Seven", "七", "挑战、坚持、攻防、考验"],
      ["Eight", "八", "加速、掌控、流动、精进"],
      ["Nine", "九", "近成、储备、警觉、收尾"],
      ["Ten", "十", elem + "的极致、圆满或重负、终结"]
    ];
    var courts = [
      ["Page", "侍从", "萌芽、学习、讯息、好奇"],
      ["Knight", "骑士", "行动、推进、热情或冲动", ""],
      ["Queen", "王后", "成熟、包容、内化之力", ""],
      ["King", "国王", "权威、主导、外显之力", ""]
    ];
    var arr = [];
    nums.forEach(function (n) {
      arr.push([suitEn + " " + n[0], suitCn + n[1], n[2], "逆位：受阻、过度、错失、失衡"]);
    });
    courts.forEach(function (c) {
      var up = c[2];
      var rev = c[2].indexOf("、") > 0 ? c[2] : c[2] + "的负面";
      arr.push([suitEn + " " + c[0], suitCn + c[1], up, "逆位：" + rev + "、失焦、延迟"]);
    });
    return arr;
  }

  var MINOR = []
    .concat(minor("Wands", "权杖", "行动"))
    .concat(minor("Cups", "圣杯", "情感"))
    .concat(minor("Swords", "宝剑", "思维"))
    .concat(minor("Pentacles", "星币", "现实"));

  // 组装牌库
  var DECK = [];
  MAJOR.forEach(function (m) {
    DECK.push({ type: "major", num: m[0], en: m[1], cn: m[2], upright: m[3], reversed: m[4] });
  });
  MINOR.forEach(function (m) {
    DECK.push({ type: "minor", en: m[0], cn: m[1], upright: m[2], reversed: m[3] });
  });

  // 牌阵定义: 名称 -> [{key,label,desc}]
  var SPREADS = {
    "three": {
      name: "三牌阵 · 过去现在未来",
      pos: [
        { key: "past", label: "过去", desc: "影响现状的来由" },
        { key: "now", label: "现在", desc: "当前处境与能量" },
        { key: "future", label: "未来", desc: "可能的发展走向" }
      ]
    },
    "celtic": {
      name: "凯尔特十字 · 十张牌",
      pos: [
        { key: "1", label: "现状", desc: "你所处的境况" },
        { key: "2", label: "挑战", desc: "横亘面前的考验" },
        { key: "3", label: "过去", desc: "远因与旧识" },
        { key: "4", label: "未来", desc: "近期将显化" },
        { key: "5", label: "理想", desc: "你潜意识所愿" },
        { key: "6", label: "现实", desc: "环境与现实制约" },
        { key: "7", label: "自我", desc: "你对此的态度" },
        { key: "8", label: "外因", desc: "他人/环境的影响" },
        { key: "9", label: "希望恐惧", desc: "内心的期望与担忧" },
        { key: "10", label: "结果", desc: "最终的可能结局" }
      ]
    },
    "love": {
      name: "感情牌阵 · 六张",
      pos: [
        { key: "self", label: "你", desc: "你在这段关系中的状态" },
        { key: "other", label: "对方", desc: "对方的状态与想法" },
        { key: "past", label: "过去", desc: "关系来由" },
        { key: "present", label: "现在", desc: "当下互动" },
        { key: "future", label: "未来", desc: "发展走向" },
        { key: "advice", label: "建议", desc: "给这段关系的提醒" }
      ]
    },
    "daily": {
      name: "每日一牌",
      pos: [
        { key: "daily", label: "今日指引", desc: "一天的基调与提醒" }
      ]
    }
  };

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  // 抽 n 张 (可含逆位)
  function draw(n, allowReversed) {
    var pool = shuffle(DECK).slice(0, n);
    return pool.map(function (c) {
      var rev = allowReversed && Math.random() < 0.5;
      return { card: c, reversed: rev, meaning: rev ? c.reversed : c.upright };
    });
  }

  var API = { DECK: DECK, MAJOR: MAJOR, MINOR: MINOR, SPREADS: SPREADS, draw: draw, shuffle: shuffle };
  global.TAROT = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
