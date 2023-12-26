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

// checks if "to" square is in list of legal "from" squares
function is_legal_move(from, to, board) {
  //   const from_idx = filerank_to_idx(from);
  const to_idx = filerank_to_idx(to);

  const legal_moves = get_legal_moves(from, board);
  console.log(legal_moves);
  pretty_print(board);
  return legal_moves.includes(to_idx);
}

// all the fun move logic 😍
function get_legal_moves(from, board) {
  //   const file = from[0];
  const rank = parseInt(from[1]);
  const from_idx = filerank_to_idx(from);
  const legal_moves = [];

  console.log(from_idx);

  // white pawn moves
  if (board[from_idx] == 1) {
    // if up one is in play and unoccupied
    if (from_idx - 8 >= 0 && board[from_idx - 8] == 0) {
      legal_moves.push(from_idx - 8);

      // now same for up two, if on starting rank
      if (rank == 2 && from_idx - 16 >= 0 && board[from_idx - 16] == 0) {
        legal_moves.push(from_idx - 16);
      }
    }

    // now check possible capturing squares
    // if ↗️ is in play and occupied by a black non-king piece, we can take
    if (
      from_idx - 1 - 8 >= 0 &&
      board[from_idx - 1 - 8] < 0 &&
      board[from_idx - 1 - 8] != -5
    ) {
      legal_moves.push(from_idx - 1 - 8);
    }

    // check same for ↖️
    if (
      from_idx + 1 - 8 >= 0 &&
      board[from_idx + 1 - 8] < 0 &&
      board[from_idx + 1 - 8] != -5
    ) {
      legal_moves.push(from_idx + 1 - 8);
    }
    // bleh, en passant
    // bleh, filter for illegal checks
  } else if (board[from] == 47) {
    // ...
  } else {
    // for now just say no moves are allowed
    return [];
  }

  return legal_moves;
}

function make_move(from, to, board) {
  const from_idx = filerank_to_idx(from);
  const to_idx = filerank_to_idx(to);

  // set to piece as from piece and from piece is now empty (0)
  board[to_idx] = board[from_idx];
  board[from_idx] = 0;
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
// let window_width = window.innerWidth;
// let window_height = window.innerHeight;

// function reportWindowSize() {
//   let diff_x = window_width - window.innerWidth;
//   let diff_y = window_height - window.innerHeight;
//   window_width = window.innerWidth;
//   window_height = window.innerHeight;

//   console.log(window.innerWidth);

//   $(".piece").each(function () {
//     console.log(parseInt($(this).css("top")));
//     // console.log($(this));
//     $(this).css("top", parseInt($(this).css("top")) - diff_y + "px");
//     $(this).css("left", parseInt($(this).css("left")) - diff_x + "px");
//   });
// }

// window.onresize = reportWindowSize;

// $("#a1").on("resize", function () {
//   console.log("ghekllo");
// });
