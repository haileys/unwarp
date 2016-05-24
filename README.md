## Unwarp

Unwarp is a little toy I hacked up for removing panoramic warping from panorama images.

Once you've loaded an image up, use the curve selectors (the red and green lines) to input unwarping parameters. The best way to do this is to find some lines in the image that should be straight but are instead curved due to panoramic warping.

There's two handles on each curve that you can move around to control the shape of the curve - the inflection point handle and the control point handle.

The inflection point handle should be placed near the center of the image, where the warped line you're trying to fit actually appears straight.

The control point handle can go anywhere else along the line. It doesn't matter where as long as the curve accurately fits the line. You might find that placing the control point somewhere near the edge of the image makes it easier to make the curve accurate.

The blue line is the zero-Y line. This is automatically determined based on the curve selectors. Along this line straight lines should appear straight, even in the input image.

The purple line is the average of the two curve selectors. This is what's actually used during unwarping.

### Problems

* It's assumed that the warping fits a quadratic curve. This is not actually the case - the warping is probably spherical. It turns out though that a quadratic is an easy and accurate-enough approximation in most cases.

* Warping is only corrected in a way that makes straight lines appear straight. This tool doesn't even try to correct squashing near the edges of the image (you'll find that objects of the same size will appear larger near the inflection and smaller near the edges)

* No interpolation between pixels is done when unwarping, so unwarped images will probably have jagged edges when viewed at full size.

* Probably many more.
