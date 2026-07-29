export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const target = req[source] || {};
    req[source] = schema.parse(target);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
        ? error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        : error.message,
      timestamp: new Date().toISOString()
    });
  }
};
