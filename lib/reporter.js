/**
 * reporter.js - small helper to format human readable reports
 */

function summarize(report) {
  return {
    filesScanned: report.summary.filesScanned,
    transformsRun: report.summary.transformsRun,
    totalChanges: report.summary.totalChanges,
    changes: report.changes.slice(0, 200)
  };
}

module.exports = { summarize };

