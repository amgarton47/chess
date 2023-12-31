const piece_mappings = {
	1: "pawn",
	2: "bishop",
	3: "knight",
	4: "rook",
	5: "king",
	6: "queen",
};

// STOCKFISH
var engine = new Worker("stockfish.js");

engine.postMessage("uci");
engine.postMessage("setoption name Threads value 10");
engine.postMessage("ucinewgame");

let e_move = "";
engine.onmessage = function (event) {
	// console.log(event.data);
	if (event.data.indexOf("bestmove") != -1) {
		// console.log(event.data.split(" ")[1]);
		e_move = event.data.split(" ")[1];
		console.log(e_move);
	}
};

// const board = [
// 	[-4, -3, -2, -6, -5, -2, -3, -4],
// 	[-1, -1, -1, -1, -1, -1, -1, -1],
// 	[0, 0, 0, 0, 0, 0, 0, 0],
// 	[0, 0, 0, 0, 0, 0, 0, 0],
// 	[0, 0, 0, 0, 0, 0, 0, 0],
// 	[0, 0, 0, 0, 0, 0, 0, 0],
// 	[1, 1, 1, 1, 1, 1, 1, 1],
// 	[4, 3, 2, 6, 5, 2, 3, 4],
// ];

const start_pos = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const board = FEN_to_board(start_pos);

function FEN_to_board(fen) {
	fen = fen.split(" ");
	const player_to_move = fen[1];
	const castling = fen[2];
	const en_passant = fen[3];
	const half_move_clock = fen[4];
	const full_move_clock = fen[5];

	const pieces = fen[0].replaceAll("/", "");
	const board = new Array(8).fill(0).map(() => new Array(8).fill(0));

	const piece_map = {
		P: 1,
		B: 2,
		N: 3,
		R: 4,
		K: 5,
		Q: 6,
		p: -1,
		b: -2,
		n: -3,
		r: -4,
		k: -5,
		q: -6,
	};

	let i = 0;
	let j = 0;

	for (let p = 0; p < pieces.length; p++) {
		const c = pieces[p];

		if (/[a-zA-Z]/.test(c)) {
			board[i][j] = piece_map[c];
			j += 1;
		} else {
			j += parseInt(c);
		}

		if (j == 8) {
			j = 0;
			i += 1;
		}
	}

	return board;
}

let half_move_clock = 0;
let full_move_clock = 1;

const move_history = [];

var whose_turn = 1; // 1: white, -1: black

// keep track for castling purposes
var black_king_has_moved =
	(white_king_has_moved =
	white_kingside_rook_has_moved =
	white_queenside_rook_has_moved =
	black_kingside_rook_has_moved =
	black_queenside_rook_has_moved =
	white_king_has_castled =
	black_king_has_castled =
		false);

// keep track for en passant purposes
var last_move = null;

// create board and pieces according to starting board
for (let i = 0; i < board.length; i++) {
	for (let j = 0; j < board[0].length; j++) {
		let x = j;
		let y = i;

		let file = "abcdefgh"[x];
		let rank = 8 - y;
		let color = (x + 1 + rank) % 2 == 0 ? "dark" : "light";

		$("#board").append(
			`<div id="${file}${rank}" class="${color} square"></div>`
		);

		const piece = Math.abs(board[i][j]);
		if (piece != 0) {
			const piece_name = piece_mappings[piece];
			const piece_color = board[i][j] > 0 ? "white" : "black";
			const piece_img = `pieces/${piece_color}_${piece_name}.png`;

			const square = $("#board div").last()[0];
			const pos = square.getBoundingClientRect();

			$("body").append(
				`<img id="${
					file + rank
				}_${piece_color}_${piece_name}" src="${piece_img}" class="piece ${
					file + rank
				}" style="top:${pos.top + 2.5 + "px"}; left:${
					pos.left + 2.5 + "px"
				};" draggable="false">`
			);

			dragElement(
				document.getElementById(
					`${file}${rank}_${piece_color}_${piece_name}`
				)
			);
		}
	}
}

// move pieces on window resize
let left = $("#a6").position().left;
function resize() {
	const d_left = left - $("#a6").position().left;
	$(".piece").each(function () {
		$(this).css("left", $(this).position().left - d_left + "px");

		// call dragElement again so startx and starty is reset
		if (check_game_status(whose_turn, board) == 0) {
			dragElement(document.getElementById($(this).attr("id")));
		}
	});
	left = $("#a6").position().left;
}
window.onresize = resize;

