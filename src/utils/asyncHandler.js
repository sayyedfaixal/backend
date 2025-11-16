const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(req, res, next).catch((error) => next(error));
  };
};

/* Another way of writing the code
const asyncHandler = (asyncFunction) => async (req, res, next) => {
  try {
    await asyncFunction(req, res, next);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};
*/
export { asyncHandler };
