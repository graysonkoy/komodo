import React, { ReactElement, useContext } from "react";
import { Snackbar } from "@material-ui/core";
import MuiAlert, { AlertProps } from "@material-ui/lab/Alert";
import MessageContext from "../../context/MessageContext";

const Alert = (props: AlertProps): ReactElement => {
	return <MuiAlert elevation={6} variant="filled" {...props} />;
};

const MessageBar = (): ReactElement => {
	const { message, setOpen, open } = useContext(MessageContext);

	const closeMessage = (): void => {
		setOpen(false);
	};

	return (
		<div className="message-bar">
			<Snackbar
				open={open}
				autoHideDuration={6000}
				onClose={closeMessage}
				anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
			>
				<Alert onClose={closeMessage} severity={message?.type}>
					{message?.message}
				</Alert>
			</Snackbar>
		</div>
	);
};

export default MessageBar;
