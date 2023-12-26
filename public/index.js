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

// const board = [
//   0, 0, 0, -6, -5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
// ];

// create visual board
for (let i = 0; i < 64; i++) {
  let x = 7 - (i % 8);
  let y = Math.floor(i / 8);

  let file = "abcdefgh"[x];
  let rank = y + 1;
  let color = (x + y) % 2 == 0 ? "dark" : "light";

  doc.prepend(
    `<div id="${file}${rank}" class="${color} square">${file}${rank}</div>`
  );
}

const squares = $("#board").children();

for (let i = 0; i < board.length; i++) {
  const piece = Math.abs(board[i]);
  if (piece == 0) continue;

  const piece_name = piece_mappings[piece];
  const piece_color = board[i] > 0 ? "white" : "black";
  const piece_img = `pieces/${piece_color}_${piece_name}.png`;

  let x = 7 - (i % 8);
  let y = Math.floor(i / 8);

  let file = "abcdefgh"[x];
  let rank = y + 1;

  const pos = squares[i].getBoundingClientRect();

  $("body").append(
    `<img id="${file}${rank}_${piece_color}_${piece_name}" src="${piece_img}" class="piece" style="top:${
      pos.top + 10 + "px"
    }; left:${pos.left + 10 + "px"};">`
  );

  dragElement(
    document.getElementById(`${file}${rank}_${piece_color}_${piece_name}`)
  );
}

// make div elt draggable
function dragElement(elt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elt.id + "header")) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elt.id + "header").onmousedown = dragMouseDown;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    elt.classList.add("active");
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
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

    // snap piece to center of square
    const square = document.elementsFromPoint(e.clientX, e.clientY)[1].id;
    const position = document.getElementById(square).getBoundingClientRect();
    console.log(position.top + 10, position.left + 10);
    elt.style.top = position.top + 10 + "px";
    elt.style.left = position.left + 10 + "px";

    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
