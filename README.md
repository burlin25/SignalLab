# SignalLab

SignalLab is an A/B testing workbench. Choose whether to launch B, keep testing, or stay with A before revealing the analysis. The three example experiments cover a clear winner, an uncertain difference, and a statistically detectable change below the practical threshold.

## Run locally

Open `SignalLab.html` in a browser for the standalone version.

Serve the app with `python3 -m http.server 8000 --directory dist` and open http://localhost:8000. No installation or build step is needed. Run `node --test` with Node 20 or later to check the statistical engine.

## Method

The app uses a pooled two-sided two-proportion z-test and a separate unpooled 95% normal interval for the difference. The decision uses that interval and compares the observed lift to the scenario’s minimum practical lift. Sparse groups trigger a warning and a Keep Testing recommendation. The annual impact is a projection based on the scenario assumptions.

The calculations assume independent, randomly assigned visitors, consistent tracking, and a predetermined stopping point. They do not account for multiple comparisons or repeated checking. The sample-size slider illustrates how uncertainty changes when the same observed counts are scaled up.

The static interface lives in `dist/`. The pure statistics module is `dist/stats.mjs`. Reference fixtures use Python’s standard-library square root and complementary error function. Tests cover the three examples, a negative effect, a tie, sparse counts, invalid inputs, and extreme sample sizes.
