// node 对照测试: JS 引擎 vs Python 基线 (baseline.json)
const BZ = require('../src/engine.js');
const base = require('./baseline.json');

const inputMap = {
  '邓小平': { year: 1904, month: 8, day: 22, hour: 4, minute: 0, gender: 'male' },
  '子时边界': { year: 2000, month: 1, day: 15, hour: 0, minute: 0, gender: 'male' },
  '立春边界': { year: 2026, month: 2, day: 10, hour: 10, minute: 0, gender: 'male' },
  '1990男': { year: 1990, month: 5, day: 20, hour: 10, minute: 0, gender: 'male' },
};
function pad(n) { return (n < 10 ? '0' : '') + n; }
function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

let fail = 0, pass = 0;
function ck(cond, label, got, exp) {
  if (cond) { pass++; }
  else { fail++; console.log('  ✗ FAIL', label, '\n      got=', JSON.stringify(got), '\n      exp=', JSON.stringify(exp)); }
}

// 1) 四柱 + 大运
for (const b of base.bazi) {
  const r = BZ.analyzeBazi(inputMap[b.name]);
  const p = r.pillars.pillars;
  const four = { year: p.year.gz, month: p.month.gz, day: p.day.gz, hour: p.hour.gz };
  ck(JSON.stringify(four) === JSON.stringify(b.four),
    b.name + ' 四柱', four, b.four);
  ck(r.dayun.direction === b.dayun_dir, b.name + ' 大运方向', r.dayun.direction, b.dayun_dir);
  ck(r.dayun.start_age_display === b.dayun_start, b.name + ' 起运', r.dayun.start_age_display, b.dayun_start);
  const seq3 = r.dayun.sequence.slice(0, 3).map(s => s.gz);
  ck(JSON.stringify(seq3) === JSON.stringify(b.dayun_seq3), b.name + ' 大运前三', seq3, b.dayun_seq3);
  ck(r.pillars.lunar_display === b.lunar, b.name + ' 农历', r.pillars.lunar_display, b.lunar);
  ck(r.pillars.animal === b.animal, b.name + ' 生肖', r.pillars.animal, b.animal);
}

// 2) 黄历
for (const a of base.almanac) {
  const r = BZ.queryAlmanac(a.solar);
  ck(r.ganzhi.day === a.ganzhi_day, a.solar + ' 日干支', r.ganzhi.day, a.ganzhi_day);
  ck(r.jianchu.name === a.jianchu, a.solar + ' 建除', r.jianchu.name, a.jianchu);
  ck(r.lunar_display === a.lunar, a.solar + ' 农历', r.lunar_display, a.lunar);
  ck(r.yiji['宜'][0] === a.yi[0], a.solar + ' 宜[0]', r.yiji['宜'][0], a.yi[0]);
  ck(r.yiji['忌'][0] === a.ji[0], a.solar + ' 忌[0]', r.yiji['忌'][0], a.ji[0]);
}

// 3) 农历 -> 公历
for (const x of base.lunar_to_solar) {
  const sd = BZ.lunarToSolar(x.y, x.m, x.d, x.leap);
  ck(iso(sd) === x.got, `农历${x.y}-${x.m}${x.leap ? '闰' : ''}-${x.d}→公历`, iso(sd), x.got);
}

// 4) 公历 -> 农历
for (const x of base.solar_to_lunar) {
  const [y, m, d] = x.s.split('-').map(Number);
  const ld = BZ.solarToLunar(new Date(y, m - 1, d));
  const got = [ld.year, ld.month, ld.day, ld.isLeap];
  ck(JSON.stringify(got) === JSON.stringify(x.got), `公历${x.s}→农历`, got, x.got);
}

// 5) 立春
for (const y in base.lichun) {
  const lc = BZ.lichunOf(+y);
  const got = pad(lc.getMonth() + 1) + '-' + pad(lc.getDate());
  ck(got === base.lichun[y], y + ' 立春', got, base.lichun[y]);
}

console.log(`\n对照测试完成: PASS=${pass}  FAIL=${fail}`);
process.exit(fail ? 1 : 0);
