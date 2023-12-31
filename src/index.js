const express = require("express");
const { dirname } = require("path");
const PORT = 8080;
const app = express();

app.use(express.static("public"));

app.get("/", (req, res, next) => {
	res.sendFile(path.join(__dirname, "/public/index.html"));
	// res.sendFile(__dirname + "/public/index.html");
	// console.log(__dirname);
});

app.listen(process.env.PORT || PORT, () => {
	console.log(`http://localhost:${process.env.PORT || PORT}`);
});

// var exec = require("child_process").exec;
// exec("pwd", function callback(error, stdout, stderr) {
// 	// result
// 	console.log("asdfsd", stdout);
// });

// exec(
// 	"/opt/homebrew/opt/stockfish/bin/stockfish position fen rn6/p2bQ3/1pk4r/1Bp1p1p1/P6P/2R4R/1PPP1PP1/1NB1K1N1 b - - 2 15",
// 	function (err, stdout, stderr) {
// 		console.log(stdout);
// 	}
// );

// exec("isready", function (error, stdout, stderr) {
// 	console.log(stdout);
// });

const Worker = require("worker_threads").Worker;

// // worker.postMessage("isready");

// var stockfish = new Worker("./public/stockfish.js");

// stockfish.onmessage = function (evt) {
// 	console.log(evt);
// };

// stockfish.on("message", function (evt) {
// 	console.log(evt);
// });

// stockfish.postMessage("uci");
// stockfish.postMessage("ucinewgame");
// stockfish.postMessage("setoption name Skill Level value 3");
// stockfish.postMessage("setoption name Skill Level Maximum Error value 600");
// stockfish.postMessage("setoption name Skill Level Probability value 128");
// stockfish.postMessage(
// 	"position fen " +
// 		"rn6/p2bQ3/1pk4r/1Bp1p1p1/P6P/2R4R/1PPP1PP1/1NB1K1N1 b - - 2 15"
// );
// stockfish.postMessage("go depth 10");
// stockfish.postMessage("ucinewgame");
// stockfish.postMessage("isready");

// stockfish.onmessage = function (event) {
// 	//NOTE: Web Workers wrap the response in an object.
// 	console.log(event.data ? event.data : event);
// };

// stockfish.postMessage("ucinewgame");
// stockfish.postMessage("isready");

// var stockfish = new Worker("./public/stockfish.js");
// engine.postMessage("go depth 15");
