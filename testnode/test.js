var acorn = require("acorn")

var ast = acorn.parse('var x = 42; // answer');

// generate code
console.log(ast);