// make pieces draggable
function dragElement(elt) {
	var pos1 = 0,
		pos2 = 0,
		pos3 = 0,
		pos4 = 0;

	elt.onmousedown = dragMouseDown;

	// store start position in case end position is illegal
	var startx = parseFloat(elt.style.top);
	var starty = parseFloat(elt.style.left);
	let start_square = null;
	let piece_color;

	function dragMouseDown(e) {
		if (!start_square) {
			start_square = document
				.elementsFromPoint(e.clientX, e.clientY)
				.find((elt) => elt.classList.contains("square")).id;
		}

		// get color of piece trying to be moved
		const piece_id = $(`.${start_square}`)[0].id;
		piece_color = piece_id.indexOf("white") > -1 ? 1 : -1;

		elt.classList.add("active");

		const legal_moves = get_legal_moves(start_square, board);
		legal_moves.forEach((m) => {
			const i = filerank_to_idx(m)[0];
			const j = filerank_to_idx(m)[1];
			const class_name =
				board[i][j] != 0 ? "legal_move_capture" : "legal_move";

			$(`#${m}`).append(`<div class="${class_name}"></div>`);
		});

		// snap piece to center of cursor
		elt.style.top = e.clientY - 39 + "px";
		elt.style.left = e.clientX - 39 + "px";

		document
			.elementsFromPoint(e.clientX, e.clientY)
			.find((elt) => elt.classList.contains("square"))
			.classList.add("square_hover");

		e.preventDefault();
		// get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		// call drag function whenever the cursor moves:
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		// square hover styling
		$(".square").removeClass("square_hover");
		const current_square = document
			.elementsFromPoint(e.clientX, e.clientY)
			.find((elt) => elt.classList.contains("square"));
		if (current_square) current_square.classList.add("square_hover");

		e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the element's new position:
		elt.style.top = elt.offsetTop - pos2 + "px";
		elt.style.left = elt.offsetLeft - pos1 + "px";
	}

	function closeDragElement(e) {
		// removes z-index increase
		elt.classList.remove("active");
		$(".square").removeClass("square_hover");

		const current_square = document
			.elementsFromPoint(e.clientX, e.clientY)
			.find((elt) => elt.classList.contains("square"));

		if (
			current_square &&
			is_legal_move(start_square, current_square.id, board) &&
			piece_color * whose_turn > 0
		) {
			whose_turn *= -1;
			// snap piece to center of square
			const position = document
				.getElementById(current_square.id)
				.getBoundingClientRect();
			startx = position.top + 2.5;
			starty = position.left + 2.5;

			// make move on array board
			make_move(start_square, current_square.id, board);

			// change piece's square class
			elt.classList.forEach((class_name) => {
				if (/[abcdefgh][12345678]/.test(class_name)) {
					elt.classList.remove(class_name);
				}
			});
			elt.classList.add(current_square.id);

			// set start square as new square
			start_square = current_square.id;
		}
		// return to orig location if invalid new location
		elt.style.top = startx + "px";
		elt.style.left = starty + "px";

		$(".square .legal_move").remove();
		$(".square .legal_move_capture").remove();

		// stop moving when mouse is released:
		document.onmouseup = null;
		document.onmousemove = null;

		setTimeout(() => check_game_over(whose_turn, board), 10);
	}
}

function do_castle(from, to, board) {
	const from_i = filerank_to_idx(from)[0];
	const from_j = filerank_to_idx(from)[1];

	const to_i = filerank_to_idx(to)[0];
	const to_j = filerank_to_idx(to)[1];

	const color = board[from_i][from_j] > 0 ? 1 : -1;

	// dynamically get rook start and end position
	const rook_i = color == -1 ? 0 : 7;
	const rook_start_j = to_j < 4 ? 0 : 7;
	const rook_end_j = to_j < 4 ? 3 : 5;

	// make rook and king moves on board representation
	board[from_i][from_j] = 0;
	board[to_i][to_j] = 5 * color;
	board[rook_i][rook_end_j] = 4 * color;
	board[rook_i][rook_start_j] = 0;

	// move rook to end square on "physical" board
	const position = document
		.getElementById(idx_to_filerank(rook_i, rook_end_j))
		.getBoundingClientRect();
	let x = position.top + 2.5;
	let y = position.left + 2.5;

	const elt = document.getElementsByClassName(
		idx_to_filerank(rook_i, rook_start_j)
	)[0];

	elt.style.top = x + "px";
	elt.style.left = y + "px";

	// update rooks square class and call dragElement to reset startx and starty
	elt.classList.remove(idx_to_filerank(rook_i, rook_start_j));
	elt.classList.add(idx_to_filerank(rook_i, rook_end_j));
	dragElement(elt);

	// mark castled as true
	if (color == -1) {
		black_king_has_castled = true;
	} else {
		white_king_has_castled = true;
	}
}

