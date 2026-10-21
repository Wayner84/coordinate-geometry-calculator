function requirePoints(points, count) {
  if (!Array.isArray(points) || points.length !== count) throw new RangeError(`Exactly ${count} points are required`);
  for (const point of points) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new RangeError('Every coordinate must be a finite number');
  }
}

export function calculateCircle(points) {
  requirePoints(points, 3);
  const [a, b, c] = points;
  const determinant = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  const scale = Math.max(1, ...points.flatMap((point) => [Math.abs(point.x), Math.abs(point.y)]));
  if (Math.abs(determinant) <= 1e-12 * scale * scale) throw new RangeError('The three points are collinear or too close to a straight line');
  const aa = a.x ** 2 + a.y ** 2;
  const bb = b.x ** 2 + b.y ** 2;
  const cc = c.x ** 2 + c.y ** 2;
  const centre = {
    x: (aa * (b.y - c.y) + bb * (c.y - a.y) + cc * (a.y - b.y)) / determinant,
    y: (aa * (c.x - b.x) + bb * (a.x - c.x) + cc * (b.x - a.x)) / determinant,
  };
  const radius = Math.hypot(a.x - centre.x, a.y - centre.y);
  if (![centre.x, centre.y, radius].every(Number.isFinite)) throw new RangeError('The circle exceeds the supported finite numeric range');
  return { centre, radius, diameter: radius * 2 };
}

export function calculateLineAngles(points) {
  requirePoints(points, 4);
  const [a, b, c, d] = points;
  const first = { x: b.x - a.x, y: b.y - a.y };
  const second = { x: d.x - c.x, y: d.y - c.y };
  const firstLength = Math.hypot(first.x, first.y);
  const secondLength = Math.hypot(second.x, second.y);
  if (!(firstLength > 0) || !(secondLength > 0)) throw new RangeError('Each line needs two different points; zero length is not valid');
  const dot = first.x * second.x + first.y * second.y;
  const cross = first.x * second.y - first.y * second.x;
  const smallerDegrees = Math.atan2(Math.abs(cross), Math.abs(dot)) * 180 / Math.PI;
  const directedDegrees = Math.atan2(Math.abs(cross), dot) * 180 / Math.PI;
  const direction = (vector) => ((Math.atan2(vector.y, vector.x) * 180 / Math.PI) % 180 + 180) % 180;
  return {
    smallerDegrees,
    supplementaryDegrees: 180 - smallerDegrees,
    directedDegrees,
    firstDirectionDegrees: direction(first),
    secondDirectionDegrees: direction(second),
    firstLength,
    secondLength,
  };
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) return '—';
  const clean = Math.abs(value) < 5e-13 ? 0 : value;
  return Number.parseFloat(clean.toFixed(6)).toString();
}
