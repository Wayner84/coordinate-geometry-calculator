import { calculateCircle, calculateLineAngles, formatNumber } from './geometry.js';

const $ = (id) => document.getElementById(id);
const readPoints = (form, names) => {
  const data = new FormData(form);
  const values = names.map((name) => Number(data.get(name)));
  if (!values.every(Number.isFinite)) throw new RangeError('Enter every X and Y coordinate as a finite number');
  return Array.from({ length: values.length / 2 }, (_, index) => ({ x: values[index * 2], y: values[index * 2 + 1] }));
};
const setError = (element, error) => { element.textContent = error.message; element.style.display = 'block'; };
const clearError = (element) => { element.textContent = ''; element.style.display = 'none'; };
const setOutput = (id, value, suffix = '') => { $(id).value = `${formatNumber(value)}${suffix}`; };

const state = { circle: null, lines: null };
const canvases = { circle: $('circle-plot'), lines: $('angle-plot') };

function prepareCanvas(canvas) {
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(canvas.clientWidth * ratio);
  canvas.height = Math.round(canvas.clientHeight * ratio);
  const context = canvas.getContext('2d');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  return context;
}

function drawPoint(context, x, y, label, colour) {
  context.beginPath(); context.arc(x, y, 6, 0, Math.PI * 2); context.fillStyle = colour; context.fill();
  context.strokeStyle = '#101613'; context.lineWidth = 2; context.stroke();
  context.fillStyle = '#f5f2e9'; context.font = '700 12px Segoe UI'; context.fillText(label, x + 10, y - 8);
}

function drawCircle() {
  const canvas = canvases.circle, context = prepareCanvas(canvas), width = canvas.clientWidth, height = canvas.clientHeight;
  if (!state.circle) return;
  const { points, result } = state.circle;
  const scale = Math.min((width - 70) / (result.radius * 2), (height - 70) / (result.radius * 2));
  const sx = (x) => width / 2 + (x - result.centre.x) * scale;
  const sy = (y) => height / 2 - (y - result.centre.y) * scale;
  context.beginPath(); context.arc(width / 2, height / 2, result.radius * scale, 0, Math.PI * 2);
  context.fillStyle = 'rgba(85,215,171,.08)'; context.fill(); context.strokeStyle = '#55d7ab'; context.lineWidth = 3; context.stroke();
  points.forEach((point, index) => drawPoint(context, sx(point.x), sy(point.y), String(index + 1), '#55d7ab'));
  context.beginPath(); context.arc(width / 2, height / 2, 4, 0, Math.PI * 2); context.fillStyle = '#f5f2e9'; context.fill();
}

function intersection([a, b, c, d]) {
  const first = { x: b.x - a.x, y: b.y - a.y }, second = { x: d.x - c.x, y: d.y - c.y };
  const cross = first.x * second.y - first.y * second.x;
  if (Math.abs(cross) < 1e-12) return null;
  const t = ((c.x - a.x) * second.y - (c.y - a.y) * second.x) / cross;
  return { x: a.x + t * first.x, y: a.y + t * first.y };
}