function make_move(from, to, board) {
	const from_i = filerank_to_idx(from)[0];
	const from_j = filerank_to_idx(from)[1];
	const to_i = filerank_to_idx(to)[0];
	const to_j = filerank_to_idx(to)[1];
	const color = board[from_i][from_j] > 0 ? 1 : -1;

	last_move = `${board[from_i][from_j]}:${from}:${to}`;

	const piece_type = Math.abs(board[from_i][from_j]);
	let is_capture = board[to_i][to_j] != 0 ? 1 : 0;
	let is_promotion = false;

	let is_ambigious = is_ambiguous_move(from, to, board);

	let is_castle = 0;

	// if move is a capture, remove captured piece
	if (is_capture) {
		$(`.${to}`)[0].remove();
	}

	// mark if king or rook has moved for castling purposes
	if (!white_king_has_moved && board[from_i][from_j] == 5) {
		white_king_has_moved = true;
	}

	if (!black_king_has_moved && board[from_i][from_j] == -5) {
		black_king_has_moved = true;
	}

	if (board[from_i][from_j] == 4) {
		if (from_j == 0 && !white_queenside_rook_has_moved) {
			white_queenside_rook_has_moved = true;
		} else if (from_j == 7 && !white_kingside_rook_has_moved) {
			white_kingside_rook_has_moved = true;
		}
	}

	if (board[from_i][from_j] == -4) {
		if (from_j == 0 && !black_queenside_rook_has_moved) {
			black_queenside_rook_has_moved = true;
		} else if (from_j == 7 && !black_kingside_rook_has_moved) {
			black_kingside_rook_has_moved = true;
		}
	}

	Math.abs(board[from_i][from_j]) == 5 &&
		((!white_king_has_castled &&
			(from == "e1" || from == "e8") &&
			(to == "g1" || to == "c1")) ||
			(!black_king_has_castled && (to == "g8" || to == "c8")));

	// if castling
	if (
		Math.abs(board[from_i][from_j]) == 5 &&
		((!white_king_has_castled &&
			from == "e1" &&
			(to == "g1" || to == "c1")) ||
			(!black_king_has_castled &&
				(to == "g8" || to == "c8") &&
				from == "e8"))
	) {
		is_castle = to_j > 4 ? 1 : 2;
		do_castle(from, to, board);
	} else if (
		Math.abs(board[from_i][from_j]) == 1 &&
		from_j != to_j &&
		board[to_i][to_j] == 0
	) {
		// en passant case

		// remove captured pawn
		board[to_i + color][to_j] = 0;
		$(`.${idx_to_filerank(to_i + color, to_j)}`)
			.first()
			.remove();

		// move capturing pawn to new square
		board[to_i][to_j] = board[from_i][from_j];
		board[from_i][from_j] = 0;

		is_capture = true;
	} else {
		// else reg move
		// set to piece as from piece and from piece is now empty (0)
		board[to_i][to_j] = board[from_i][from_j];
		board[from_i][from_j] = 0;

		// pawns promote to queens if they reach opposite last rank
		if (board[to_i][to_j] == 1 && to_i == 0) {
			board[to_i][to_j] = 6;
			$(`.${idx_to_filerank(from_i, from_j)}`)
				.first()
				.attr("src", "pieces/white_queen.png");
			is_promotion = true;
		}

		if (board[to_i][to_j] == -1 && to_i == 7) {
			board[to_i][to_j] = -6;
			$(`.${idx_to_filerank(from_i, from_j)}`)
				.first()
				.attr("src", "pieces/black_queen.png");
			is_promotion = true;
		}
	}

	const m = {
		1: is_capture ? from[0] : "",
		2: "B",
		3: "N",
		4: "R",
		5: "K",
		6: "Q",
	};

	let acn = `${m[piece_type]}${is_ambigious ? is_ambigious : ""}${
		is_capture ? "x" : ""
	}${to}${is_promotion ? "Q" : ""}`;

	let is_check = get_attacked_squares(color * -1, board).includes(
		get_king_square(color * -1, board)
	);

	const game_status = check_game_status(color * -1, board);

	if (is_castle == 1) {
		acn = "O-O";
	} else if (is_castle == 2) {
		acn = "O-O-O";
	}

	if (game_status == 1) {
		acn += "#";
	} else if (game_status == 2) {
		acn += "$";
	} else if (is_check) {
		acn += "+";
	}

	move_history.push(acn);

	if (game_status == 1) move_history.push(color == 1 ? "1-0" : "0-1");
	else if (game_status == 2) move_history.push("1/2-1/2");

	if (color == -1) {
		full_move_clock += 1;
	}

	if (is_capture || piece_type == 1) {
		half_move_clock = 0;
	} else {
		half_move_clock += 1;
	}

	// engine.postMessage(`position fen ${get_FEN(board, whose_turn)}`);
	// console.log(get_FEN(board, whose_turn));
}

