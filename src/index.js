const express = require("express");
const app = express();

const PORT = 8080;

app.use(express.static("public"));

app.get("/", (req, res, next) => {
	res.sendFile(path.join(__dirname, "/public/index.html"));
});

app.listen(process.env.PORT || PORT, () => {
	console.log(`http://localhost:${process.env.PORT || PORT}`);
});
