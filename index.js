import express from "express";
import cors from "cors";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { exec } from "child_process";

const app = express();

//Multer middleware
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./uploads");
	},
	filename: function (req, file, cb) {
		cb(
			null,
			file.fieldname + "-" + uuidv4() + path.extname(file.originalname)
		);
	},
});

// multer configuration
const upload = multer({ storage: storage });

app.use(
	cors({
		origin: ["http://localhost:3000/", "http://localhost:5173/"],
		credentials: true,
	})
);

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*"),
		res.header(
			"Access-Control-Allow-Headers",
			"Origin, X-Requested-With, Content-Type, Accept"
		);

	next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/", function (req, res) {
	res.json({ message: "Hello this is Shihab Al Ratul" });
});

app.post("/upload", upload.single("file"), function (req, res) {
	const lessonId = uuidv4();
	const videoPath = req.file.path;
	const outputPath = `./uploads/courses/${lessonId}`;
	const hlsPath = `${outputPath}/index.m3u8`;

	if (!fs.existsSync(outputPath)) {
		fs.mkdirSync(outputPath, { recursive: true });
	}

	//ffmpeg
	const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}`;

	// Not using queue because of POC
	exec(ffmpegCommand, (error, stdout, stderr) => {
		if (error) {
			console.log(`exec error: ${error}`);
		}
		console.log(`stdout: ${stdout}`);
		console.log(`stderr: ${stderr}`);

		const videoUrl = `http://localhost:3000/uploads/courses/${lessonId}/index.m3u8`;

		res.json({
			message: "Video converted to hls format",
			videoUrl: videoUrl,
			lessonId: lessonId,
		});
	});
});

app.listen(3000, function () {
	console.log("App is listening at port 3000...");
});
