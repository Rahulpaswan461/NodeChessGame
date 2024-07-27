const express = require("express")
const http = require("node:http")
const socket = require("socket.io")
const {Chess} = require("chess.js")
const path = require("node:path")

const app = express()
const PORT = process.env.PORT || 8000

const server = http.createServer(app)

const io = socket(server)
//this will contains all the information and rules those are use while palying the chess game
const chess = new Chess()
let players = {}
let currentPlayer = "w"

app.set("view engine","ejs")
app.use(express.static(path.join(__dirname,"public")))

app.get("/",(req,res)=>{
    return res.render("index",{title:"Chess game"})
})

io.on("connection",(socket)=>{
   console.log("Connected !!")
   if(!players.white){
     players.white = socket.id;
     socket.emit("playerRole","w")
   }
   else if(!players.black){
    players.black = socket.id;
    socket.emit("playerRole","b")
   }
   else{
    socket.emit("spectatorRole")
   }

   socket.on("disconnect",function(){
     if(socket.id === players.white){
        delete players.white;
     }
     else if(socket.id === players.black){
        delete players.black
     }
     
   })

   //events for the player
   socket.on("move", (move) => {
      try {
          // Ensure it's the correct player's turn
          if ((chess.turn() === "w" && socket.id !== players.white) ||
              (chess.turn() === "b" && socket.id !== players.black)) {
              return; // Ignoring move as it's not the player's turn
          }
  
          // Validate the move format
          if (typeof move !== 'object' || !move.from || !move.to) {
              throw new Error("Invalid move format");
          }
  
          // Attempt to make the move
          const result = chess.move(move);
  
          if (result) {
              currentPlayer = chess.turn(); // Update to the next player's turn
              io.emit("move", move); // Notify all clients about the move
              io.emit("boardState", chess.fen()); // Send updated board state
              console.log("Board state updated");
          } else {
              console.log("Invalid move", move);
              socket.emit("Invalid", { move, reason: "Invalid move" }); // Emit invalid move
          }
      } catch (error) {
          console.error("Error processing move:", error.message);
          socket.emit("Invalid", { move, reason: "An error occurred" }); // Emit error details to the client
      }
  })
})
server.listen(PORT,()=>{
    console.log("Server is running !!")
})