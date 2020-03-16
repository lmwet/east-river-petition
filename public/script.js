const canvas = $("#canvas");
console.log(canvas);
var signed;
const ctx = $("#canvas")
    .get(0)
    .getContext("2d");
let moves = new Array();
let mousedown;

function redraw() {
    canvas.width;
    ctx.strokeStyle = "#000000";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;

    for (var i = 0; i < moves.length; i++) {
        ctx.beginPath();
        if (moves[i][2] && i) {
            ctx.moveTo(moves[i - 1][0], moves[i - 1][1]);
        } else {
            ctx.moveTo(moves[i][0], moves[i][1]);
        }
        ctx.lineTo(moves[i][0], moves[i][1]);
        ctx.closePath();
        ctx.stroke();
    }
}

$("#canvas").mousedown(function(e) {
    mousedown = true;
    moves.push([e.pageX - this.offsetLeft, e.pageY - this.offsetTop, false]);
    redraw();
});

$("#canvas").mousemove(function(e) {
    if (mousedown) {
        moves.push([e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true]);
        redraw();
        signed = true;
    }
});

$("#canvas").mouseup(function() {
    mousedown = false;
});

$("#canvas").mouseleave(function() {
    mousedown = false;
});
redraw();

$("#submit").click(function() {
    let signature = $("#canvas")
        .get(0)
        .toDataURL();
    if (!signed === true) {
        alert("Please signe with your mouse before submitting.");
    } else {
        $("#hiddenField").val(signature);
        console.log("signature", signature);
    }
});