function is_ambiguous_move(from, to, board) {
	const from_i = filerank_to_idx(from)[0];
	const from_j = filerank_to_idx(from)[1];
	const piece = board[from_i][from_j];

	let unique_acn = false;

	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[0].length; j++) {
			if (!(from_i == i && from_j == j) && piece == board[i][j]) {
				let pieces_moves = get_legal_moves(
					idx_to_filerank(i, j),
					board
				);

				if (pieces_moves.includes(to)) {
					// let piece_square = idx_to_filerank(i, j);

					// if (piece_square[0] == to[0]) {
					// 	unique_acn = from[1];
					// } else if (piece_square[1] == to[1]) {
					// 	unique_acn = from[0];
					// }
					unique_acn = from;
				}
			}
		}
	}
	// console.log(unique_acn);
	return unique_acn;
}

// #region MOVE LOGIC
// all the fun move logic 😍
// checks if "to" square is in list of legal "from" squares
function is_legal_move(from, to, board) {
	return get_legal_moves(from, board).includes(to);
}

function get_legal_moves(from, board) {
	let from_i = filerank_to_idx(from)[0];
	let from_j = filerank_to_idx(from)[1];

	const piece_type = Math.abs(board[from_i][from_j]);

	if (piece_type == 1) {
		return filter_revealed_checks(
			from,
			get_legal_pawn_moves(from, board),
			board
		);
	} else if (piece_type == 2) {
		return filter_revealed_checks(
			from,
			get_legal_bishop_moves(from, board),
			board
		);
	} else if (piece_type == 3) {
		return filter_revealed_checks(
			from,
			get_legal_knight_moves(from, board),
			board
		);
	} else if (piece_type == 4) {
		return filter_revealed_checks(
			from,
			get_legal_rook_moves(from, board),
			board
		);
	} else if (piece_type == 5) {
		return get_legal_king_moves(from, board);
	} else if (piece_type == 6) {
		return filter_revealed_checks(
			from,
			get_legal_queen_moves(from, board),
			board
		);
	}
}

