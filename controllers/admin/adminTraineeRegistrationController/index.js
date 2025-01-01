const {
  catchAsync,
  sendSuccess,
  AppError,
} = require("../../../utils/errorHandler");
const {
  validateRegistrationFields,
} = require("../../../utils/validateTraineeRegistrationFields");

const registration = catchAsync(async (req, res, next) => {
  const {
    traineeId,
    traineeName,
    birthDate,
    gender,
    education,
    experience,
    presentAdd,
    permanentAdd,
    mobileNo,
    alternetNo,
    emailAdd,
    joinDate,
    completeDate = null,
    aadharFront,
    aadharBack,
    aadharNo,
    residentProof,
    traineePhoto,
    refName,
    refNumber,
  } = req.body;

  const values = {
    traineeId,
    traineeName,
    birthDate,
    gender,
    education,
    experience,
    presentAdd,
    permanentAdd,
    mobileNo,
    alternetNo,
    emailAdd,
    joinDate,
    completeDate,
    aadharFront,
    aadharBack,
    aadharNo,
    residentProof,
    traineePhoto,
    refName,
    refNumber,
  };

  const isUpdateMode = !!traineeId;
  const validationErrors = validateRegistrationFields(values, isUpdateMode);
  if (validationErrors) {
    return next(
      new AppError("Invalid credentials", 400, {
        errorCode: "INVALID_CREDENTIALS",
        validationErrors: validationErrors,
      })
    );
  }

  if (isUpdateMode) {
    const updateQuery = `
      UPDATE [dbo].[trainee_master] 
      SET 
        [trainee_name] = @traineeName,
        [birth_date] = @birthDate,
        [gender] = @gender,
        [education] = @education,
        [present_add] = @presentAdd,
        [permanent_add] = @permanentAdd,
        [experience] = @experience,
        [mobile_no] = @mobileNo,
        [alternet_no] = @alternetNo,
        [email_add] = @emailAdd,
        [join_date] = @joinDate,
        [aadhar_front] = @aadharFront,
        [aadhar_back] = @aadharBack,
        [aadhar_no] = @aadharNo,
        [resident_proof] = @residentProof,
        [trainee_photo] = @traineePhoto,
        [ref_name] = @refName,
        [ref_number] = @refNumber
      WHERE [trainee_id] = @traineeId
      `;

    const result = await req.executeQuery(updateQuery, {
      traineeId,
      traineeName,
      birthDate,
      gender,
      education,
      presentAdd,
      permanentAdd,
      experience,
      mobileNo,
      alternetNo,
      emailAdd,
      joinDate,
      aadharFront,
      aadharBack,
      aadharNo,
      residentProof,
      traineePhoto,
      refName,
      refNumber,
    });

    return sendSuccess(
      res,
      { data: result.recordset },
      "Trainee Updated Successfully"
    );
  } else {
    const insertQuery = `

      INSERT INTO [dbo].[trainee_master] (
        [trainee_name], [birth_date], [gender], [education], [experience], [present_add],
        [permanent_add], [mobile_no], [alternet_no], [email_add], [join_date],
        [aadhar_front], [aadhar_back], [aadhar_no], [resident_proof], [trainee_photo],
        [ref_name], [ref_number]
      ) VALUES (
        @traineeName, @birthDate, @gender, @education, @experience, @presentAdd,
        @permanentAdd, @mobileNo, @alternetNo, @emailAdd, @joinDate,
        @aadharFront, @aadharBack, @aadharNo, @residentProof, @traineePhoto,
        @refName, @refNumber
      );
      SELECT SCOPE_IDENTITY() AS trainee_id;
      `;

    const result = await req.executeQuery(insertQuery, {
      traineeName,
      birthDate,
      gender,
      education,
      presentAdd,
      permanentAdd,
      experience,
      mobileNo,
      alternetNo,
      emailAdd,
      joinDate,
      aadharFront,
      aadharBack,
      aadharNo,
      residentProof,
      traineePhoto,
      refName,
      refNumber,
    });

    return sendSuccess(
      res,
      { data: result.recordset },
      "Trainee Registered Successfully"
    );
  }
});

const getAllTrainee = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (isNaN(page) || isNaN(limit)) {
    return next(new AppError("Invalid page or limit values", 400));
  }

  const offset = (page - 1) * limit;

  const countQuery = `
      SELECT COUNT(*) AS totalCount
      FROM [dbo].[trainee_master];
    `;

  const resultCount = await req.executeQuery(countQuery);
  const totalCount = resultCount.recordset[0].totalCount;
  const totalPages = Math.ceil(totalCount / limit);

  const query = `
      EXEC [dbo].[GetTraineesPaginated] 
        @offset = @offset, 
        @limit = @limit
    `;

  const result = await req.executeQuery(query, {
    offset,
    limit,
  });

  sendSuccess(
    res,
    {
      data: result.recordset,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        pageSize: limit,
      },
    },
    "Trainee List Retrieved Successfully"
  );
});

const traineeComplete = catchAsync(async (req, res, next) => {
  const { completeDate, traineeId } = req.body;

  if (!completeDate || !traineeId) {
    return next(
      new AppError("Completion date and Trainee ID are required.", 400, {
        errorCode: "MISSING_FIELDS",
      })
    );
  }

  const updateQuery = `
      UPDATE [dbo].[trainee_master] 
      SET [complete_date] = @completeDate
      WHERE [trainee_id] = @traineeId;
    `;

  const result = await req.executeQuery(updateQuery, {
    completeDate,
    traineeId,
  });

  if (result.rowsAffected[0] === 0) {
    return next(
      new AppError(
        "Failed to update completion date. Trainee not found.",
        404,
        {
          errorCode: "TRAINEE_NOT_FOUND",
        }
      )
    );
  }

  return sendSuccess(
    res,
    null,
    "Trainee completion date updated successfully."
  );
});

const traineeCompleteNull = catchAsync(async (req, res, next) => {
  const { traineeId } = req.body;

  if (traineeId === undefined || traineeId === null) {
    return next(
      new AppError("Trainee ID is required.", 400, {
        errorCode: "MISSING_FIELDS",
      })
    );
  }

  const updateQuery = `
      UPDATE [dbo].[trainee_master] 
      SET [complete_date] = NULL
      WHERE [trainee_id] = @traineeId;
    `;

  const result = await req.executeQuery(updateQuery, {
    traineeId,
  });

  if (result.rowsAffected[0] === 0) {
    return next(
      new AppError(
        "Failed to update completion date. Trainee not found.",
        404,
        {
          errorCode: "TRAINEE_NOT_FOUND",
        }
      )
    );
  }

  return sendSuccess(
    res,
    null,
    "Trainee completion date updated successfully."
  );
});

module.exports = {
  registration,
  getAllTrainee,
  traineeComplete,
  traineeCompleteNull,
};
