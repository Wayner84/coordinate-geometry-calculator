import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCircle, calculateLineAngles, fitCircle, fitLine, calculateLineAngle } from '../src/geometry.js';

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

test('fitCircle accepts 3 to 50 points and returns best-fit centre with shared-centre envelopes', () => {
  const result = fitCircle([{x:0,y:5.1},{x:5,y:0},{x:0,y:-4.9},{x:-5,y:0}]);
  close(result.centre.x, 0, 1e-6); close(result.centre.y, 0.09999, 1e-5);
  close(result.averageRadius, 5, 0.1);
  assert.ok(result.minDiameter < result.averageDiameter);
  assert.ok(result.maxDiameter > result.averageDiameter);
  assert.equal(result.points.length, 4);
  assert.throws(() => fitCircle([{x:0,y:0},{x:1,y:1}]), /3.*50|points/i);
});

test('fitLine uses orthogonal total least squares for any 2 to 50 measured points', () => {
  const result = fitLine([{x:-2,y:-4.1},{x:-1,y:-2.1},{x:0,y:0.2},{x:1,y:1.9},{x:2,y:4.1}]);
  close(result.directionDegrees, Math.atan2(2,1)*180/Math.PI, 2);
  close(result.centre.x, 0); close(result.centre.y, 0, .1);
  assert.equal(result.points.length, 5);
  assert.throws(() => fitLine([{x:0,y:0}]), /2.*50|points/i);
});

test('line angle fits two independent measured point sets', () => {
  const result = calculateLineAngle([{x:0,y:0},{x:1,y:1},{x:2,y:0},{x:2,y:2}]);
  close(result.smallerDegrees, 45, 1e-8);
  assert.equal(result.lines.length, 2);
});
