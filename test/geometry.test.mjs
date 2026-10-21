import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCircle, calculateLineAngles } from '../src/geometry.js';

const close = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test('three points produce centre, radius and diameter', () => {
  const result = calculateCircle([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 5 }]);
  close(result.centre.x, 5);
  close(result.centre.y, 0);
  close(result.radius, 5);
  close(result.diameter, 10);
});

test('collinear points do not produce a fabricated circle', () => {
  assert.throws(() => calculateCircle([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }]), /collinear|straight line/i);
});

test('two measured lines produce smaller, supplementary and directed angles', () => {
  const result = calculateLineAngles([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 10 }]);
  close(result.smallerDegrees, 45);
  close(result.supplementaryDegrees, 135);
  close(result.directedDegrees, 45);
  close(result.firstDirectionDegrees, 0);
  close(result.secondDirectionDegrees, 45);
  close(result.firstLength, 10);
  close(result.secondLength, Math.sqrt(200));
});

test('opposite parallel vectors still represent a zero-degree line angle', () => {
  const result = calculateLineAngles([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 7, y: 7 }, { x: 5, y: 5 }]);
  close(result.smallerDegrees, 0);
  close(result.directedDegrees, 180);
});

test('zero-length and non-finite geometry is rejected', () => {
  assert.throws(() => calculateLineAngles([{ x: 1, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }]), /different points|zero length/i);
  assert.throws(() => calculateCircle([{ x: NaN, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]), /finite/i);
});
