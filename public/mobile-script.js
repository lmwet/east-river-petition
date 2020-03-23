const canvas = $("#canvas");
console.log("mobile linked");
const ctx = $("#canvas")
    .get(0)
    .getContext("2d");

let touchX, touchY;

function draw(ctx, x, y) {
    canvas.width;
    ctx.fillStyle = "#000000";

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
}

function canvas_touchStart() {
    getTouchPos();
    draw(ctx, touchX, touchY, 12);

    // Prevents an additional mousedown event being triggered
    event.preventDefault();
}

function canvas_touchMove(e) {
    // Update the touch co-ordinates
    getTouchPos(e);

    // During a touchmove event, unlike a mousemove event, we don't need to check if the touch is engaged, since there will always be contact with the screen by definition.
    draw(ctx, touchX, touchY, 12);

    // Prevent a scrolling action as a result of this touchmove triggering.
    event.preventDefault();
}

// Get the touch position relative to the top-left of the canvas
// When we get the raw values of pageX and pageY below, they take into account the scrolling on the page
// but not the position relative to our target div. We'll adjust them using "target.offsetLeft" and
// "target.offsetTop" to get the correct values in relation to the top left of the canvas.
function getTouchPos(e) {
    if (!e) {
        var e = event;
    }

    if (e.touches) {
        if (e.touches.length == 1) {
            // Only deal with one finger
            var touch = e.touches[0]; // Get the information for finger #1
            touchX = touch.pageX - touch.target.offsetLeft;
            touchY = touch.pageY - touch.target.offsetTop;
        }
    }
}
draw();
canvas.addEventListener("touchstart", canvas_touchStart, false);
canvas.addEventListener("touchmove", canvas_touchMove, false);
