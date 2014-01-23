
var bleepsixBoard = require("./bleepsixBoardNode.js");
var bleepsixBoardController = require("./bleepsixBoardController.js");

var brd = new bleepsixBoard();
var g_board_controller = new bleepsixBoardController();

console.log( brd.kicad_brd_json );
console.log( g_board_controller.board.kicad_brd_json );

