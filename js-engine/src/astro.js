/**
 * 西占星盘引擎 (Western Astrology Chart Engine) — Equal House 简化版
 *
 * 说明（诚实标注）：
 * 1. 本盘为「本命盘 (Natal Chart)」计算，采用【等宫制 Equal House】：以 ASC(上升点) 为
 *    第 1 宫宫首，每 30° 顺黄道划分十二宫。等宫制不随纬度畸变，稳定可靠；与
 *    Placidus / Koch 等分宫制在高低纬度会有宫位差异，重宫位精确者请知悉。
 * 2. 行星黄经由 astronomy-engine (v2.1.x) 地心黄道坐标算法给出，精度用于占星足够。
 * 3. 南北交 (Rahu/Ketu) 为【平均交点 (Mean Node)】近似（Meeus 公式），非 True Node。
 * 4. ASC/MC 由本地恒星时 (LST) 与黄赤交角推导，非依赖易错星历 API。
 * 5. 逆行 (retrograde) 由前后 1 日黄经变化判定。
 *
 * 本引擎不替代专业占星软件；结果仅供传统文化/象征性参考。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ASTRO = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var A = (typeof Astronomy !== 'undefined') ? Astronomy
    : (typeof globalThis !== 'undefined' && globalThis.Astronomy)
      ? globalThis.Astronomy
      : (typeof window !== 'undefined' && window.Astronomy) ? window.Astronomy : null;

  // ---------- 常量 ----------
  var SIGNS = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];
  var SIGN_SYM = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  var SIGN_EL = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

  var PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  var PLANET_CN = {
    Sun: '太阳', Moon: '月亮', Mercury: '水星', Venus: '金星', Mars: '火星',
    Jupiter: '木星', Saturn: '土星', Uranus: '天王星', Neptune: '海王星', Pluto: '冥王星'
  };

  // 古典守护星 (modern 在括号)：白羊-火 / 金牛-金 / 双子-水 / 巨蟹-月 / 狮子-日 /
  // 处女-水 / 天秤-金 / 天蝎-火(冥) / 射手-木 / 摩羯-土(天) / 水瓶-土(天) / 双鱼-木(海)
  var RULER = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
  var RULER_MODERN = ['Pluto', 'Ceres', 'Chiron', 'Moon', 'Sun', 'Vesta', 'Eris', 'Pluto', 'Neptune', 'Uranus', 'Uranus', 'Neptune'];

  var ELEMENTS = ['火', '土', '风', '水'];
  var ELEMENT_OF = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]; // 白羊火..双鱼水
  var POLARITY = ['阳', '阴']; // 白羊阳..金牛阴
  var POL_OF = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];

  // 主要相位 (主相位 + 容许度)
  var ASPECTS = [
    { name: '合', en: 'Conjunction', ang: 0, orb: 8 },
    { name: '六合', en: 'Sextile', ang: 60, orb: 4 },
    { name: '刑', en: 'Square', ang: 90, orb: 6 },
    { name: '拱', en: 'Trine', ang: 120, orb: 6 },
    { name: '冲', en: 'Opposition', ang: 180, orb: 8 }
  ];

  // 出生城市预设 [纬度, 经度, 标准时区(东正)]
  var CITIES = {
    '北京': [39.9042, 116.4074, 8], '上海': [31.2304, 121.4737, 8],
    '广州': [23.1291, 113.2644, 8], '深圳': [22.5431, 114.0579, 8],
    '成都': [30.5728, 104.0668, 8], '杭州': [30.2741, 120.1551, 8],
    '武汉': [30.5928, 114.3055, 8], '西安': [34.3416, 108.9398, 8],
    '南京': [32.0603, 118.7969, 8], '重庆': [29.5630, 106.5516, 8],
    '天津': [39.3434, 117.3616, 8], '苏州': [31.2989, 120.5853, 8],
    '香港': [22.3193, 114.1694, 8], '台北': [25.0330, 121.5654, 8],
    '沈阳': [41.8057, 123.4315, 8], '哈尔滨': [45.8038, 126.5349, 8],
    '乌鲁木齐': [43.8256, 87.6168, 8], '拉萨': [29.6520, 91.1721, 8],
    '昆明': [25.0389, 102.7183, 8], '东京': [35.6762, 139.6503, 9],
    '首尔': [37.5665, 126.9780, 9], '新加坡': [1.3521, 103.8198, 8],
    '曼谷': [13.7563, 100.5018, 7], '吉隆坡': [3.1390, 101.6869, 8],
    '伦敦': [51.5074, -0.1278, 0], '巴黎': [48.8566, 2.3522, 1],
    '纽约': [40.7128, -74.0060, -5], '洛杉矶': [34.0522, -118.2437, -8],
    '悉尼': [-33.8688, 151.2093, 10], '多伦多': [43.6532, -79.3832, -5]
  };

  // ---------- 工具 ----------
  function deg2rad(d) { return d * Math.PI / 180; }
  function norm360(x) { return ((x % 360) + 360) % 360; }
  function signOf(lon) {
    var idx = Math.floor(norm360(lon) / 30) % 12;
    return { idx: idx, deg: norm360(lon) - idx * 30, sym: SIGN_SYM[idx], name: SIGNS[idx], en: SIGN_EL[idx] };
  }
  function shortLon(lon) {
    var s = signOf(lon);
    return s.name + ' ' + s.deg.toFixed(2) + '°';
  }
  // 黄道圆环最短角差 (-180..180]
  function arcDiff(a, b) { var d = norm360(a) - norm360(b); return ((d + 180) % 360 + 360) % 360 - 180; }

  // 黄赤交角 (Meeus, 度)。jd 为 astronomy-engine 的 MakeTime().ut（自 J2000.0 的日数）
  function obliquity(jd) {
    var T = jd / 36525.0;
    return 23.4392911 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T;
  }

  // 行星(含月亮)地心黄经
  function eclLon(bodyName, date) {
    var v = A.GeoVector(A.Body[bodyName], date, false);
    var e = A.Ecliptic(v);
    return norm360(e.elon);
  }
  // 平均北交点黄经 (Meeus)。jd 为自 J2000.0 的日数
  function meanNorthNode(jd) {
    var T = jd / 36525.0;
    var om = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
    return norm360(om);
  }

  function isRetro(bodyName, date) {
    var e1 = eclLon(bodyName, date);
    var d2 = new Date(date.getTime() + 86400000);
    var e2 = eclLon(bodyName, d2);
    return arcDiff(e2, e1) < 0;
  }

  // 主计算
  function calc(opt) {
    var y = +opt.y, m = +opt.m, d = +opt.d, hh = +opt.hh, mm = +opt.mm || 0;
    var city = opt.city || '北京';
    var tz = (opt.tz != null) ? +opt.tz : (CITIES[city] ? CITIES[city][2] : 8);
    var dst = opt.dst ? 1 : 0;
    var lat = (opt.lat != null) ? +opt.lat : (CITIES[city] ? CITIES[city][0] : 39.9042);
    var lon = (opt.lon != null) ? +opt.lon : (CITIES[city] ? CITIES[city][1] : 116.4074);

    // 本地时间 -> UTC
    var localOffset = tz + dst; // 东正
    var utcMs = Date.UTC(y, m - 1, d, hh - localOffset, mm, 0);
    var utc = new Date(utcMs);

    var jd = A.MakeTime(utc).ut;
    var epsDeg = obliquity(jd);
    var eps = deg2rad(epsDeg);

    // 本地恒星时 (LST)
    var gastDeg = A.SiderealTime(utc) * 15;
    var lstDeg = norm360(gastDeg + lon);
    var ramc = deg2rad(lstDeg);

    // MC 黄经: tanλ = tan(RAMC)/cosε
    var mcRad = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps));
    var mcLon = norm360(mcRad * 180 / Math.PI);
    var icLon = norm360(mcLon + 180);

    // ASC: 东升点 RA = RAMC + 90°, λ = atan2(sinRA, cosRA·cosε)
    var raAsc = deg2rad(norm360(lstDeg + 90));
    var ascRad = Math.atan2(Math.sin(raAsc), Math.cos(raAsc) * Math.cos(eps));
    var ascLon = norm360(ascRad * 180 / Math.PI);
    var descLon = norm360(ascLon + 180);

    // 等宫制：第 i 宫首 = ascLon + (i-1)*30
    var houses = [];
    for (var i = 1; i <= 12; i++) {
      var cusp = norm360(ascLon + (i - 1) * 30);
      var s = signOf(cusp);
      houses.push({
        no: i, cusp: cusp, signIdx: s.idx, signDeg: s.deg,
        sym: s.sym, name: s.name,
        ruler: PLANETS.indexOf(RULER[s.idx]) >= 0 ? RULER[s.idx] : RULER[s.idx],
        rulerCN: PLANET_CN[RULER[s.idx]]
      });
    }

    // 行星
    var planets = [];
    PLANETS.forEach(function (p) {
      var lon2 = eclLon(p, utc);
      var s = signOf(lon2);
      var houseNo = Math.floor(norm360(lon2 - ascLon) / 30) + 1;
      planets.push({
        key: p, cn: PLANET_CN[p], lon: lon2, sym: s.sym, signIdx: s.idx,
        signDeg: s.deg, signName: s.name, house: houseNo,
        retro: isRetro(p, utc)
      });
    });

    // 南北交
    var nn = meanNorthNode(jd);
    var sn = norm360(nn + 180);
    function nodeObj(lon2, key, cn) {
      var s = signOf(lon2);
      return { key: key, cn: cn, lon: lon2, sym: s.sym, signIdx: s.idx, signDeg: s.deg, signName: s.name, house: Math.floor(norm360(lon2 - ascLon) / 30) + 1 };
    }
    var nodes = [nodeObj(nn, 'NorthNode', '北交(Rahu)'), nodeObj(sn, 'SouthNode', '南交(Ketu)')];

    // 角点
    var angles = [
      { key: 'ASC', cn: '上升 ASC', lon: ascLon, sym: signOf(ascLon).sym, signIdx: signOf(ascLon).idx, signDeg: signOf(ascLon).deg, signName: signOf(ascLon).name, house: 1 },
      { key: 'MC', cn: '中天 MC', lon: mcLon, sym: signOf(mcLon).sym, signIdx: signOf(mcLon).idx, signDeg: signOf(mcLon).deg, signName: signOf(mcLon).name, house: 10 },
      { key: 'DSC', cn: '下降 DSC', lon: descLon, sym: signOf(descLon).sym, signIdx: signOf(descLon).idx, signDeg: signOf(descLon).deg, signName: signOf(descLon).name, house: 7 },
      { key: 'IC', cn: '天底 IC', lon: icLon, sym: signOf(icLon).sym, signIdx: signOf(icLon).idx, signDeg: signOf(icLon).deg, signName: signOf(icLon).name, house: 4 }
    ];

    // 相位：planet+node+angle 之间
    var pts = planets.concat(nodes).concat(angles);
    var aspects = [];
    for (var a = 0; a < pts.length; a++) {
      for (var b = a + 1; b < pts.length; b++) {
        var dd = Math.abs(arcDiff(pts[a].lon, pts[b].lon));
        for (var k = 0; k < ASPECTS.length; k++) {
          var asp = ASPECTS[k];
          var diff = Math.abs(dd - asp.ang);
          if (diff <= asp.orb) {
            var exact = diff <= 1.0;
            // applying / separating：用前后1日比较
            var app = null;
            try {
              var la = eclLonApprox(pts[a], utc), lb = eclLonApprox(pts[b], utc);
              var future = arcDiff(pts[a].lon + (la.after - la.before), pts[b].lon + (lb.after - lb.before));
              app = Math.abs(future) < dd;
            } catch (e) { app = null; }
            aspects.push({
              p1: pts[a], p2: pts[b], type: asp.name, en: asp.en, ang: asp.ang,
              orb: diff, exact: exact, applying: app
            });
            break;
          }
        }
      }
    }
    aspects.sort(function (x, y) { return x.orb - y.orb; });

    // 星座/元素/极性统计
    var elemCount = [0, 0, 0, 0]; var polCount = [0, 0];
    planets.forEach(function (p) { elemCount[ELEMENT_OF[p.signIdx]]++; polCount[POL_OF[p.signIdx]]++; });
    var signDist = {}; SIGNS.forEach(function (s, i) { signDist[s] = 0; });
    planets.forEach(function (p) { signDist[p.signName]++; });

    return {
      system: 'Equal House (等宫制)',
      meta: {
        y: y, m: m, d: d, hh: hh, mm: mm, city: city, lat: lat, lon: lon,
        tz: tz, dst: dst, utcISO: utc.toISOString(), utcLocal: utc.toUTCString()
      },
      obliquity: epsDeg, gastDeg: gastDeg, lstDeg: lstDeg,
      ramc: lstDeg,
      asc: { lon: ascLon, sym: signOf(ascLon).sym, name: signOf(ascLon).name, deg: signOf(ascLon).deg },
      desc: { lon: descLon, sym: signOf(descLon).sym, name: signOf(descLon).name, deg: signOf(descLon).deg },
      mc: { lon: mcLon, sym: signOf(mcLon).sym, name: signOf(mcLon).name, deg: signOf(mcLon).deg },
      ic: { lon: icLon, sym: signOf(icLon).sym, name: signOf(icLon).name, deg: signOf(icLon).deg },
      planets: planets,
      nodes: nodes,
      angles: angles,
      houses: houses,
      aspects: aspects,
      stats: { element: elemCount, polarity: polCount, signDist: signDist }
    };
  }

  // 辅助：用于相位 applying 判定的近似黄经变化（点若已有 lon 用其；angle/node 无前后，返回 0）
  function eclLonApprox(pt, utc) {
    if (pt.key && A && A.Body && A.Body[pt.key]) {
      var before = eclLon(pt.key, new Date(utc.getTime() - 86400000));
      var after = eclLon(pt.key, new Date(utc.getTime() + 86400000));
      return { before: before, after: after };
    }
    return { before: pt.lon, after: pt.lon };
  }

  return {
    calc: calc,
    SIGNS: SIGNS, SIGN_SYM: SIGN_SYM, SIGN_EL: SIGN_EL,
    PLANETS: PLANETS, PLANET_CN: PLANET_CN, CITIES: CITIES,
    ASPECTS: ASPECTS, RULER: RULER, ELEMENTS: ELEMENTS
  };
});
