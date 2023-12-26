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
  -4, -3, -2, -6, -5, -2, -3, -4, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 1, 1, 1, 1, 1, 1, 1, 1, 4, 3, 2, 6, 5, 2, 3, 4,
];

// create board and pieces according to starting board ^
for (let i = 0; i < board.length; i++) {
  let x = i % 8;
  let y = Math.floor(i / 8);

  let file = "abcdefgh"[x];
  let rank = 8 - y;
  let color = (x + 1 + rank) % 2 == 0 ? "dark" : "light";

  doc.append(`<div id="${file}${rank}" class="${color} square"></div>`);

  const piece = Math.abs(board[i]);
  if (piece != 0) {
    const piece_name = piece_mappings[piece];
    const piece_color = board[i] > 0 ? "white" : "black";
    const piece_img = `pieces/${piece_color}_${piece_name}.png`;

    const square = $("#board div").last()[0];
    const pos = square.getBoundingClientRect();

    $("body").append(
      `<img id="${file}${rank}_${piece_color}_${piece_name}" src="${piece_img}" class="piece" style="top:${
        pos.top + 1.75 + "px"
      }; left:${pos.left + 1.75 + "px"};">`
    );

    dragElement(
      document.getElementById(`${file}${rank}_${piece_color}_${piece_name}`)
    );
  }
}

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

  function dragMouseDown(e) {
    if (!start_square) {
      start_square = document
        .elementsFromPoint(e.clientX, e.clientY)
        .find((elt) => elt.classList.contains("square")).id;
    }

    elt.classList.add("active");

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
    ) {
      // snap piece to center of square
      const position = document
        .getElementById(current_square.id)
        .getBoundingClientRect();
      startx = position.top + 1.75;
      starty = position.left + 1.75;

      // make move on array board
      make_move(start_square, current_square.id, board);

      // set start square as new square
      start_square = current_square.id;
    }
    // return to orig location if invalid new location
    elt.style.top = startx + "px";
    elt.style.left = starty + "px";

    // stop moving when mouse is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// converts [file][rank] notation to the corresponding index in the board array
function filerank_to_idx(filerank) {
  const file = filerank[0];
  const rank = parseInt(filerank[1]);
  return 8 * (8 - rank) + "abcdefgh".indexOf(file);
}

function make_move(from, to, board) {
  const from_idx = filerank_to_idx(from);
  const to_idx = filerank_to_idx(to);

  // set to piece as from piece and from piece is now empty (0)
  board[to_idx] = board[from_idx];
  board[from_idx] = 0;
  pretty_print(board);
}

// checks if "to" square is in list of legal "from" squares
function is_legal_move(from, to, board) {
  //   const from_idx = filerank_to_idx(from);
  const to_idx = filerank_to_idx(to);

  const legal_moves = get_legal_moves(from, board);
  console.log(legal_moves);
  return legal_moves.includes(to_idx);
}

// all the fun move logic 😍
function get_legal_moves(from, board) {
  // const file = from[0];
  // const rank = parseInt(from[1]);
  const from_idx = filerank_to_idx(from);

  // white pawn moves
  if (Math.abs(board[from_idx]) == 1) {
    return get_legal_pawn_moves(from, board);
  } else {
    // for now just say no moves are allowed
    return [];
  }
}

function get_legal_pawn_moves(from, board) {
  const from_idx = filerank_to_idx(from);
  const rank = parseInt(from[1]);
  const legal_moves = [];

  const color = board[from_idx] < 0 ? -1 : 1;

  // if up one is in play and unoccupied
  let up_one = from_idx - 8 * color;
  if (
    board[up_one] == 0 &&
    ((color == -1 && up_one < 64) || (color == 1 && up_one >= 0))
  ) {
    legal_moves.push(up_one);
  }

  // now same for up two, if on starting rank
  let up_two = from_idx - 16 * color;
  if (
    (board[up_two] == 0) & (board[up_one] == 0) &&
    ((color == -1 && rank == 7 && up_two >= 0) ||
      (color == 1 && rank == 2 && up_two < 64))
  ) {
    legal_moves.push(up_two);
  }

  // now check possible capturing squares
  // if ↗️ is in play and occupied by an opposite-color non-king piece, we can take
  const diag_moves = [from_idx - 1 - 8 * color, from_idx + 1 - 8 * color];
  diag_moves.forEach((move) => {
    if (
      (color == -1 && move < 64 && board[move] > 0) ||
      (color == 1 && move >= 0 && board[move] < 0)
    ) {
      legal_moves.push(move);
    }
  });

  // bleh, en passant
  // bleh, filter for illegal checks
  return legal_moves;
}

function pretty_print(board) {
  let print_str = "";

  for (let i = 0; i < board.length; i++) {
    if (board[i] < 0) {
      print_str += ` ${board[i]}`;
    } else {
      print_str += `  ${board[i]}`;
    }

    if ((i + 1) % 8 == 0) {
      print_str += "\n";
    }
  }

  console.log(print_str);
}

// fix pieces on window resize
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