function get_legal_pawn_moves(from, board) {
	const rank = parseInt(from[1]);
	const from_i = filerank_to_idx(from)[0];
	const from_j = filerank_to_idx(from)[1];

	const legal_moves = [];
	const color = board[from_i][from_j] < 0 ? -1 : 1;

	candidate_i = from_i - color; // one space up
	candidate_j = from_j;

	// if up one is in play and unoccupied, it's a legal move
	if (
		((color == -1 && candidate_i <= 7) ||
			(color == 1 && candidate_i >= 0)) &&
		board[candidate_i][candidate_j] == 0
	) {
		legal_moves.push(idx_to_filerank(candidate_i, candidate_j));

		// now same for up two, if on starting rank
		if (
			((color == -1 && from_i == 1) || (color == 1 && from_i == 6)) &&
			board[candidate_i - color][candidate_j] == 0
		) {
			legal_moves.push(idx_to_filerank(candidate_i - color, candidate_j));
		}
	}

	// now check possible capturing squares
	// if ↗️ or ↖️ is in play and occupied by an opposite-color piece, we can take
	candidate_i = from_i - color;
	const diag_moves = [from_j + 1, from_j - 1];

	diag_moves.forEach((j) => {
		if (
			j >= 0 &&
			j <= 7 &&
			candidate_i >= 0 &&
			candidate_i <= 7 &&
			board[candidate_i][j] * color < 0
		) {
			legal_moves.push(idx_to_filerank(candidate_i, j));
		}
	});

	// last_move = piece:filerank:filerank

	if (last_move) {
		let lm = last_move.split(":");
		let f = lm[1];
		let t = lm[2];
		let p = lm[0];

		let f_i = filerank_to_idx(f)[0];
		let t_i = filerank_to_idx(t)[0];
		let t_j = filerank_to_idx(t)[1];

		// now check for en passant
		if (color == 1) {
			if (from_i == 3 && t_i == 3 && f_i == 1 && p == "-1") {
				if (from_j > 0 && t_j == from_j - 1) {
					legal_moves.push(idx_to_filerank(from_i - 1, from_j - 1));
				}

				if (from_j < 7 && t_j == from_j + 1) {
					legal_moves.push(idx_to_filerank(from_i - 1, from_j + 1));
				}
			}
		} else if (color == -1) {
			if (from_i == 4 && t_i == 4 && f_i == 6 && p == "1") {
				if (from_j > 0 && t_j == from_j - 1) {
					legal_moves.push(idx_to_filerank(from_i + 1, from_j - 1));
				}

				if (from_j < 7 && t_j == from_j + 1) {
					legal_moves.push(idx_to_filerank(from_i + 1, from_j + 1));
				}
			}
		}
	}

	return legal_moves;
}

function get_legal_bishop_moves(from, board) {
	let from_i = filerank_to_idx(from)[0];
	let from_j = filerank_to_idx(from)[1];
	const dirs = [
		[-1, -1],
		[-1, 1],
		[1, -1],
		[1, 1],
	];
	return get_long_moves(dirs, from_i, from_j, board);
}

function get_legal_knight_moves(from, board) {
	let from_i = filerank_to_idx(from)[0];
	let from_j = filerank_to_idx(from)[1];
	const legal_moves = [];

	const dirs = [
		[-2, -1],
		[-2, 1],
		[1, -2],
		[1, 2],
		[2, 1],
		[2, -1],
		[-1, -2],
		[-1, 2],
	];

	return get_short_moves(dirs, from_i, from_j, board);
}

function get_legal_rook_moves(from, board) {
	let from_i = filerank_to_idx(from)[0];
	let from_j = filerank_to_idx(from)[1];

	const dirs = [
		[1, 0],
		[0, 1],
		[-1, 0],
		[0, -1],
	];

	return get_long_moves(dirs, from_i, from_j, board);
}

function get_legal_queen_moves(from, board) {
	let from_i = filerank_to_idx(from)[0];
	let from_j = filerank_to_idx(from)[1];

	const dirs = [
		[1, 0],
		[0, 1],
		[-1, 0],
		[0, -1],
		[1, 1],
		[-1, -1],
		[1, -1],
		[-1, 1],
	];

	return get_long_moves(dirs, from_i, from_j, board);
}

