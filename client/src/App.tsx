import React, { ReactElement } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { MessageStore } from "./context/MessageContext";
import { ApiStore } from "./context/ApiContext";
import Navbar from "./components/Navbar/Navbar";
import MessageBar from "./components/MessageBar/MessageBar";
import Home from "./pages/Home/Home";

import "./styles/variables.scss";
import "./App.scss";
import { ThemeStore } from "./context/ThemeContext";

const App = (): ReactElement => {
	return (
		<div className="App">
			<Router>
				<ThemeStore>
					<MessageStore>
						<ApiStore>
							<Navbar />

							<main>
								<Switch>
									<Route exact path="/" component={Home} />
								</Switch>
							</main>

							<MessageBar />
						</ApiStore>
					</MessageStore>
				</ThemeStore>
			</Router>
		</div>
	);
};

export default App;
