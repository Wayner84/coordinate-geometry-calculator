function requirePoints(points, min, max = min) {
  if (!Array.isArray(points) || points.length < min || points.length > max) throw new RangeError(`Between ${min} and ${max} points are required`);
  for (const point of points) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new RangeError('Every coordinate must be a finite number');
  }
}

function direction(dx, dy) { return ((Math.atan2(dy, dx) * 180 / Math.PI) % 180 + 180) % 180; }

export function calculateCircle(points) {
  requirePoints(points, 3, 3);
  const [a, b, c] = points;
  const determinant = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  const scale = Math.max(1, ...points.flatMap((point) => [Math.abs(point.x), Math.abs(point.y)]));
  if (Math.abs(determinant) <= 1e-12 * scale * scale) throw new RangeError('The three points are collinear or too close to a straight line');
  const aa = a.x ** 2 + a.y ** 2, bb = b.x ** 2 + b.y ** 2, cc = c.x ** 2 + c.y ** 2;
  const centre = { x: (aa * (b.y - c.y) + bb * (c.y - a.y) + cc * (a.y - b.y)) / determinant, y: (aa * (c.x - b.x) + bb * (a.x - c.x) + cc * (b.x - a.x)) / determinant };
  const radius = Math.hypot(a.x - centre.x, a.y - centre.y);
  if (![centre.x, centre.y, radius].every(Number.isFinite)) throw new RangeError('The circle exceeds the supported finite numeric range');
  return { centre, radius, diameter: radius * 2 };
}

export function fitCircle(points) {
  requirePoints(points, 3, 50);
  let sx = 0, sy = 0;
  for (const p of points) { sx += p.x; sy += p.y; }
  const ox = sx / points.length, oy = sy / points.length;
  let suu = 0, suv = 0, svv = 0, suw = 0, svw = 0;
  for (const p of points) { const u = p.x - ox, v = p.y - oy, w = u * u + v * v; suu += u*u; suv += u*v; svv += v*v; suw += u*w; svw += v*w; }
  const det = suu * svv - suv * suv;
  if (Math.abs(det) <= 1e-14) throw new RangeError('The points are collinear or too close to a straight line');
  const alpha = (suw * svv - svw * suv) / det, beta = (svw * suu - suw * suv) / det;
  const centre = { x: ox + alpha / 2, y: oy + beta / 2 };
  const radii = points.map((p) => Math.hypot(p.x - centre.x, p.y - centre.y));
  const averageRadius = radii.reduce((a, b) => a + b, 0) / radii.length;
  const minRadius = Math.min(...radii), maxRadius = Math.max(...radii);
  return { points, centre, radii, averageRadius, averageDiameter: averageRadius * 2, minRadius, maxRadius, minDiameter: minRadius * 2, maxDiameter: maxRadius * 2 };
}

export function fitLine(points) {
  requirePoints(points, 2, 50);
  const centre = points.reduce((sum, p) => ({ x: sum.x + p.x / points.length, y: sum.y + p.y / points.length }), { x: 0, y: 0 });
  let xx = 0, xy = 0, yy = 0;
  for (const p of points) { const x = p.x - centre.x, y = p.y - centre.y; xx += x*x; xy += x*y; yy += y*y; }
  if (xx + yy <= 1e-24) throw new RangeError('Each line needs two different points; zero length is not valid');
  const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  const directionDegrees = ((angle * 180 / Math.PI) % 180 + 180) % 180;
  return { points, centre, direction, directionDegrees, length: Math.sqrt(xx + yy) };
}

export function calculateLineAngle(firstPoints, secondPoints) {
  if (!secondPoints && Array.isArray(firstPoints) && firstPoints.length === 4) { secondPoints = firstPoints.slice(2); firstPoints = firstPoints.slice(0, 2); }
  const lines = [fitLine(firstPoints), fitLine(secondPoints)];
  const dot = lines[0].direction.x * lines[1].direction.x + lines[0].direction.y * lines[1].direction.y;
  const cross = lines[0].direction.x * lines[1].direction.y - lines[0].direction.y * lines[1].direction.x;
  const smallerDegrees = Math.atan2(Math.abs(cross), Math.abs(dot)) * 180 / Math.PI;
  return { lines, smallerDegrees, supplementaryDegrees: 180 - smallerDegrees, directedDegrees: Math.atan2(Math.abs(cross), dot) * 180 / Math.PI };
}

export function calculateLineAngles(points) {
  requirePoints(points, 4, 4);
  const result = calculateLineAngle(points.slice(0, 2), points.slice(2));
  return { ...result, firstDirectionDegrees: direction(points[1].x - points[0].x, points[1].y - points[0].y), secondDirectionDegrees: direction(points[3].x - points[2].x, points[3].y - points[2].y), directedDegrees: Math.atan2(Math.abs((points[1].x-points[0].x)*(points[3].y-points[2].y)-(points[1].y-points[0].y)*(points[3].x-points[2].x)), (points[1].x-points[0].x)*(points[3].x-points[2].x)+(points[1].y-points[0].y)*(points[3].y-points[2].y)) * 180 / Math.PI, firstLength: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y), secondLength: Math.hypot(points[3].x - points[2].x, points[3].y - points[2].y) };
}

export function formatNumber(value) { if (!Number.isFinite(value)) return '—'; const clean = Math.abs(value) < 5e-13 ? 0 : value; return Number.parseFloat(clean.toFixed(6)).toString(); }