function get_legal_king_moves(from, board) {
	let from_i = filerank_to_idx(from)[0];
	let from_j = filerank_to_idx(from)[1];

	const dirs = [
		[1, 0],
		[0, 1],
		[-1, 0],
		[0, -1],
		[1, 1],
		[-1, -1],
		[1, -1],
		[-1, 1],
	];

	const legal_moves = get_short_moves(dirs, from_i, from_j, board);

	// remove "legal moves" that are attacked by enemy pieces (i.e that would put the king in check)
	const color = board[from_i][from_j] < 0 ? -1 : 1;
	const attacked_squares = get_attacked_squares(color, board);
	const filtered = legal_moves.filter(
		(elt) => !attacked_squares.includes(elt)
	);

	// now check if castling is legal

	// white kingside castle
	if (
		board[from_i][from_j] == 5 &&
		!white_king_has_moved &&
		!white_kingside_rook_has_moved &&
		board[7][5] == 0 &&
		board[7][6] == 0 &&
		!attacked_squares.includes("f1") &&
		!attacked_squares.includes("g1") &&
		!attacked_squares.includes("e1")
	) {
		filtered.push("g1");
	}

	// white queenside castle
	if (
		board[from_i][from_j] == 5 &&
		!(white_king_has_moved || white_queenside_rook_has_moved) &&
		board[7][1] == 0 &&
		board[7][2] == 0 &&
		board[7][3] == 0 &&
		!attacked_squares.includes("e1") &&
		!attacked_squares.includes("d1") &&
		!attacked_squares.includes("c1")
	) {
		filtered.push("c1");
	}

	// black kingside castle
	if (
		board[from_i][from_j] == -5 &&
		!(black_king_has_moved || black_kingside_rook_has_moved) &&
		board[0][5] == 0 &&
		board[0][6] == 0 &&
		!attacked_squares.includes("f8") &&
		!attacked_squares.includes("g8") &&
		!attacked_squares.includes("e8")
	) {
		filtered.push("g8");
	}

	// black queenside castle
	if (
		board[from_i][from_j] == -5 &&
		!(black_king_has_moved || black_queenside_rook_has_moved) &&
		board[0][1] == 0 &&
		board[0][2] == 0 &&
		board[0][3] == 0 &&
		!attacked_squares.includes("e8") &&
		!attacked_squares.includes("d8") &&
		!attacked_squares.includes("c8")
	) {
		filtered.push("c8");
	}

	return filtered;
}

function get_long_attacks(dirs, from_i, from_j, board) {
	const attacked = [];
	dirs.forEach((dir) => {
		let stop = false;
		const di = dir[0];
		const dj = dir[1];
		let candidate_i = from_i + di;
		let candidate_j = from_j + dj;

		while (
			!stop &&
			candidate_i <= 7 &&
			candidate_j <= 7 &&
			candidate_i >= 0 &&
			candidate_j >= 0
		) {
			if (board[candidate_i][candidate_j] == 0) {
				attacked.push(idx_to_filerank(candidate_i, candidate_j));
				candidate_i += di;
				candidate_j += dj;
			} else if (
				board[candidate_i][candidate_j] * board[from_i][from_j] <= 0 &&
				Math.abs(board[candidate_i][candidate_j]) != 5
			) {
				attacked.push(idx_to_filerank(candidate_i, candidate_j));
				candidate_i += di;
				candidate_j += dj;
				stop = true;
			} else if (
				board[candidate_i][candidate_j] * board[from_i][from_j] <= 0 &&
				Math.abs(board[candidate_i][candidate_j]) == 5
			) {
				attacked.push(idx_to_filerank(candidate_i, candidate_j));
				candidate_i += di;
				candidate_j += dj;
			} else if (
				board[candidate_i][candidate_j] * board[from_i][from_j] >=
				0
			) {
				attacked.push(idx_to_filerank(candidate_i, candidate_j));
				stop = true;
			} else {
				stop = true;
			}
		}
	});
	return attacked;
}

function get_queen_attacking_squares(from, board) {
	let from_i = filerank_to_idx(from)[0];
	let from_j = filerank_to_idx(from)[1];

	const dirs = [
		[1, 0],
		[0, 1],
		[-1, 0],
		[0, -1],
		[1, 1],
		[-1, -1],
		[1, -1],
		[-1, 1],
	];

	return get_long_attacks(dirs, from_i, from_j, board);
}

function get_bishop_attacking_squares(from, board) {
	let from_i = filerank_to_idx(from)[0];
	let from_j = filerank_to_idx(from)[1];
	const dirs = [
		[-1, -1],
		[-1, 1],
		[1, -1],
		[1, 1],
	];
	return get_long_attacks(dirs, from_i, from_j, board);
}

function get_rook_attacking_squares(from, board) {
	let from_i = filerank_to_idx(from)[0];
	let from_j = filerank_to_idx(from)[1];

	const dirs = [
		[1, 0],
		[0, 1],
		[-1, 0],
		[0, -1],
	];

	return get_long_attacks(dirs, from_i, from_j, board);
}

