# Image Viewer

This is an image viewer plugin handling multiple views and zooming in/out.

## Usage

This plugin expects several options.

Typical usage:

    this.view.imageViewer({
        images: this.data.images,
        dimensions: {
            detail: [500,  625],
            zoom:   [1920, 2400]
        },
        imageUrlFormat: function (src, width, height) {
            return "http://debeers.images.dev.createthesoftware.com/image/{1}/{2}/{0}".format(src, width, height);
        },
        elements: {
            previews: this.view.find('.preview-image-set'),
            stage:    this.view.find('.image-stage'),
            zoomIn:   this.view.find('.control-zoom-in .control-a'),
            zoomOut:  this.view.find('.control-zoom-out .control-a')
        }
    });

### Images

The value supplied for the images option should be an array of image paths. They may or may not be complete urls.

### Dimensions

The images in this viewer are used in two dimensions: `detail` and `zoom`. There are default values provided, but you can override each of the sizes using an array of two integers for width and height respectively.

### ImageUrlFormat

This function is called once for every combination of image dimension and image passed in for the `images` option. It receives three parameters: the image `src` or URL (the one passed in for the `images` option), and the respective `width` and `height` for the current dimension. It should return a valid image URL.

### Elements

Elements is an object which expects several DOM elements.

#### Previews

Previews should be a container that has a set of links. By default, the preview links are found using `previews.find('a')`, but if you need a more specific selector for finding links, such as those with a particular class, or if you would prefer to use an element other than links altogether, you can do so by overriding the `previewLinkSelector` option with the selector to be passed to the `find` method.

The links are traversed in order and each link is set to trigger updating the current image to the respective index of the `images` array.


#### Stage

The stage is where the images are displayed and zoomed. This is likely an element whose style is set to `overflow: hidden` and where you display the original image.

#### Zoom In

This is the element that will trigger zooming in.

#### Zoom Out

This is the element that will trigger zooming out.

## Dependencies

This plugin depends on the jQuery UI Widget Factory and also the jQuery easing plugin. These files are expected to be bundled with each project.