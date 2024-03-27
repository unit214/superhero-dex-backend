import { getPaths, Edge } from './paths';

it('a direct path', () => {
  const edges: Edge<string, string>[] = [
    { data: 'a_b', t0: 'a', t1: 'b' },
    { data: 'b_c', t0: 'b', t1: 'c' },
  ];

  expect(getPaths('a', 'b', edges)).toStrictEqual([['a_b']]);
});

it('a path with one in the middle', () => {
  const edges: Edge<string, string>[] = [
    { data: 'a_b', t0: 'a', t1: 'b' },
    { data: 'b_c', t0: 'b', t1: 'c' },
  ];

  expect(getPaths('a', 'c', edges)).toStrictEqual([['a_b', 'b_c']]);
});

it('a path with two in the middle and a direct one', () => {
  const edges: Edge<string, string>[] = [
    { data: 'a_b', t0: 'a', t1: 'b' },
    { data: 'b_c', t0: 'b', t1: 'c' },
    { data: 'c_a', t0: 'c', t1: 'a' },
    { data: 'a_d', t0: 'a', t1: 'd' },
    { data: 'd_c', t0: 'd', t1: 'c' },
  ];
  expect(getPaths('a', 'c', edges)).toStrictEqual([
    ['c_a'],
    ['a_b', 'b_c'],
    ['a_d', 'd_c'],
  ]);
});

it('result should not be affected by edges not fully involved', () => {
  const edges: Edge<string, string>[] = [
    { data: 'a_b', t0: 'a', t1: 'b' },
    { data: 'b_c', t0: 'b', t1: 'c' },
    { data: 'c_a', t0: 'c', t1: 'a' },

    { data: 'a_d', t0: 'a', t1: 'd' },
    { data: 'd_f', t0: 'd', t1: 'f' },
    { data: 'f_g', t0: 'f', t1: 'g' },
  ];
  expect(getPaths('a', 'c', edges)).toStrictEqual([['c_a'], ['a_b', 'b_c']]);
});

it('result should not be affected by longer paths', () => {
  const edges: Edge<string, string>[] = [
    { data: 'a_b', t0: 'a', t1: 'b' },
    { data: 'b_c', t0: 'b', t1: 'c' },
    { data: 'c_a', t0: 'c', t1: 'a' },

    { data: 'a_d', t0: 'a', t1: 'd' },
    { data: 'd_b', t0: 'd', t1: 'b' },
  ];
  expect(getPaths('a', 'c', edges)).toStrictEqual([['c_a'], ['a_b', 'b_c']]);
});
