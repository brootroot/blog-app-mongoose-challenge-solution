exports.DATABASE_URL =
  process.env.DATABASE_URL ||
  global.DATABASE_URL ||
  'mongodb://localhost/blog-app';
exports.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'mongodb://test-user:test-pass@ds137360.mlab.com:37360/blog-app';
exports.PORT = process.env.PORT || 8080;
