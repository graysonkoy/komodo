import React, { ReactElement } from "react";
import {
	Card,
	CardContent,
	CardActions,
	Button,
	CardMedia,
	Link,
} from "@mui/material";
import TwitchClip from "../../types/TwitchClip";

import "./TwitchClip.scss";

interface TwitchClipProps {
	clip: TwitchClip;
	onRemove: (clipId: string) => void;
	listeners?: any;
}

function Handle() {
	return (
		<div>
			<svg viewBox="0 0 20 20" width="12">
				<path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
			</svg>
		</div>
	);
}

const TwitchClipCard = ({
	clip,
	onRemove,
	listeners,
}: TwitchClipProps): ReactElement => {
	return (
		<Card className="twitch-card" variant="outlined">
			<CardMedia component="img" height="140" image={clip.thumbnail_url} />

			<div className="clip-time">
				{clip && new Date(clip.duration * 1000).toISOString().substr(14, 5)}
			</div>

			<CardContent>
				<h3 style={{ margin: 0 }}>{clip.title}</h3>
				<h3 style={{ fontWeight: "normal", opacity: 0.75 }}>
					{clip.broadcaster_name}
				</h3>
			</CardContent>

			{/* <div style={{ flexGrow: 1 }} />

			<CardActions>
				<Button
					size="small"
					className="remove-button"
					onClick={() => onRemove(clip.id)}
				>
					Remove
				</Button>
			</CardActions> */}
		</Card>
	);
};

export default TwitchClipCard;
