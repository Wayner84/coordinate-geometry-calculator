import { fitCircle, calculateLineAngle, formatNumber } from './geometry.js';

const $ = id => document.getElementById(id);
const clampCount = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Math.round(Number(value) || minimum)));
const state = { circle: null, lines: null };

const defaults = {
  circle: [
    { x: 10, y: 0 }, { x: 5, y: 8.66 }, { x: -5, y: 8.66 },
    { x: -10, y: 0 }, { x: -5, y: -8.66 }, { x: 5, y: -8.66 },
  ],
  line1: [{ x: 0, y: 0 }, { x: 5, y: 0.1 }, { x: 10, y: 0 }],
  line2: [{ x: 0, y: 0 }, { x: 5, y: 5.1 }, { x: 10, y: 10 }],
};

function pointRow(prefix, index, point, colourClass) {
  const row = document.createElement('div');
  row.className = `point ${colourClass}`;
  row.innerHTML = `<b>${index + 1}</b><label>X<input name="${prefix}x${index}" type="number" step="any" required></label><label>Y<input name="${prefix}y${index}" type="number" step="any" required></label>`;
  row.querySelector(`[name="${prefix}x${index}"]`).value = point?.x ?? '';
  row.querySelector(`[name="${prefix}y${index}"]`).value = point?.y ?? '';
  return row;
}

function currentValues(container) {
  return [...container.querySelectorAll('.point')].map(row => {
    const inputs = row.querySelectorAll('input');
    return { x: inputs[0].value, y: inputs[1].value };
  });
}

function makeRows(container, prefix, count, initial, colourClass) {
  const existing = currentValues(container);
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < count; index += 1) {
    fragment.append(pointRow(prefix, index, existing[index] ?? initial[index] ?? { x: '', y: '' }, colourClass));
  }
  container.replaceChildren(fragment);
}

function readPoints(form, prefix, count) {
  return Array.from({ length: count }, (_, index) => {
    const xText = form.elements[`${prefix}x${index}`].value.trim();
    const yText = form.elements[`${prefix}y${index}`].value.trim();
    if (!xText || !yText) throw new RangeError(`Enter X and Y for point ${index + 1}`);
    const point = { x: Number(xText), y: Number(yText) };
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new RangeError(`Point ${index + 1} must contain finite numbers`);
    return point;
  });
}

function setOutput(id, value, suffix = '') {
  $(id).value = `${formatNumber(value)}${suffix}`;
}

function setError(id, error) {
  $(id).textContent = error?.message ?? '';
}

function prepareCanvas(canvas) {
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext('2d');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  return { context, width, height };
}

function drawPoint(context, x, y, label, colour) {
  context.beginPath();
  context.arc(x, y, 5, 0, Math.PI * 2);
  context.fillStyle = colour;
  context.fill();
  context.strokeStyle = '#160b18';
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = '#fff4fb';
  context.font = '700 11px Manrope, sans-serif';
  context.fillText(label, x + 8, y - 7);
}

function drawCircle() {
  const canvas = $('circle-plot');
  const { context, width, height } = prepareCanvas(canvas);
  if (!state.circle) return;
  const { points, result } = state.circle;
  const padding = 44;
  const scale = Math.min((width - padding * 2) / (result.maxRadius * 2), (height - padding * 2) / (result.maxRadius * 2));
  const sx = x => width / 2 + (x - result.centre.x) * scale;
  const sy = y => height / 2 - (y - result.centre.y) * scale;

  const ring = (radius, colour, dash, lineWidth) => {
    context.beginPath();
    context.arc(width / 2, height / 2, radius * scale, 0, Math.PI * 2);
    context.strokeStyle = colour;
    context.lineWidth = lineWidth;
    context.setLineDash(dash);
    context.stroke();
    context.setLineDash([]);
  };

  context.beginPath();
  context.arc(width / 2, height / 2, result.averageRadius * scale, 0, Math.PI * 2);
  context.fillStyle = 'rgba(255,79,195,.08)';
  context.fill();
  ring(result.minRadius, '#ff87d7', [7, 6], 2);
  ring(result.maxRadius, '#c77dff', [12, 7], 2);
  ring(result.averageRadius, '#ff4fc3', [], 3);
  points.forEach((point, index) => drawPoint(context, sx(point.x), sy(point.y), String(index + 1), '#fff4fb'));
  context.beginPath();
  context.arc(width / 2, height / 2, 4, 0, Math.PI * 2);
  context.fillStyle = '#ff4fc3';
  context.fill();
}

