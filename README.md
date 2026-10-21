# Coordinate Geometry Calculator

A dependency-free browser tool for common XY coordinate calculations:

- Calculate the centre, radius and diameter of the circle through three measured points.
- Calculate the smaller and supplementary angles between two lines defined by four points.
- Show the directed A→B to C→D angle, each line direction, and measured segment lengths.
- Plot the resulting circle or lines on equally scaled axes.

All values stay in the browser tab. The application has no analytics, backend, account, or upload feature.

## Use locally

Open `index.html` in a modern browser, or serve the repository with any static HTTP server.

## Verify

```sh
npm test
npm run check
```

## Numerical conventions

- Coordinates are unitless: results use the same unit as the entered coordinates.
- The main line-angle result treats each input as an infinite line and reports the smaller angle from 0° to 90°.
- Line directions are normalised to 0°–180° and measured anticlockwise from positive X.
- Collinear three-point inputs and zero-length lines are rejected rather than producing a fabricated result.

## Licence

MIT.
