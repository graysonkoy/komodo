import React, { ReactElement } from "react";
import { AppBar, Link, Toolbar } from "@mui/material";

import "./Navbar.scss";

const Navbar = (): ReactElement => {
	return (
		<div className="navbar-container">
			<AppBar className="navbar" position="static">
				<Toolbar>
					<Link href="/">
						<div className="navbar-title">Komodo</div>
					</Link>
				</Toolbar>
			</AppBar>
		</div>
	);
};

export default Navbar;
