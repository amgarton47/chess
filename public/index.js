const doc = $("#board");

// create board
for(let i = 0; i < 64; i ++){
    let x = i % 8;
    let y = Math.floor(i / 8);

    let file = "abcdefgh"[x];
    let rank = y + 1;

    let color = (x + y) % 2 == 0? "dark" : "light";

    // console.log(x, y, file, rank);
    doc.append(`<div id="${file}:${rank}" class="${color} square">${file}${rank}</div>`)
}

$("body").append('<img id="black_king" src="pieces/black_king.png" class="piece">')
$("body").append('<img id="black_queen" src="pieces/black_queen.png" class="piece">')

dragElement(document.getElementById("black_king"));
dragElement(document.getElementById("black_queen"));


// make div elt draggable
function dragElement(elt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
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
    elt.style.top = (elt.offsetTop - pos2) + "px";
    elt.style.left = (elt.offsetLeft - pos1) + "px";
  }

  function closeDragElement(e) {
    // removes z-index increase
    elt.classList.remove("active");

    // snap piece to center of square
    const square = document.elementsFromPoint(e.clientX, e.clientY)[1].id
    const position = document.getElementById(square).getBoundingClientRect();
    elt.style.top = position.top + 10 + "px";
    elt.style.left = position.left + 10 + "px";


    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}