const doc = $("#board");

const piece_mappings = {
	1: "pawn",
	2: "bishop",
	3: "knight",
	4: "rook",
	5: "king",
	6: "queen",
};

const board = [
	[-4, -3, -2, -6, -5, -2, -3, -4],
	[-1, -1, -1, -1, -1, -1, -1, -1],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[1, 1, 1, 1, 1, 1, 1, 1],
	[4, 3, 2, 6, 5, 2, 3, 4],
];

let whose_turn = 1; // 1: white, -1: black
let black_king_has_moved = false;
let white_king_has_moved = false;

let white_kingside_rook_has_moved = false;
let white_queenside_rook_has_moved = false;

let black_kingside_rook_has_moved = false;
let black_queenside_rook_has_moved = false;

let white_king_has_castled = false;
let black_king_has_castled = false;

// create board and pieces according to starting board ^
for (let i = 0; i < board.length; i++) {
	for (let j = 0; j < board[0].length; j++) {
		let x = j;
		let y = i;

		let file = "abcdefgh"[x];
		let rank = 8 - y;
		let color = (x + 1 + rank) % 2 == 0 ? "dark" : "light";

		doc.append(`<div id="${file}${rank}" class="${color} square"></div>`);

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
		// call dragElement again so
		dragElement(document.getElementById($(this).attr("id")));
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
			const i = file_rank_to_idx(m)[0];
			const j = file_rank_to_idx(m)[1];
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
			is_legal_move(start_square, current_square.id, board)
			// && piece_color * whose_turn > 0
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
				Array.from(document.getElementsByClassName("piece")).forEach(
					(e) => (e.onmousedown = () => {})
				);
				alert(
					`Checkmate. ${whose_turn == 1 ? "Black" : "White"} wins!`
				);
			}
		}
		// return to orig location if invalid new location
		elt.style.top = startx + "px";
		elt.style.left = starty + "px";

		$(".square .legal_move").remove();
		$(".square .legal_move_capture").remove();

		// stop moving when mouse is released:
		document.onmouseup = null;
		document.onmousemove = null;
	}
}

function do_castle(from, to, board) {
	const from_i = file_rank_to_idx(from)[0];
	const from_j = file_rank_to_idx(from)[1];

	const to_i = file_rank_to_idx(to)[0];
	const to_j = file_rank_to_idx(to)[1];

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
	const from_rank = parseInt(from[1]);
	const from_file = from[0];
	const from_i = 7 - from_rank + 1;
	const from_j = "abcdefgh".indexOf(from_file);

	const to_rank = parseInt(to[1]);
	const to_file = to[0];
	const to_i = 7 - to_rank + 1;
	const to_j = "abcdefgh".indexOf(to_file);

	// if move is a capture, remove captured piece
	if (board[to_i][to_j] != 0) {
		$(`.${to}`)[0].remove();
	}

	// mark if king or rook has moved for castling purposes
	if (!white_king_has_moved && board[from_i][from_j] == 5) {
		white_king_has_moved = true;
	}

	if (!black_king_has_moved && board[from_i][from_j] == -5) {
		black_king_has_moved = true;
	}

	if (
		board[from_i][from_j] == 4 &&
		from_j == 0 &&
		!white_queenside_rook_has_moved
	) {
		white_queenside_rook_has_moved = true;
	}

	if (
		board[from_i][from_j] == 4 &&
		from_j == 7 &&
		!white_kingside_rook_has_moved
	) {
		white_kingside_rook_has_moved = true;
	}

	if (
		board[from_i][from_j] == -4 &&
		from_j == 0 &&
		!black_queenside_rook_has_moved
	) {
		black_queenside_rook_has_moved = true;
	}

	if (
		board[from_i][from_j] == 4 &&
		from_j == 7 &&
		!black_kingside_rook_has_moved
	) {
		black_kingside_rook_has_moved = true;
	}

	// if castling
	if (
		(Math.abs(board[from_i][from_j]) == 5 &&
			!white_king_has_castled &&
			(to == "g1" || to == "c1")) ||
		(!black_king_has_castled && (to == "g8" || to == "c8"))
	) {
		do_castle(from, to, board);
	} else {
		// else reg move
		// set to piece as from piece and from piece is now empty (0)
		board[to_i][to_j] = board[from_i][from_j];
		board[from_i][from_j] = 0;

		// pawns promote to queens if they reach opposite last rank
		if (board[to_i][to_j] == 1 && to_rank == 8) {
			board[to_i][to_j] = 6;
			console.log($(`.${idx_to_filerank(from_i, from_j)}`)[0]);
			$(`.${idx_to_filerank(from_i, from_j)}`)
				.first()
				.attr("src", "pieces/white_queen.png");
		}

		if (board[to_i][to_j] == -1 && to_rank == 1) {
			board[to_i][to_j] = -6;
			$(`.${idx_to_filerank(from_i, from_j)}`)
				.first()
				.attr("src", "pieces/black_queen.png");
		}
	}
}