function get_knight_attacking_squares(from, board) {
	let from_i = filerank_to_idx(from)[0];
	let from_j = filerank_to_idx(from)[1];
	const attacking = [];

	const dirs = [
		[-2, -1],
		[-2, 1],
		[1, -2],
		[1, 2],
		[2, 1],
		[2, -1],
		[-1, -2],
		[-1, 2],
	];

	dirs.forEach((dir) => {
		const di = dir[0];
		const dj = dir[1];
		let candidate_i = from_i + di;
		let candidate_j = from_j + dj;
		let stop = false;

		if (
			!stop &&
			candidate_i <= 7 &&
			candidate_i >= 0 &&
			candidate_j <= 7 &&
			candidate_j >= 0
		) {
			attacking.push(idx_to_filerank(candidate_i, candidate_j));
		}
	});

	return attacking;
}

function get_king_square(color, board) {
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[0].length; j++) {
			if (board[i][j] * color == 5) {
				return idx_to_filerank(i, j);
			}
		}
	}
}

function filter_revealed_checks(from, moves, board) {
	let from_i = filerank_to_idx(from)[0];
	let from_j = filerank_to_idx(from)[1];

	const color = board[from_i][from_j] > 0 ? 1 : -1;
	const to_remove = [];

	moves.forEach((m) => {
		const b = JSON.parse(JSON.stringify(board));
		const to_i = filerank_to_idx(m)[0];
		const to_j = filerank_to_idx(m)[1];

		b[to_i][to_j] = b[from_i][from_j];
		b[from_i][from_j] = 0;

		const attacked = get_attacked_squares(color, b);

		if (attacked.includes(get_king_square(color, b))) {
			to_remove.push(m);
		}
	});

	return moves.filter((m) => !to_remove.includes(m));
}

// return all squares that are attacked by the opposing pieces
// REFACTOR THIS
function get_attacked_squares(color, board) {
	let attacked = [];
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[0].length; j++) {
			if (
				board[i][j] * color < 0 &&
				[6, 4, 2].includes(Math.abs(board[i][j]))
			) {
				const from = idx_to_filerank(i, j);
				if (Math.abs(board[i][j]) == 2) {
					attacked = attacked.concat(
						get_bishop_attacking_squares(from, board)
					);
				} else if (Math.abs(board[i][j]) == 4) {
					attacked = attacked.concat(
						get_rook_attacking_squares(from, board)
					);
				} else {
					attacked = attacked.concat(
						get_queen_attacking_squares(from, board)
					);
				}
			} else if (board[i][j] * color < 0 && Math.abs(board[i][j]) != 5) {
				const from = idx_to_filerank(i, j);

				if (Math.abs(board[i][j]) == 3) {
					attacked = attacked.concat(
						get_knight_attacking_squares(from, board)
					);
				}

				// special case for diagonals of pawns since they are not legal moves in this situation
				if (Math.abs(board[i][j]) == 1) {
					if (i + color <= 7 && i + color >= 0) {
						if (j + 1 <= 7) {
							attacked.push(idx_to_filerank(i + color, j + 1));
						}

						if (j - 1 >= 0) {
							attacked.push(idx_to_filerank(i + color, j - 1));
						}
					}
				}
			}
		}
	}

	return attacked;
}

// is used to find legal moves for queen, biship, rook (i.e. pieces that can move long range)
function get_long_moves(dirs, from_i, from_j, board) {
	const legal_moves = [];
	dirs.forEach((dir) => {
		let stop = false;
		const di = dir[0];
		const dj = dir[1];
		let candidate_i = from_i + di;
		let candidate_j = from_j + dj;

		while (
			!stop &&
			candidate_i <= 7 &&
			candidate_j <= 7 &&
			candidate_i >= 0 &&
			candidate_j >= 0
		) {
			if (board[candidate_i][candidate_j] == 0) {
				legal_moves.push(idx_to_filerank(candidate_i, candidate_j));
				candidate_i += di;
				candidate_j += dj;
			} else if (
				board[candidate_i][candidate_j] * board[from_i][from_j] >
				0
			) {
				stop = true;
			} else {
				stop = true;
				legal_moves.push(idx_to_filerank(candidate_i, candidate_j));
			}
		}
	});
	return legal_moves;
}

