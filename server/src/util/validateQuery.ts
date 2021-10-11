import { validationResult } from "express-validator";

const validateQuery = (req: any): Record<string, any> => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		throw ["Failed to validate query parameters", errors.array()];

	return req.query;
};

export default validateQuery;
