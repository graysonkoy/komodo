import React, { AppBar, Link, Toolbar } from "@material-ui/core";
import { ReactElement } from "react";

import "./Navbar.scss";

const Navbar = (): ReactElement => {
	return (
		<AppBar className="navbar" position="static">
			<Toolbar>
				<Link href="/">
					<div className="navbar-title">Komodo</div>
				</Link>
			</Toolbar>
		</AppBar>
	);
};

export default Navbar;
