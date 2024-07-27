const socket = io()
const chess = new Chess()
const boardElement = document.querySelector(".chessboard")

let draggedPiece = null
let sourceSquare = null
let playerRole = null

const renderBoard = function(){
   const board = chess.board()
   boardElement.innerHTML = ""
   board.forEach((row,rowIndex) => {
       row.forEach((sqaure,squareIndex)=>{
        const sqaureElement = document.createElement("div")
         sqaureElement.classList.add(
            "square",(rowIndex + squareIndex)%2 === 0 ? "light" :"dark"
         )
        sqaureElement.dataset.row = rowIndex
        sqaureElement.dataset.col = squareIndex

        if(sqaure){
            const pieceElement = document.createElement("div")
            pieceElement.classList.add(
                "piece",
                sqaure.color === "w" ? "white":"black"
            )
            pieceElement.innerText = getPieceCode(sqaure)
            pieceElement.draggable = playerRole === sqaure.color;

            pieceElement.addEventListener("dragstart",(e)=>{
                if(pieceElement.draggable){
                    draggedPiece = pieceElement;
                    sourceSquare = {row: rowIndex,col: squareIndex}
                    e.dataTransfer.setData("text/plain",""); //so that we can't get the error while performing the drag operation
                }
            })

            pieceElement.addEventListener("dragged",(e)=>{
                draggedPiece  = null;
                sourceSquare = null;
            })

            sqaureElement.appendChild(pieceElement)
        }

        sqaureElement.addEventListener("dragover",function(e){
            e.preventDefault()
        })

        sqaureElement.addEventListener("drop",function(e){
            e.preventDefault()
            if(draggedPiece){
                const targetSquare= {
                    row:parseInt(sqaureElement.dataset.row),
                    col: parseInt(sqaureElement.dataset.col)
                }
                handleMove(sourceSquare,targetSquare)
            }
        })
        boardElement.appendChild(sqaureElement)
       })
       
   });
   if(playerRole ==="b"){
    boardElement.classList.add("flipped")
   }
   else{
    boardElement.classList.remove("flipped")
   }
}
 
const handleMove = function(source,target){
    const move = {
        from:`${String.fromCharCode(97+source.col)}${8-source.row}`,
        to:`${String.fromCharCode(97+target.col)}${8-target.row}`,
        promotion:"q"
    }
    socket.emit("move",move)
}
const getPieceCode = function(piece){
   const unicodePieces = {
      p:"♙",
      r:"♜",
      n:"♞",
      b:"♝",
      q:"♛",
      k:"♚",
      P:"♙",
      R:"♜",
      N:"♞",
      B:"♝",
      Q:"♛",
      K:"♚",
   }
   return unicodePieces[piece.type] || ""
}

socket.on("playerRole",function(role){
     playerRole = role;
     renderBoard()
})

socket.on("spectatorRole",function(){
    playerRole = null;
    renderBoard()
})

socket.on("boardState",function(fen){
    chess.load(fen)
    renderBoard()
})

socket.on("move",function(move){
    chess.move(move);
    renderBoard()
})
socket.on("Invalid",function(){
    console.log("Invalid move by the player")
})

renderBoard()