function drawLines() {
  const canvas = canvases.lines, context = prepareCanvas(canvas), width = canvas.clientWidth, height = canvas.clientHeight;
  if (!state.lines) return;
  const { points, result } = state.lines;
  const focus = [...points]; const crossing = intersection(points);
  const rawSpan = Math.max(1, ...points.flatMap((point) => [Math.abs(point.x), Math.abs(point.y)]));
  if (crossing && Math.abs(crossing.x) < rawSpan * 8 && Math.abs(crossing.y) < rawSpan * 8) focus.push(crossing);
  let minX = Math.min(...focus.map((point) => point.x)), maxX = Math.max(...focus.map((point) => point.x));
  let minY = Math.min(...focus.map((point) => point.y)), maxY = Math.max(...focus.map((point) => point.y));
  const span = Math.max(maxX - minX, maxY - minY, 1), margin = span * .25;
  minX -= margin; maxX += margin; minY -= margin; maxY += margin;
  const scale = Math.min((width - 50) / (maxX - minX), (height - 50) / (maxY - minY));
  const centreX = (minX + maxX) / 2, centreY = (minY + maxY) / 2;
  const sx = (x) => width / 2 + (x - centreX) * scale, sy = (y) => height / 2 - (y - centreY) * scale;
  const drawInfinite = (a, b, colour) => {
    const x = sx(a.x), y = sy(a.y), dx = sx(b.x) - x, dy = sy(b.y) - y, length = Math.hypot(dx, dy);
    context.beginPath(); context.moveTo(x - dx / length * 2000, y - dy / length * 2000); context.lineTo(x + dx / length * 2000, y + dy / length * 2000);
    context.strokeStyle = colour; context.globalAlpha = .35; context.lineWidth = 2; context.setLineDash([8, 7]); context.stroke(); context.setLineDash([]); context.globalAlpha = 1;
    context.beginPath(); context.moveTo(x, y); context.lineTo(sx(b.x), sy(b.y)); context.strokeStyle = colour; context.lineWidth = 4; context.stroke();
  };
  drawInfinite(points[0], points[1], '#55d7ab'); drawInfinite(points[2], points[3], '#68aef1');
  points.forEach((point, index) => drawPoint(context, sx(point.x), sy(point.y), 'ABCD'[index], index < 2 ? '#55d7ab' : '#68aef1'));
  if (crossing) { context.beginPath(); context.arc(sx(crossing.x), sy(crossing.y), 4, 0, Math.PI * 2); context.fillStyle = '#efb84f'; context.fill(); context.fillStyle = '#efb84f'; context.font = '700 13px Consolas'; context.fillText(`${formatNumber(result.smallerDegrees)}°`, sx(crossing.x) + 10, sy(crossing.y) + 20); }
}

function calculateCircleForm(event) {
  event?.preventDefault();
  try {
    const points = readPoints($('circle-form'), ['x1', 'y1', 'x2', 'y2', 'x3', 'y3']);
    const result = calculateCircle(points); state.circle = { points, result }; clearError($('circle-error'));
    setOutput('centre-x', result.centre.x); setOutput('centre-y', result.centre.y); setOutput('radius', result.radius); setOutput('diameter', result.diameter); drawCircle();
  } catch (error) { state.circle = null; setError($('circle-error'), error); drawCircle(); }
}

function calculateAngleForm(event) {
  event?.preventDefault();
  try {
    const points = readPoints($('angle-form'), ['ax', 'ay', 'bx', 'by', 'cx', 'cy', 'dx', 'dy']);
    const result = calculateLineAngles(points); state.lines = { points, result }; clearError($('angle-error'));
    setOutput('small-angle', result.smallerDegrees, '°'); setOutput('large-angle', result.supplementaryDegrees, '°'); setOutput('directed-angle', result.directedDegrees, '°');
    setOutput('line1-direction', result.firstDirectionDegrees, '°'); setOutput('line2-direction', result.secondDirectionDegrees, '°'); setOutput('line1-length', result.firstLength); setOutput('line2-length', result.secondLength); drawLines();
  } catch (error) { state.lines = null; setError($('angle-error'), error); drawLines(); }
}

const tabs = [[$('circle-tab'), $('circle-panel')], [$('angle-tab'), $('angle-panel')]];
tabs.forEach(([tab]) => tab.addEventListener('click', () => { tabs.forEach(([candidate, panel]) => { const active = candidate === tab; candidate.setAttribute('aria-selected', String(active)); panel.hidden = !active; }); requestAnimationFrame(resize); }));
$('circle-form').addEventListener('submit', calculateCircleForm); $('angle-form').addEventListener('submit', calculateAngleForm);
function resize() { if (!$('circle-panel').hidden) drawCircle(); if (!$('angle-panel').hidden) drawLines(); }
window.addEventListener('resize', resize); new ResizeObserver(resize).observe(document.querySelector('main'));
calculateCircleForm(); calculateAngleForm();
if (new URLSearchParams(window.location.search).get('mode') === 'angle') $('angle-tab').click();