// checks if "to" square is in list of legal "from" squares
function is_legal_move(from, to, board) {
	return get_legal_moves(from, board).includes(to);
}

// all the fun move logic 😍
function get_legal_moves(from, board) {
	let from_i = file_rank_to_idx(from)[0];
	let from_j = file_rank_to_idx(from)[1];

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

// #region MOVE LOGIC
function get_legal_pawn_moves(from, board) {
	const rank = parseInt(from[1]);
	let from_i = file_rank_to_idx(from)[0];
	let from_j = file_rank_to_idx(from)[1];

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
			((color == -1 && rank == 7) || (color == 1 && rank == 2)) &&
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

	// bleh, en passant
	// bleh, filter for illegal revealed checks
	return legal_moves;
}

function get_legal_bishop_moves(from, board) {
	let from_i = file_rank_to_idx(from)[0];
	let from_j = file_rank_to_idx(from)[1];
	const dirs = [
		[-1, -1],
		[-1, 1],
		[1, -1],
		[1, 1],
	];
	return get_long_moves(dirs, from_i, from_j, board);
}

function get_legal_knight_moves(from, board) {
	let from_i = file_rank_to_idx(from)[0];
	let from_j = file_rank_to_idx(from)[1];
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
	let from_i = file_rank_to_idx(from)[0];
	let from_j = file_rank_to_idx(from)[1];

	const dirs = [
		[1, 0],
		[0, 1],
		[-1, 0],
		[0, -1],
	];

	return get_long_moves(dirs, from_i, from_j, board);
}

function get_legal_queen_moves(from, board) {
	let from_i = file_rank_to_idx(from)[0];
	let from_j = file_rank_to_idx(from)[1];

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
	let from_i = file_rank_to_idx(from)[0];
	let from_j = file_rank_to_idx(from)[1];

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

	// now check castling

	if (
		board[from_i][from_j] == 5 &&
		!(white_king_has_moved || white_kingside_rook_has_moved) &&
		board[7][5] == 0 &&
		board[7][6] == 0 &&
		!attacked_squares.includes("f1") &&
		!attacked_squares.includes("g1") &&
		!attacked_squares.includes("e1")
	) {
		filtered.push("g1");
	}

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
	let from_i = file_rank_to_idx(from)[0];
	let from_j = file_rank_to_idx(from)[1];

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
	let from_i = file_rank_to_idx(from)[0];
	let from_j = file_rank_to_idx(from)[1];
	const dirs = [
		[-1, -1],
		[-1, 1],
		[1, -1],
		[1, 1],
	];
	return get_long_attacks(dirs, from_i, from_j, board);
}

function get_rook_attacking_squares(from, board) {
	let from_i = file_rank_to_idx(from)[0];
	let from_j = file_rank_to_idx(from)[1];

	const dirs = [
		[1, 0],
		[0, 1],
		[-1, 0],
		[0, -1],
	];

	return get_long_attacks(dirs, from_i, from_j, board);
}

function get_knight_attacking_squares(from, board) {
	let from_i = file_rank_to_idx(from)[0];
	let from_j = file_rank_to_idx(from)[1];
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
	let from_i = file_rank_to_idx(from)[0];
	let from_j = file_rank_to_idx(from)[1];

	const color = board[from_i][from_j] > 0 ? 1 : -1;
	const to_remove = [];

	moves.forEach((m) => {
		const b = JSON.parse(JSON.stringify(board));
		const to_i = file_rank_to_idx(m)[0];
		const to_j = file_rank_to_idx(m)[1];

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

function file_rank_to_idx(filerank) {
	const i = 8 - parseInt(filerank[1]);
	const j = "abcdefgh".indexOf(filerank[0]);
	return [i, j];
}
//#endregion
