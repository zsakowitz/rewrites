# Coordinate Systems

We use a few different coordinate systems within `cv2`.

**Offset space.** Offset space is defined relative to some HTML element `el`.
For it, `(0, 0)` means the top-left of the element's padding box, and
`(el.offsetWidth, el.offsetHeight)` means the bottom-right of the element's
padding box.

**Unit space.** Unit space is defined relative to some HTML element `el`. It
defines `(0, 0)` to be the center of the element, and
`(-el.offsetWidth / el.offsetHeight, -1)` to be the top-left corner of the
element.

Offset space and unit space follow the DOM convention that more positive
Y-coordinates are further down the page.

**Local space.** Local space is like the coordinate space you normally interact
with in Desmos or project nya -- it's the system that the user defines objects
in.

2D local space follows the mathematical convention that more positive
Y-coordinates are further up the page.
