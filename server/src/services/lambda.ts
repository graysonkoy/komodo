import AWS from "aws-sdk";

class Lambda {
	lambda: AWS.Lambda;

	connect = async () => {
		this.lambda = new AWS.Lambda();
	};

	call = async (lambdaName, params) => {
		return this.lambda
			.invoke({
				FunctionName: lambdaName,
				Payload: JSON.stringify(params),
			})
			.promise();
	};
}

const lambda = new Lambda();

export default lambda;
