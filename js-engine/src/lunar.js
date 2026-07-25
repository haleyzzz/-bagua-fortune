/*
 * lunar.js — 农历黄历引擎 (UMD)
 * 数据来源: cnlunar 0.2.4 (config.py lunarMonthData / lunarNewYearList / SOLAR_TERMS_DATA_LIST / ENC_VECTOR_LIST)
 *   农历/节气算法为 1901-2100 公历↔农历 权威数据表 + 香港天文台节气压缩表，非模型推算。
 * window.LUNAR / Node: require('./lunar.js')
 */
(function (global) {
  'use strict';

  var START_YEAR = 1901;
  // 非负取模: JS 的 % 对负数返回负余数, 干支索引必须落在 0..n-1
  function pmod(a, n) { return ((a % n) + n) % n; }

  // 1901-2100 农历每月大小月 + 闰月编码 (bit13=闰月天数30/29, bit17..14=闰几月, bit0..11=12月大小)
  var lunarMonthData = [
    0x752,0xea5,0xab2a,0x64b,0xa9b,
    0x9aa6,0x56a,0xb59,0x4baa,0x752,
    0xcda5,0xb25,0xa4b,0xba4b,0x2ad,
    0x56b,0x45b5,0xda9,0xfe92,0xe92,
    0xd25,0xad2d,0xa56,0x2b6,0x9ad5,
    0x6d4,0xea9,0x4f4a,0xe92,0xc6a6,
    0x52b,0xa57,0xb956,0xb5a,0x6d4,
    0x7761,0x749,0xfb13,0xa93,0x52b,
    0xd51b,0xaad,0x56a,0x9da5,0xba4,
    0xb49,0x4d4b,0xa95,0xeaad,0x536,
    0xaad,0xbaca,0x5b2,0xda5,0x7ea2,
    0xd4a,0x10595,0xa97,0x556,0xc575,
    0xad5,0x6d2,0x8755,0xea5,0x64a,
    0x664f,0xa9b,0xeada,0x56a,0xb69,
    0xabb2,0xb52,0xb25,0x8b2b,0xa4b,
    0x10aab,0x2ad,0x56d,0xd5a9,0xda9,
    0xd92,0x8e95,0xd25,0x14e4d,0xa56,
    0x2b6,0xc2f5,0x6d5,0xea9,0xaf52,
    0xe92,0xd26,0x652e,0xa57,0x10ad6,
    0x35a,0x6d5,0xab69,0x749,0x693,
    0x8a9b,0x52b,0xa5b,0x4aae,0x56a,
    0xedd5,0xba4,0xb49,0xad53,0xa95,
    0x52d,0x855d,0xab5,0x12baa,0x5d2,
    0xda5,0xde8a,0xd4a,0xc95,0x8a9e,
    0x556,0xab5,0x4ada,0x6d2,0xc765,
    0x725,0x64b,0xa657,0xcab,0x55a,
    0x656e,0xb69,0x16f52,0xb52,0xb25,
    0xdd0b,0xa4b,0x4ab,0xa2bb,0x5ad,
    0xb6a,0x4daa,0xd92,0xeea5,0xd25,
    0xa55,0xba4d,0x4b6,0x5b5,0x76d2,
    0xec9,0x10f92,0xe92,0xd26,0xd516,
    0xa57,0x556,0x9365,0x755,0x749,
    0x674b,0x693,0xeaab,0x52b,0xa5b,
    0xaaba,0x56a,0xb65,0x8baa,0xb4a,
    0x10d95,0xa95,0x52d,0xc56d,0xab5,
    0x5aa,0x85d5,0xda5,0xd4a,0x6e4d,
    0xc96,0xecce,0x556,0xab5,0xbad2,
    0x6d2,0xea5,0x872a,0x68b,0x10697,
    0x4ab,0x55b,0xd556,0xb6a,0x752,
    0x8b95,0xb45,0xa8b,0x4a4f,
  ];

  // 1901-2100 春节 (公历) 编码: bit5..4=月, bit4..0=日
  var lunarNewYearList = [
    0x53,0x48,0x3d,0x50,0x44,
    0x39,0x4d,0x42,0x36,0x4a,
    0x3e,0x52,0x46,0x3a,0x4e,
    0x43,0x37,0x4b,0x41,0x54,
    0x48,0x3c,0x50,0x45,0x38,
    0x4d,0x42,0x37,0x4a,0x3e,
    0x51,0x46,0x3a,0x4e,0x44,
    0x38,0x4b,0x3f,0x53,0x48,
    0x3b,0x4f,0x45,0x39,0x4d,
    0x42,0x36,0x4a,0x3d,0x51,
    0x46,0x3b,0x4e,0x43,0x38,
    0x4c,0x3f,0x52,0x48,0x3c,
    0x4f,0x45,0x39,0x4d,0x42,
    0x35,0x49,0x3e,0x51,0x46,
    0x3b,0x4f,0x43,0x37,0x4b,
    0x3f,0x52,0x47,0x3c,0x50,
    0x45,0x39,0x4d,0x42,0x54,
    0x49,0x3d,0x51,0x46,0x3b,
    0x4f,0x44,0x37,0x4a,0x3f,
    0x53,0x47,0x3c,0x50,0x45,
    0x38,0x4c,0x41,0x36,0x49,
    0x3d,0x52,0x47,0x3a,0x4e,
    0x43,0x37,0x4a,0x3f,0x53,
    0x48,0x3c,0x50,0x45,0x39,
    0x4c,0x41,0x36,0x4a,0x3d,
    0x51,0x46,0x3a,0x4d,0x43,
    0x37,0x4b,0x3f,0x53,0x48,
    0x3c,0x4f,0x44,0x38,0x4c,
    0x41,0x36,0x4a,0x3e,0x51,
    0x46,0x3a,0x4e,0x42,0x37,
    0x4b,0x41,0x53,0x48,0x3c,
    0x4f,0x44,0x38,0x4c,0x42,
    0x35,0x49,0x3d,0x51,0x45,
    0x3a,0x4e,0x43,0x37,0x4b,
    0x3f,0x53,0x47,0x3b,0x4f,
    0x45,0x38,0x4c,0x42,0x36,
    0x49,0x3d,0x51,0x46,0x3a,
    0x4e,0x43,0x38,0x4a,0x3e,
    0x52,0x47,0x3b,0x4f,0x45,
    0x39,0x4c,0x41,0x35,0x49,
  ];

  // 1901-2100 二十四节气 压缩十六进制 (香港天文台)
  var SOLAR_TERMS_DATA_LIST = [
    0x6aaaa6aa9a5a,0xaaaaaabaaa6a,0xaaabbabbafaa,0x5aa665a65aab,0x6aaaa6aa9a5a,
    0xaaaaaaaaaa6a,0xaaabbabbafaa,0x5aa665a65aab,0x6aaaa6aa9a5a,0xaaaaaaaaaa6a,
    0xaaabbabbafaa,0x5aa665a65aab,0x6aaaa6aa9a56,0xaaaaaaaa9a5a,0xaaabaabaaeaa,
    0x569665a65aaa,0x5aa6a6a69a56,0x6aaaaaaa9a5a,0xaaabaabaaeaa,0x569665a65aaa,
    0x5aa6a6a65a56,0x6aaaaaaa9a5a,0xaaabaabaaa6a,0x569665a65aaa,0x5aa6a6a65a56,
    0x6aaaa6aa9a5a,0xaaaaaabaaa6a,0x555665665aaa,0x5aa665a65a56,0x6aaaa6aa9a5a,
    0xaaaaaabaaa6a,0x555665665aaa,0x5aa665a65a56,0x6aaaa6aa9a5a,0xaaaaaaaaaa6a,
    0x555665665aaa,0x5aa665a65a56,0x6aaaa6aa9a5a,0xaaaaaaaaaa6a,0x555665665aaa,
    0x5aa665a65a56,0x6aaaa6aa9a5a,0xaaaaaaaaaa6a,0x555665655aaa,0x569665a65a56,
    0x6aa6a6aa9a56,0xaaaaaaaa9a5a,0x5556556559aa,0x569665a65a55,0x6aa6a6a65a56,
    0xaaaaaaaa9a5a,0x5556556559aa,0x569665a65a55,0x5aa6a6a65a56,0x6aaaa6aa9a5a,
    0x5556556555aa,0x569665a65a55,0x5aa665a65a56,0x6aaaa6aa9a5a,0x55555565556a,
    0x555665665a55,0x5aa665a65a56,0x6aaaa6aa9a5a,0x55555565556a,0x555665665a55,
    0x5aa665a65a56,0x6aaaa6aa9a5a,0x55555555556a,0x555665665a55,0x5aa665a65a56,
    0x6aaaa6aa9a5a,0x55555555556a,0x555665655a55,0x5aa665a65a56,0x6aa6a6aa9a5a,
    0x55555555456a,0x555655655a55,0x5a9665a65a56,0x6aa6a6a69a5a,0x55555555456a,
    0x555655655a55,0x569665a65a56,0x6aa6a6a65a56,0x55555155455a,0x555655655955,
    0x569665a65a55,0x5aa6a5a65a56,0x15555155455a,0x555555655555,0x569665665a55,
    0x5aa665a65a56,0x15555155455a,0x555555655515,0x555665665a55,0x5aa665a65a56,
    0x15555155455a,0x555555555515,0x555665665a55,0x5aa665a65a56,0x15555155455a,
    0x555555555515,0x555665665a55,0x5aa665a65a56,0x15555155455a,0x555555555515,
    0x555655655a55,0x5aa665a65a56,0x15515155455a,0x555555554515,0x555655655a55,
    0x5a9665a65a56,0x15515151455a,0x555551554515,0x555655655a55,0x569665a65a56,
    0x155151510556,0x555551554505,0x555655655955,0x569665665a55,0x155110510556,
    0x155551554505,0x555555655555,0x569665665a55,0x55110510556,0x155551554505,
    0x555555555515,0x555665665a55,0x55110510556,0x155551554505,0x555555555515,
    0x555665665a55,0x55110510556,0x155551554505,0x555555555515,0x555655655a55,
    0x55110510556,0x155551554505,0x555555555515,0x555655655a55,0x55110510556,
    0x155151514505,0x555555554515,0x555655655a55,0x54110510556,0x155151510505,
    0x555551554515,0x555655655a55,0x14110110556,0x155110510501,0x555551554505,
    0x555555655555,0x14110110555,0x155110510501,0x555551554505,0x555555555555,
    0x14110110555,0x55110510501,0x155551554505,0x555555555555,0x110110555,
    0x55110510501,0x155551554505,0x555555555515,0x110110555,0x55110510501,
    0x155551554505,0x555555555515,0x100100555,0x55110510501,0x155151514505,
    0x555555555515,0x100100555,0x54110510501,0x155151514505,0x555551554515,
    0x100100555,0x54110510501,0x155150510505,0x555551554515,0x100100555,
    0x14110110501,0x155110510505,0x555551554505,0x100055,0x14110110500,
    0x155110510501,0x555551554505,0x55,0x14110110500,0x55110510501,
    0x155551554505,0x55,0x110110500,0x55110510501,0x155551554505,
    0x15,0x100110500,0x55110510501,0x155551554505,0x555555555515,
  ];

  // 节气最小日序数 (用于解压)
  var ENC_VECTOR_LIST = [4,19,3,18,4,19,4,19,4,20,4,20,6,22,6,22,6,22,7,22,6,21,6,21];
  var SOLAR_TERMS_NAME_LIST = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];

  var GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var GAN_ELEM = ['木','木','火','火','土','土','金','金','水','水'];
  var ZHI_ELEM = ['水','土','木','木','土','火','火','土','金','金','土','水'];
  // 60 甲子
  var GZ60 = [];
  for (var i = 0; i < 60; i++) GZ60.push(GAN[i % 10] + ZHI[i % 12]);
  var ZODIAC = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  var NAYIN = ['海中金','炉中火','大林木','路旁土','剑锋金','山头火','涧下水','城头土','白蜡金','杨柳木','井泉水','屋上土','霹雳火','松柏木','长流水','砂中金','山下火','平地木','壁上土','金箔金','覆灯火','天河水','大驿土','钗钏金','桑柘木','大溪水','砂中土','天上火','石榴木','大海水'];
  var lunarMonthNameList = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'];
  var lunarDayNameList = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
  var upperNum = ['零','一','二','三','四','五','六','七','八','九'];
  var weekDay = ['星期一','星期二','星期三','星期四','星期五','星期六','星期日'];
  var STAR_ZODIAC_NAME = ['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座'];
  var STAR_ZODIAC_DATE = [[1,20],[2,19],[3,21],[4,21],[5,21],[6,22],[7,23],[8,23],[9,23],[10,23],[11,23],[12,23]];

  // 建除十二神
  var chinese12DayOfficers = '建除满平定执破危成收开闭';
  // 建除宜忌 (officerThings)
  var officerThings = {
    '建': [['施恩','招贤','举正直','出行','上官','临政'], []],
    '除': [['解除','沐浴','整容','剃头','整手足甲','求医疗病','扫舍宇'], []],
    '满': [['进人口','裁制','竖柱上梁','经络','开市','立券交易','纳财','开仓','塞穴','补垣'], ['施恩','招贤','举正直','上官','临政','结婚姻','纳采','求医疗病']],
    '平': [['修饰垣墙','平治道涂'], ['祈福','求嗣','上册','上表章','颁诏','施恩','招贤','举正直','宣政事','布政事','庆赐','宴会','冠带','出行','安抚边境','选将','出师','上官','临政','结婚姻','纳采','嫁娶','进人口','搬移','安床','解除','求医疗病','裁制','营建','修宫室','缮城郭','筑堤防','修造','竖柱上梁','修仓库','鼓铸','经络','酝酿','开市','立券交易','纳财','开仓','修置产室','开渠','穿井','栽种','牧养','纳畜','破土','安葬','启攒']],
    '定': [['冠带'], []],
    '执': [['捕捉'], []],
    '破': [['求医疗病'], []],
    '危': [['安抚边境','选将','安床'], []],
    '成': [['入学','安抚边境','搬移','筑堤防','开市'], []],
    '收': [['进人口','纳财','捕捉','纳畜'], ['祈福','求嗣','上册','上表章','颁诏','施恩','招贤','举正直','宣政事','布政事','庆赐','宴会','冠带','出行','安抚边境','选将','出师','上官','临政','结婚姻','纳采','嫁娶','搬移','安床','解除','求医疗病','裁制','营建','修宫室','缮城郭','筑堤防','修造','竖柱上梁','鼓铸','经络','酝酿','开市','立券交易','开仓','修置产室','开渠','穿井','破土','安葬','启攒']],
    '开': [['祭祀','祈福','求嗣','上册','上表章','颁诏','覃恩','施恩','招贤','举正直','恤孤茕','宣政事','雪冤','庆赐','宴会','入学','出行','上官','临政','搬移','解除','求医疗病','裁制','修宫室','缮城郭','修造','修仓库','开市','修置产室','开渠','穿井','安碓硙','栽种','牧养'], []],
    '闭': [['筑堤防','塞穴','补垣'], ['上册','上表章','颁诏','施恩','招贤','举正直','宣政事','布政事','庆赐','宴会','出行','出师','上官','临政','结婚姻','纳采','嫁娶','进人口','搬移','安床','求医疗病','疗目','营建','修宫室','修造','竖柱上梁','开市','开仓','修置产室','开渠','穿井']]
  };
  // 日干支宜忌 (day8CharThing)
  var day8CharThing = {
    '甲': [[], ['开仓']], '乙': [[], ['栽种']], '丁': [[], ['整容','剃头']], '庚': [[], ['经络']],
    '辛': [[], ['酝酿']], '壬': [[], ['开渠','穿井']],
    '子': [['沐浴'], []], '丑': [[], ['冠带']], '寅': [[], ['祭祀']], '卯': [[], ['穿井']],
    '酉': [[], ['宴会']], '巳': [[], ['出行']], '午': [[], ['苫盖']], '未': [[], ['求医疗病']],
    '申': [[], ['安床']], '亥': [['沐浴'], ['嫁娶']]
  };

  // 农历节日
  var lunarFestivals = {
    '1-1': '春节', '1-15': '元宵节', '2-2': '龙抬头', '5-5': '端午节',
    '7-7': '七夕', '7-15': '中元节', '8-15': '中秋节', '9-9': '重阳节',
    '12-8': '腊八节', '12-23': '北方小年'
  };

  // ---- 节气解压 ----
  function abListMerge(a) {
    var c = [];
    for (var i = 0; i < a.length; i++) c.push(a[i] + ENC_VECTOR_LIST[i]);
    return c;
  }
  // 注意: 节气数据为 48 位编码, JS 的 >> 是 32 位截断, 必须用 BigInt 做位运算
  function unZipSolarTermsList(dataHex) {
    var data = BigInt(dataHex);
    var list2 = [], rangeEnd = 24, charLen = 2;
    for (var i = 1; i <= rangeEnd; i++) {
      var right = charLen * (rangeEnd - i);
      var x = data >> BigInt(right);
      var bit = Number(x & 3n);
      list2 = [bit].concat(list2);
    }
    return abListMerge(list2);
  }
  function getSolarTerms(year) {
    if (year < START_YEAR || year >= START_YEAR + SOLAR_TERMS_DATA_LIST.length) return [];
    var list = unZipSolarTermsList(SOLAR_TERMS_DATA_LIST[year - START_YEAR]);
    var res = [];
    for (var i = 0; i < 24; i++) res.push({ name: SOLAR_TERMS_NAME_LIST[i], month: (i / 2 | 0) + 1, day: list[i] });
    return res;
  }

  // ---- 公历 -> 农历 ----
  function monthDaysOf(ly, lm) {
    var tmp = lunarMonthData[ly - START_YEAR];
    var md = (tmp & (1 << (lm - 1))) ? 30 : 29;
    var leapMonth = (tmp >> 13) & 0xf;
    var leapDay = 0;
    if (leapMonth) leapDay = (tmp & (1 << 12)) ? 30 : 29;
    return [md, leapMonth, leapDay];
  }
  function solarToLunar(y, m, d) {
    if (y < START_YEAR || y >= START_YEAR + lunarMonthData.length) {
      throw new Error('年份超出 1901-2100 支持范围');
    }
    var lunarYear = y, lunarMonth = 1, lunarDay = 1, isLeap = false;
    var code = lunarNewYearList[lunarYear - START_YEAR];
    var nyMonth = (code >> 5) & 0x3, nyDay = code & 0x1f;
    var nyUTC = Date.UTC(lunarYear, nyMonth - 1, nyDay);
    var curUTC = Date.UTC(y, m - 1, d);
    var span = Math.round((curUTC - nyUTC) / 86400000);
    if (span >= 0) {
      var md = monthDaysOf(lunarYear, lunarMonth)[0];
      while (span >= md) {
        span -= md;
        var lm = monthDaysOf(lunarYear, lunarMonth);
        if (lunarMonth === lm[1]) { // 进入闰月
          md = lm[2];
          if (span < md) { isLeap = true; break; }
          span -= md;
        }
        lunarMonth++;
        md = monthDaysOf(lunarYear, lunarMonth)[0];
      }
      lunarDay += span;
    } else {
      lunarMonth = 12; lunarYear--;
      var mdl = monthDaysOf(lunarYear, lunarMonth);
      md = mdl[0];
      while (Math.abs(span) > md) {
        span += md;
        var lm2 = monthDaysOf(lunarYear, lunarMonth);
        if (lunarMonth === lm2[1]) {
          md = lm2[2];
          if (Math.abs(span) <= md) { isLeap = true; break; }
          span += md;
        }
        lunarMonth--;
        md = monthDaysOf(lunarYear, lunarMonth)[0];
      }
      lunarDay += (md + span);
    }
    return { lunarYear: lunarYear, lunarMonth: lunarMonth, lunarDay: lunarDay, isLeap: isLeap, monthLong: md >= 30 };
  }

  // ---- 干支 ----
  function dayDiffUTC(y, m, d, y2, m2, d2) {
    return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y2, m2 - 1, d2)) / 86400000);
  }
  // 月干支依赖节气序号
  function nextSolarNum(year, m, d) {
    var terms = getSolarTerms(year);
    var cnt = 0;
    for (var i = 0; i < terms.length; i++) {
      if (terms[i].month < m || (terms[i].month === m && terms[i].day <= d)) cnt++;
    }
    return cnt % 24;
  }
  function ganzhi(y, m, d, hour) {
    var lun = solarToLunar(y, m, d);
    // 年干支: 农历年春节分界
    var year8 = GZ60[pmod(lun.lunarYear - 4, 60)];
    // 月干支: 以节气定月建, 2019 小寒甲子月为基准
    var ns = nextSolarNum(y, m, d);
    if (ns === 0 && m === 12) ns = 24;
    var apartNum = (ns + 1) / 2 | 0;
    var month8 = GZ60[pmod((y - 2019) * 12 + apartNum, 60)];
    // 日干支: 基准 2019-01-29 丙寅
    var twohour = hour == null ? 12 : (hour + 1) / 2 | 0;
    var base = 2; // 丙寅 index
    if (twohour === 12) base += 1;
    var apart = dayDiffUTC(y, m, d, 2019, 1, 29);
    var day8 = GZ60[pmod(apart + base, 60)];
    return {
      year8: year8, month8: month8, day8: day8,
      yearGan: year8[0], yearZhi: year8[1],
      monthGan: month8[0], monthZhi: month8[1],
      dayGan: day8[0], dayZhi: day8[1]
    };
  }
  function zodiacOf(lunarYear) { return ZODIAC[pmod(lunarYear - 4, 12)]; }
  function nayinOf(lunarYear) { return NAYIN[pmod(lunarYear - 4, 60) / 2 | 0]; }

  // ---- 节气当日/下一 ----
  function solarTermInfo(y, m, d) {
    var terms = getSolarTerms(y);
    var today = null, next = null, nextDate = null;
    for (var i = 0; i < terms.length; i++) {
      if (terms[i].month === m && terms[i].day === d) today = terms[i].name;
    }
    var ns = nextSolarNum(y, m, d);
    var idx = ns % 24;
    next = SOLAR_TERMS_NAME_LIST[idx];
    nextDate = { month: terms[idx].month, day: terms[idx].day };
    // 跨年回绕: 冬至之后下一节气(小寒)在次年, 需按真实年份算距今天数
    var cand = Date.UTC(y, terms[idx].month - 1, terms[idx].day);
    var todayUtc = Date.UTC(y, m - 1, d);
    if (cand <= todayUtc) cand = Date.UTC(y + 1, terms[idx].month - 1, terms[idx].day);
    var daysTo = Math.round((cand - todayUtc) / 86400000);
    return { today: today, next: next, nextDate: nextDate, daysTo: daysTo };
  }

  // ---- 建除 + 宜忌 ----
  function dayOfficer(monthZhi, dayZhi) {
    var mi = ZHI.indexOf(monthZhi), di = ZHI.indexOf(dayZhi);
    var idx = (di - mi + 12) % 12;
    return chinese12DayOfficers[idx];
  }
  function fortuneOf(gz) {
    var officer = dayOfficer(gz.monthZhi, gz.dayZhi);
    var ot = officerThings[officer] || [[], []];
    var yi = ot[0].slice(), ji = ot[1].slice();
    // 日干支补充忌
    if (day8CharThing[gz.dayGan] && day8CharThing[gz.dayGan][1]) ji = ji.concat(day8CharThing[gz.dayGan][1]);
    if (day8CharThing[gz.dayZhi] && day8CharThing[gz.dayZhi][1]) ji = ji.concat(day8CharThing[gz.dayZhi][1]);
    if (day8CharThing[gz.dayGan] && day8CharThing[gz.dayGan][0]) yi = yi.concat(day8CharThing[gz.dayGan][0]);
    if (day8CharThing[gz.dayZhi] && day8CharThing[gz.dayZhi][0]) yi = yi.concat(day8CharThing[gz.dayZhi][0]);
    return { officer: officer, yi: unique(yi), ji: unique(ji) };
  }
  function unique(a) { var s = {}, r = []; a.forEach(function (x) { if (!s[x]) { s[x] = 1; r.push(x); } }); return r; }

  function starZodiac(m, d) {
    var n = 0;
    for (var i = 0; i < STAR_ZODIAC_DATE.length; i++) {
      if (m > STAR_ZODIAC_DATE[i][0] || (m === STAR_ZODIAC_DATE[i][0] && d >= STAR_ZODIAC_DATE[i][1])) n = i + 1;
    }
    return STAR_ZODIAC_NAME[n % 12];
  }

  function festivalOf(lun) {
    if (lun.isLeap) return '';
    return lunarFestivals[lun.lunarMonth + '-' + lun.lunarDay] || '';
  }

  // ---- 主查询 ----
  function query(y, m, d, hour) {
    var lun = solarToLunar(y, m, d);
    var gz = ganzhi(y, m, d, hour);
    var st = solarTermInfo(y, m, d);
    var fort = fortuneOf(gz);
    return {
      solar: { year: y, month: m, day: d, week: weekDay[new Date(y, m - 1, d).getDay()] },
      lunar: {
        year: lun.lunarYear, yearCN: toCN(lun.lunarYear),
        month: lun.lunarMonth, monthCN: (lun.isLeap ? '闰' : '') + lunarMonthNameList[(lun.lunarMonth - 1) % 12],
        day: lun.lunarDay, dayCN: lunarDayNameList[(lun.lunarDay - 1) % 30],
        isLeap: lun.isLeap, monthLong: lun.monthLong
      },
      ganzhi: gz,
      zodiac: zodiacOf(lun.lunarYear),
      nayin: nayinOf(lun.lunarYear),
      dayNayin: NAYIN[((GZ60.indexOf(gz.day8)) / 2 | 0)],
      solarTerm: st,
      festival: festivalOf(lun),
      star: starZodiac(m, d),
      fortune: fort
    };
  }
  function toCN(num) {
    var s = ''; String(num).split('').forEach(function (c) { s += upperNum[+c]; }); return s;
  }

  var API = {
    START_YEAR: START_YEAR, SOLAR_TERMS_NAME_LIST: SOLAR_TERMS_NAME_LIST,
    solarToLunar: solarToLunar, ganzhi: ganzhi, getSolarTerms: getSolarTerms,
    solarTermInfo: solarTermInfo, zodiacOf: zodiacOf, nayinOf: nayinOf,
    dayOfficer: dayOfficer, fortuneOf: fortuneOf, starZodiac: starZodiac,
    query: query, GZ60: GZ60, GAN: GAN, ZHI: ZHI, NAYIN: NAYIN, ZODIAC: ZODIAC
  };
  global.LUNAR = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
