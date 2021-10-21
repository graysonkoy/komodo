import React, { ReactElement, useContext, useState } from "react";
import { Button, TextField } from "@mui/material";

import {
	DndContext,
	closestCenter,
	MouseSensor,
	TouchSensor,
	DragOverlay,
	useSensor,
	useSensors,
	MeasuringStrategy,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	rectSortingStrategy,
	useSortable,
	defaultAnimateLayoutChanges,
	AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import TwitchClip from "../../types/TwitchClip";
import MessageContext from "../../context/MessageContext";
import ApiContext from "../../context/ApiContext";
import TwitchClipCard from "../../components/TwitchClip/TwitchClip";
import Loader from "../../components/Loader/Loader";

import "./Home.scss";
import axios from "axios";
import { Link } from "react-router-dom";

interface ClipsListProps {
	clips: TwitchClip[];
	setClips: (value: React.SetStateAction<TwitchClip[]>) => void;
	removeClip: (clipId: string) => void;
}

const SortableClip = ({ clip, onRemove }: any) => {
	const animateLayoutChanges: AnimateLayoutChanges = (args) =>
		args.isSorting || args.wasDragging
			? defaultAnimateLayoutChanges(args)
			: true;

	const {
		attributes,
		listeners,
		isDragging,
		setNodeRef,
		transform,
		transition,
	} = useSortable({
		animateLayoutChanges,
		id: clip.id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 999 : undefined,
		opacity: isDragging ? 0.5 : undefined,
	};

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<TwitchClipCard clip={clip} onRemove={onRemove} />
		</div>
	);
};

const ClipsList = ({
	clips,
	setClips,
	removeClip,
}: ClipsListProps): ReactElement => {
	const [activeId, setActiveId] = useState(null);
	const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

	const activeClip = clips.find((clip) => clip.id == activeId);

	const handleDragStart = (event: any) => setActiveId(event.active.id);
	const handleDragCancel = () => setActiveId(null);
	const handleDragEnd = (event: any) => {
		const { active, over } = event;

		if (active.id !== over.id) {
			setClips((curClips) => {
				const oldIndex = clips.findIndex((clip) => clip.id == active.id);
				const newIndex = clips.findIndex((clip) => clip.id == over.id);

				return arrayMove(curClips, oldIndex, newIndex) as TwitchClip[];
			});
		}

		setActiveId(null);
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
			measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
		>
			<SortableContext items={clips} strategy={rectSortingStrategy}>
				<div className="card-container">
					{clips.map((clip, index) => (
						<SortableClip key={clip.id} clip={clip} onRemove={removeClip} />
					))}
				</div>
			</SortableContext>

			<DragOverlay>
				{activeClip && (
					<TwitchClipCard clip={activeClip} onRemove={removeClip} />
				)}
			</DragOverlay>
		</DndContext>
	);
};

const Clips = (): ReactElement => {
	const [clips, setClips] = useState<TwitchClip[]>([]);
	const [clipUrl, setClipUrl] = useState("");
	const [adding, setAdding] = useState(false);
	const [video, setVideo] = useState("");
	const [makingVideo, setMakingVideo] = useState(false);

	const { setMessage } = useContext(MessageContext);
	const { get } = useContext(ApiContext);

	const addClip = async (url: string) => {
		if (url == "") return;

		setAdding(true);

		// get details about the clip
		try {
			const newClip: TwitchClip = await get("/api/getClipInfo", {
				clip: url,
			});

			if (clips.find((clip) => clip.url == clipUrl)) {
				setMessage({
					type: "error",
					message: "Clip already included",
				});
			} else {
				setClips((curClips) => [...curClips, newClip]);
			}
		} catch (e) {
			//
		}

		setAdding(false);
	};

	const removeClip = (clipId: string) => {
		setClips((curClips) => curClips.filter((clip) => clip.id != clipId));
	};

	const createVideo = async () => {
		if (makingVideo) return;

		setMakingVideo(true);

		const urls = clips.map((clip) => clip.url);

		const res = await axios.get(
			`/api/makeVideo?clips=${JSON.stringify(urls)}`,
			{
				responseType: "blob",
			}
		);

		const blob = res.data;
		const blobUrl = window.URL.createObjectURL(blob);

		setVideo(blobUrl);
		setMakingVideo(false);
	};

	return (
		<div className="clips-page">
			<h1>New clip compilation</h1>
			<p className="muted">
				Provide a list of Twitch clip URLs to be combined into a highlights
				video.
			</p>

			<h3>Clips{clips.length != 0 && <span> - {clips.length}</span>}</h3>

			<form
				style={{ marginBottom: "1rem" }}
				onSubmit={(e) => {
					e.preventDefault();
					addClip(clipUrl);
					setClipUrl("");
				}}
			>
				<TextField
					label="Clip URL"
					variant="outlined"
					size="small"
					value={clipUrl}
					onChange={(e) => setClipUrl(e.target.value)}
				/>

				{clipUrl && (
					<Button
						type="submit"
						style={{ marginLeft: "0.5rem" }}
						variant="contained"
					>
						Add
					</Button>
				)}
			</form>

			{adding && <Loader message="Adding clip" />}

			<ClipsList clips={clips} setClips={setClips} removeClip={removeClip} />

			<br />

			{clips.length != 0 && (
				<Button
					variant="contained"
					onClick={() => createVideo()}
					disabled={makingVideo}
				>
					Create video
				</Button>
			)}

			{video && (
				<div className="video-container">
					<h2>Your generated video</h2>

					<video className="video" controls>
						<source src={video} type="video/mp4" />
					</video>

					<br />

					<a href={video} download="merged.mp4">
						<Button variant="contained">Download</Button>
					</a>
				</div>
			)}
		</div>
	);
};

const Home = (): ReactElement => {
	return (
		<div>
			<Clips />
		</div>
	);
};

export default Home;
