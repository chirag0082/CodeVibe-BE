const {
  catchAsync,
  sendSuccess,
  AppError,
} = require("../../../utils/errorHandler");

const getEmoSalaryReport = catchAsync(async (req, res, next) => {
  const { fromMonth, toMonth, empId } = req.query;


  if (!fromMonth || !toMonth) {
    return next(new AppError("fromMonth and toMonth are required.", 400));
  }

  try {
    let baseQuery = `EXEC dbo.get_salary_report @fromMonth = @fromMonth, @toMonth = @toMonth , @empId = @empId`;
    const queryParams = {
      fromMonth,
      toMonth,
      empId: empId || 0,
    };

    const result = await req.executeQuery(baseQuery, queryParams);

    if (!result.recordset || result.recordset.length === 0) {
      return next(new AppError("No salary found for the Range.", 404));
    }

    sendSuccess(
      res,
      { data: result.recordset },
      "Salary details fetched successfully."
    );
  } catch (error) {
    // console.error("Error executing query: ", error);
    next(error);
  }
});

module.exports = { getEmoSalaryReport };