function drawLines() {
  const canvas = $('line-plot');
  const { context, width, height } = prepareCanvas(canvas);
  if (!state.lines) return;
  const { firstPoints, secondPoints, result } = state.lines;
  const all = [...firstPoints, ...secondPoints];
  let minX = Math.min(...all.map(point => point.x));
  let maxX = Math.max(...all.map(point => point.x));
  let minY = Math.min(...all.map(point => point.y));
  let maxY = Math.max(...all.map(point => point.y));
  const span = Math.max(maxX - minX, maxY - minY, 1);
  const margin = span * 0.25;
  minX -= margin; maxX += margin; minY -= margin; maxY += margin;
  const scale = Math.min((width - 50) / (maxX - minX), (height - 50) / (maxY - minY));
  const centreX = (minX + maxX) / 2;
  const centreY = (minY + maxY) / 2;
  const sx = x => width / 2 + (x - centreX) * scale;
  const sy = y => height / 2 - (y - centreY) * scale;

  const drawFit = (line, colour) => {
    const cx = sx(line.centre.x);
    const cy = sy(line.centre.y);
    const dx = line.direction.x * 2000;
    const dy = -line.direction.y * 2000;
    context.beginPath();
    context.moveTo(cx - dx, cy - dy);
    context.lineTo(cx + dx, cy + dy);
    context.strokeStyle = colour;
    context.lineWidth = 3;
    context.stroke();
  };

  drawFit(result.lines[0], '#ff4fc3');
  drawFit(result.lines[1], '#c77dff');
  firstPoints.forEach((point, index) => drawPoint(context, sx(point.x), sy(point.y), `1.${index + 1}`, '#ff4fc3'));
  secondPoints.forEach((point, index) => drawPoint(context, sx(point.x), sy(point.y), `2.${index + 1}`, '#c77dff'));
}

const circleCount = $('circle-count');
const line1Count = $('line1-count');
const line2Count = $('line2-count');
const circleRows = $('circle-rows');
const line1Rows = $('line1-rows');
const line2Rows = $('line2-rows');

function updateCircleRows() {
  const count = clampCount(circleCount.value, 3, 50);
  circleCount.value = String(count);
  makeRows(circleRows, 'p', count, defaults.circle, 'circle-point');
}
function updateLine1Rows() {
  const count = clampCount(line1Count.value, 2, 50);
  line1Count.value = String(count);
  makeRows(line1Rows, 'a', count, defaults.line1, 'line-one-point');
}
function updateLine2Rows() {
  const count = clampCount(line2Count.value, 2, 50);
  line2Count.value = String(count);
  makeRows(line2Rows, 'b', count, defaults.line2, 'line-two-point');
}

circleCount.addEventListener('change', updateCircleRows);
line1Count.addEventListener('change', updateLine1Rows);
line2Count.addEventListener('change', updateLine2Rows);
updateCircleRows();
updateLine1Rows();
updateLine2Rows();

function calculateCircleForm(event) {
  event?.preventDefault();
  try {
    const points = readPoints($('circle-form'), 'p', Number(circleCount.value));
    const result = fitCircle(points);
    state.circle = { points, result };
    setOutput('circle-centre-x', result.centre.x);
    setOutput('circle-centre-y', result.centre.y);
    setOutput('circle-average-diameter', result.averageDiameter);
    setOutput('circle-min-diameter', result.minDiameter);
    setOutput('circle-max-diameter', result.maxDiameter);
    setOutput('circle-radial-range', result.maxRadius - result.minRadius);
    setError('circle-error');
    drawCircle();
  } catch (error) {
    state.circle = null;
    setError('circle-error', error);
    drawCircle();
  }
}

function calculateLineForm(event) {
  event?.preventDefault();
  try {
    const firstPoints = readPoints($('line-form'), 'a', Number(line1Count.value));
    const secondPoints = readPoints($('line-form'), 'b', Number(line2Count.value));
    const result = calculateLineAngle(firstPoints, secondPoints);
    state.lines = { firstPoints, secondPoints, result };
    setOutput('line-angle', result.smallerDegrees, '°');
    setOutput('line-other-angle', result.supplementaryDegrees, '°');
    setOutput('line-directed-angle', result.directedDegrees, '°');
    setOutput('line1-direction', result.lines[0].directionDegrees, '°');
    setOutput('line2-direction', result.lines[1].directionDegrees, '°');
    setError('line-error');
    drawLines();
  } catch (error) {
    state.lines = null;
    setError('line-error', error);
    drawLines();
  }
}

$('circle-form').addEventListener('submit', calculateCircleForm);
$('line-form').addEventListener('submit', calculateLineForm);

const tabs = [['circle-tab', 'circle-panel'], ['line-tab', 'line-panel']];
for (const [tabId] of tabs) {
  $(tabId).addEventListener('click', () => {
    for (const [candidateId, panelId] of tabs) {
      const active = candidateId === tabId;
      $(candidateId).setAttribute('aria-selected', String(active));
      $(panelId).hidden = !active;
    }
    requestAnimationFrame(resize);
  });
}

function resize() {
  if (!$('circle-panel').hidden) drawCircle();
  if (!$('line-panel').hidden) drawLines();
}
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(document.querySelector('main'));
calculateCircleForm();
calculateLineForm();
if (new URLSearchParams(window.location.search).get('mode') === 'line') $('line-tab').click();
