import React, { ReactElement } from "react";
import { CircularProgress } from "@material-ui/core";

import "./Loader.scss";

interface LoaderProps {
	message: string;
}

const Loader = ({ message }: LoaderProps): ReactElement => {
	return (
		<div className="loader">
			<CircularProgress color="secondary" />
			<span>{message}</span>
		</div>
	);
};

export default Loader;
