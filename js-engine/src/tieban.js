/*
 * tieban.js — 铁板神数（演绎版）纯前端引擎
 * ----------------------------------------------------------------------------
 * ⚠️ 重要声明：铁板神数是传统命理中的「演绎型」体系，本引擎并非算法排盘，
 *   而是依据四柱干支的阴阳、五行、纳音，按传统铁板框架（父母/兄弟/夫妻/
 *   子女/财禄/疾厄/心性/三限）推导一组「编号条文」的象征性演绎。
 *   本盘为传统规律演绎性推演，非算法引擎计算，仅供文化参考，不作定数断言。
 *
 * 数据可靠性：年/月/日干支、生肖、年命纳音、日纳音 全部复用已权威校验的
 *   lunar.js（cnlunar 0.2.4 基准），时柱以「五鼠遁」确定性算法自算，
 *   避免 LLM 记忆推算的易错风险。条文内容为本引擎按规则生成，非古籍原文。
 * ----------------------------------------------------------------------------
 */
(function (root, factory) {
  var LUNAR = (typeof window !== 'undefined' && window.LUNAR)
    ? window.LUNAR
    : (typeof require !== 'undefined' ? require('./lunar.js') : null);
  var lib = factory(LUNAR);
  if (typeof module !== 'undefined' && module.exports) module.exports = lib;
  if (typeof window !== 'undefined') window.TIEBAN = lib;
})(this, function (LUNAR) {

  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var WUX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  var ZHI_WUX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  var ZHI_YIN = { 子: '阳', 丑: '阴', 寅: '阳', 卯: '阴', 辰: '阳', 巳: '阴', 午: '阳', 未: '阴', 申: '阳', 酉: '阴', 戌: '阳', 亥: '阴' };
  var WU_DE = { 木: '仁', 火: '礼', 土: '信', 金: '义', 水: '智' };
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  var YUAN_NO = ['壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌'];

  function hourZhiOf(hour) { return ZHI[Math.floor((hour + 1) / 2) % 12]; }
  // 五鼠遁：日干起子时。甲己日甲子、乙庚日丙子、丙辛日戊子、丁壬日庚子、戊癸日壬子
  function hourGanOf(dayGan, zhi) {
    var zi = (GAN.indexOf(dayGan) % 5) * 2;
    var shift = (ZHI.indexOf(zhi) - ZHI.indexOf('子') + 12) % 12;
    return GAN[(zi + shift) % 10];
  }
  function yin(y) { return y === '阳' ? '刚健外显' : '柔顺内守'; }
  function sheng(me, other) {
    if (other === SHENG[me]) return '得生扶之益';
    if (other === KE[me]) return '受克制之约';
    if (SHENG[other] === me) return '施泄秀之气';
    if (KE[other] === me) return '得财禄之资';
    return '比辅相成';
  }
  function rel(me, other) {
    if (SHENG[me] === other || SHENG[other] === me) return '相生相成';
    if (KE[me] === other || KE[other] === me) return '相持相磨';
    return '平淡相安';
  }
  // 三分支选择（替代深层嵌套三元，避免括号内联歧义）
  function tri(a1, x1, a2, x2, a3, x3, def) {
    if (a1) return x1;
    if (a2) return x2;
    if (a3) return x3;
    return def;
  }

  function query(y, m, d, hour, gender) {
    if (!LUNAR) throw new Error('LUNAR 引擎未加载');
    var q = LUNAR.query(y, m, d, hour == null ? 12 : hour);
    var gz = q.ganzhi;
    var hz = hourZhiOf(hour == null ? 12 : hour);
    var hg = hourGanOf(gz.dayGan, hz);
    var hour8 = hg + hz;

    var four = {
      year8: gz.year8, month8: gz.month8, day8: gz.day8, hour8: hour8,
      yearGan: gz.yearGan, yearZhi: gz.yearZhi,
      monthGan: gz.monthGan, monthZhi: gz.monthZhi,
      dayGan: gz.dayGan, dayZhi: gz.dayZhi,
      hourGan: hg, hourZhi: hz
    };

    var nayinY = q.nayin;
    var nayinD = q.dayNayin;
    var yeW = WUX[gz.yearGan], moW = ZHI_WUX[gz.monthZhi], daW = WUX[gz.dayGan], hoW = ZHI_WUX[hz];
    var yeY = ZHI_YIN[gz.yearZhi], moY = ZHI_YIN[gz.monthZhi], daY = ZHI_YIN[gz.dayZhi], hoY = ZHI_YIN[hz];
    var caiW = KE[daW];
    var wcount = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    [gz.yearGan, gz.monthGan, gz.dayGan, hg, gz.yearZhi, gz.monthZhi, gz.dayZhi, hz].forEach(function (c) {
      var w = WUX[c] || ZHI_WUX[c]; if (w) wcount[w]++;
    });
    var weak = Object.keys(wcount).filter(function (k) { return wcount[k] <= 1; });

    // ---- 八条编号条文（演绎）----
    var entries = [];
    entries.push({ no: YUAN_NO[0], gong: '父母', gz: four.year8,
      text: '父系出' + yeW + '行，性' + yin(yeY) + '，持家以' + WU_DE[yeW] + '为先；母依' + gz.yearZhi + '支' + ZHI_WUX[gz.yearZhi] + '气，温厚而' + (ZHI_YIN[gz.yearZhi] === '阳' ? '有主张' : '主内守') + '。双亲之荫，托年命' + nayinY + '之基。' });
    entries.push({ no: YUAN_NO[1], gong: '兄弟', gz: four.month8,
      text: '同胞之缘，月坐' + moW + '乡，手足' + (moY === '阳' ? '各自挺拔、互不相掩' : '情义内敛、暗相助') + '。月干' + gz.monthGan + '与日主' + sheng(daW, moW) + '，亲族间' + tri(SHENG[moW] === daW, '多得提携', KE[moW] === daW, '时受牵掣', false, '', '平顺无争') + '。' });
    entries.push({ no: YUAN_NO[2], gong: '夫妻', gz: four.day8,
      text: (gender === '女' ? '夫' : '妻') + '宫坐' + daW + '行，对方性情' + yin(daY) + '，归于' + WU_DE[daW] + '德。日主' + gz.dayGan + '与时支' + hz + sheng(daW, hoW) + '，夫妻' + rel(daW, hoW) + '，宜以包容为要。' });
    entries.push({ no: YUAN_NO[3], gong: '子女', gz: hour8,
      text: '子息承' + hoW + '之气，晚景' + (hoY === '阳' ? '外显、子女能干' : '内守、子孙绕膝') + '。时柱' + hour8 + '与日主' + sheng(daW, hoW) + '，育子之道' + tri(SHENG[daW] === hoW, '施与为多', KE[daW] === hoW, '望子成材而责切', false, '', '顺其自然') + '。' });
    entries.push({ no: YUAN_NO[4], gong: '财禄', gz: four.day8,
      text: '日主' + gz.dayGan + '属' + daW + '，财星为' + caiW + '。四柱中' + caiW + '行得' + wcount[caiW] + '字，禄米' + (wcount[caiW] >= 2 ? '丰盈、宜聚宜守' : (wcount[caiW] === 1 ? '中平、勤则有余' : '隐伏、需主动经营')) + '。' });
    var jiText;
    if (weak.length) jiText = '四柱中' + weak.join('、') + '之气偏弱，先天根基略有偏枯，平居宜留意调摄作息、劳逸结合，勿使过劳。';
    else jiText = '五行分布匀停，气数相济，平日少有偏枯之忧，唯仍需规律作息以养元。';
    entries.push({ no: YUAN_NO[5], gong: '疾厄', gz: four.hour8, text: jiText });
    entries.push({ no: YUAN_NO[6], gong: '心性', gz: four.day8,
      text: '日主' + gz.dayGan + '属' + daW + '，得月令' + gz.monthZhi + '（' + moW + '）之' + tri(SHENG[moW] === daW, '生', KE[moW] === daW, '克', moW === daW, '比', '泄') + '助，心性' + yin(daY) + '而归于' + WU_DE[daW] + '德，临事' + (daY === '阳' ? '果决、善开新局' : '沉稳、长于守成') + '。' });
    entries.push({ no: YUAN_NO[7], gong: '三限总论', gz: four.year8 + '·' + four.hour8,
      text: '上元（早年·年柱）立基，中元（中年·月日）建功，下元（晚景·时柱）收成。三限承接，起伏有节，贵在顺势、守中。' });

    // ---- 三限横列 ----
    var yuan = [
      { name: '上元 · 早年', from: '年柱 ' + four.year8 + '（' + nayinY + '）', text: '根基承年命' + nayinY + '之质，' + (yeY === '阳' ? '早岁外向、敢闯' : '早岁内秀、得长辈荫') + '。' },
      { name: '中元 · 中年', from: '月日 ' + four.month8 + ' / ' + four.day8, text: '月令定境、日主立身，' + sheng(daW, moW) + '，中年多' + tri(SHENG[moW] === daW, '进取之机', KE[moW] === daW, '承压之考验', false, '', '平稳之积蓄') + '。' },
      { name: '下元 · 晚景', from: '时柱 ' + hour8, text: '时柱收束，' + (hoY === '阳' ? '晚景开展、声名外达' : '晚景安养、天伦为乐') + '。' }
    ];

    // 考刻基数（确定性装饰数，非古籍）
    var baseNo = (GAN.indexOf(gz.yearGan) * 2 + GAN.indexOf(gz.monthGan) * 3 + GAN.indexOf(gz.dayGan) * 5 + GAN.indexOf(hg) * 7 + ZHI.indexOf(gz.yearZhi) * 11 + ZHI.indexOf(hz) * 13) % 81 + 1;

    return {
      meta: { y: y, m: m, d: d, hour: hour == null ? 12 : hour, gender: gender || '未知', lunar: q.lunar, zodiac: q.zodiac },
      ganzhi: four,
      nayin: { year: nayinY, day: nayinD },
      entries: entries,
      yuan: yuan,
      baseNo: baseNo
    };
  }

  return { query: query, hourZhiOf: hourZhiOf, hourGanOf: hourGanOf };
});