// is used to find legal moves for shor-range moving pieces (the king and the knights)
function get_short_moves(dirs, from_i, from_j, board) {
	const legal_moves = [];
	dirs.forEach((dir) => {
		const di = dir[0];
		const dj = dir[1];
		let candidate_i = from_i + di;
		let candidate_j = from_j + dj;
		let stop = false;

		if (
			!stop &&
			candidate_i <= 7 &&
			candidate_i >= 0 &&
			candidate_j <= 7 &&
			candidate_j >= 0 &&
			board[candidate_i][candidate_j] * board[from_i][from_j] <= 0
		) {
			legal_moves.push(idx_to_filerank(candidate_i, candidate_j));
		}
	});

	return legal_moves;
}
// #endregion

function check_game_status(whose_turn, board) {
	// check if game is over
	let legal_moves = [];
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[0].length; j++) {
			if (board[i][j] * whose_turn > 0) {
				legal_moves = legal_moves.concat(
					get_legal_moves(idx_to_filerank(i, j), board)
				);
			}
		}
	}

	if (legal_moves.length == 0) {
		if (
			!get_attacked_squares(whose_turn, board).includes(
				get_king_square(whose_turn, board)
			)
		) {
			return 2;
		} else {
			return 1;
		}
	} else {
		return 0;
	}
}
function check_game_over(whose_turn, board) {
	// check if game is over
	const status = check_game_status(whose_turn, board);

	if (status != 0) {
		const msg =
			status == 2
				? "Stalemate. It's a draw."
				: `Checkmate. ${whose_turn == 1 ? "Black" : "White"} wins!`;
		Array.from(document.getElementsByClassName("piece")).forEach(
			(e) => (e.onmousedown = () => {})
		);
		alert(msg);
	}
}

function print_acn(moves) {
	let acn = "1.";
	for (let i = 0; i < moves.length; i++) {
		if (i != 0 && i % 2 == 0) {
			acn += "\n";
			acn += (i + 2) / 2 + ".";
		}
		acn += " " + moves[i];
	}
	console.log(acn);
}

//#region HELPER FUNCTIONS
function pretty_print(board) {
	let print_str = "";

	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[0].length; j++) {
			print_str +=
				board[i][j] < 0 ? ` ${board[i][j]}` : `  ${board[i][j]}`;
		}
		print_str += "\n";
	}

	console.log(print_str);
}

function idx_to_filerank(i, j) {
	const rank = 8 - i;
	const file = "abcdefgh"[j];
	return `${file}${rank}`;
}

function filerank_to_idx(filerank) {
	const i = 8 - parseInt(filerank[1]);
	const j = "abcdefgh".indexOf(filerank[0]);
	return [i, j];
}
//#endregion

function get_FEN(board, whose_turn) {
	let map = { 1: "P", 2: "B", 3: "N", 4: "R", 5: "K", 6: "Q" };
	let pieces = "";
	let num_vacant = 0;

	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[0].length; j++) {
			const piece = board[i][j];

			if ((piece > 0 || piece < 0) && num_vacant > 0) {
				pieces += num_vacant;
				num_vacant = 0;
			}
			if (piece > 0) {
				pieces += map[piece];
			} else if (piece < 0) {
				pieces += map[-1 * piece].toLowerCase();
			} else {
				num_vacant += 1;
			}
		}
		if (num_vacant > 0) {
			pieces += num_vacant;
			num_vacant = 0;
		}
		if (i != 7) pieces += "/";
	}

	const K =
		!white_king_has_castled &&
		!white_king_has_moved &&
		!white_kingside_rook_has_moved;
	const Q =
		!white_king_has_castled &&
		!white_king_has_moved &&
		!white_queenside_rook_has_moved;
	const k =
		!black_king_has_castled &&
		!black_king_has_moved &&
		!black_kingside_rook_has_moved;
	const q =
		!black_king_has_castled &&
		!black_king_has_moved &&
		!black_queenside_rook_has_moved;

	let castles = "";

	castles += K ? "K" : "";
	castles += Q ? "Q" : "";
	castles += k ? "k" : "";
	castles += q ? "q" : "";

	if (castles == " ") castles = "-";

	let en_passant = "-";

	const s = last_move.split(":");
	if (
		s[0].indexOf("1") > 0 &&
		Math.abs(parseInt(s[1][1]) - parseInt(s[2][1])) > 1
	) {
		en_passant = s[1][0];
		if (s[2][1] == "5") en_passant += 6;
		else en_passant += 3;
	}

	return `${pieces} ${
		whose_turn == 1 ? "w" : "b"
	} ${castles} ${en_passant} ${half_move_clock} ${full_move_clock}`;
}
