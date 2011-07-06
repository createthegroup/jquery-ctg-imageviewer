/*global  jQuery */
/*jshint eqeqeq: true, curly: true, white: true */

(function ($) {

    $.widget('ctg.imageViewer', {

        options: {
            images: [],
            dimensions: {
                detail: [500,  625],
                zoom:   [1920, 2400]
            },
            zoomSteps: 3,
            imageUrlFormat: function () {
                throw "jQuery.ctg.imageViewer: You are required to supply a function for 'imageUrlFormat'";
            },
            previewLinkSelector: 'a',
            onImageUpdate: function () {}
        },

        _create: function () {

            this._objects();
            this._calculateZoomSettings();
            this._initializeImages();
            this._resetImageAttributes();
            this._createBlocker();
            this._events();

            return;
        },

        _objects: function () {

            var elems = this.options.elements;

            this.objects = {};

            this.objects.previews = elems.previews || $('<div />');
            this.objects.stage    = elems.stage    || $('<div />');
            this.objects.zoomIn   = elems.zoomIn   || $('<a />');
            this.objects.zoomOut  = elems.zoomOut  || $('<a />');

            return;
        },

        _events: function () {

            var self = this;

            this.objects.previews.find(this.options.previewLinkSelector).each(function (i) {

                $(this).click(function (e) {
                    e.preventDefault();

                    self.showImage(i);
                });

            });

            this.objects.zoomIn.click(function (e) {
                e.preventDefault();

                self.zoomIn();
            });

            this.objects.zoomOut.click(function (e) {
                e.preventDefault();

                self.zoomOut();
            });

            this.objects.blocker
                .click(function (e) {
                    if (self.zoomLevel < self.zoomSettings.length - 1) {
                        self.zoomIn(e);
                    }
                    else {
                        self.resetZoomLevel();
                    }
                })
                .mousemove(function (e) {
                    self._pan(e);
                })
                ;

            this.element.hover(function () {
                self.showZoomImage();
            }, function () {
                self.hideZoomImage();
            });

            return;
        },

        _createBlocker: function () {

            this.objects.blocker = $('<div />');

            this.objects.blocker.css({
                // Hack to make IE respect mouse events on blocker
                background: 'url(' + this.images[0].detail + ') no-repeat -9999em 0',
                position: 'absolute',
                top:      0,
                left:     0,
                width:    '100%',
                height:   '100%'
            });

            this.objects.blocker.appendTo(this.objects.stage);

            return;
        },

        _initializeImages: function () {

            var self = this,
                dims = this.options.dimensions;

            this.index  = 0;
            this.images = [];

            this.images = $.map(this.options.images, function (src) {
                return {
                    detail: self.options.imageUrlFormat(src, dims.detail[0], dims.detail[1]),
                    zoom: self.options.imageUrlFormat(src, dims.zoom[0], dims.zoom[1])
                };
            });

            this.objects.detailImage = this.objects.stage.find('img');

            this.objects.detailImage.css({
                position: 'absolute',
                top:      0,
                left:     0,
                width:    this.zoomSettings[0].w,
                height:   this.zoomSettings[0].h
            });

            return;
        },

        _calculateZoomSettings: function () {

            var dims  = this.options.dimensions,
                steps = this.options.zoomSteps,
                stage = this.objects.stage,
                detail,
                zoom,
                increment,
                i;

            detail = {
                w: dims.detail[0],
                h: dims.detail[1]
            };

            zoom = {
                w: dims.zoom[0],
                h: dims.zoom[1]
            };

            // Takes the n-th root, where 'n' is steps
            increment = {
                w: Math.exp(Math.log(zoom.w / detail.w) / steps),
                h: Math.exp(Math.log(zoom.h / detail.h) / steps)
            };

            this.offset = stage.offset();

            this.clipper = {
                w: stage.width(),
                h: stage.height()
            };

            this.zoomSettings = [];

            for (i = 0; i <= steps; i++) {
                this.zoomSettings.push({
                    w: Math.round(detail.w * Math.pow(increment.w, i)),
                    h: Math.round(detail.h * Math.pow(increment.h, i))
                });
            }

            return;
        },

        zoomIn: function (e) {

            if (this.zoomLevel >= this.zoomSettings.length - 1) {
                return;
            }

            if (!this.objects.zoomImage) {
                this._loadZoomImage();
            }

            this.zoomLevel++;

            this._zoomToLevel(e);

            return;
        },

        zoomOut: function (e) {

            if (this.zoomLevel < 1) {
                return;
            }

            this.zoomLevel--;

            this._zoomToLevel(e);

            return;
        },

        resetZoomLevel: function (e) {

            this.zoomLevel = 0;

            this._zoomToLevel(e);

            return;
        },

        _zoomToLevel: function (e) {

            var self   = this,
                offset = this._calculateOffset(e),
                dims   = this.zoomSettings[this.zoomLevel];

            this.disable();

            this.objects.zoomImage
                .show()
                .animate({
                    left:     offset.x,
                    top:      offset.y,
                    width:    dims.w,
                    height:   dims.h
                }, {
                    duration: 400,
                    easing:   'easeOutCubic',
                    queue:     false,
                    complete:  function () {

                        if (self.zoomLevel === 0) {
                            if (self.objects.zoomImage) {
                                self.objects.zoomImage.hide();
                            }
                        }

                        self.enable();
                    }
                })
                ;

            return;
        },

        _loadZoomImage: function () {

            var self = this;

            this.objects.zoomImage = this.objects.detailImage.clone().insertBefore(this.objects.blocker);

            $(new Image())
                .bind('load', function () {

                    self.objects.zoomImage.attr('src', this.src);

                })
                .attr('src', this.images[this.index].zoom)
                ;

            return;
        },

        _pan: function (e) {

            var offset;

            if (this.options.disabled || !this.objects.zoomImage) {
                return;
            }

            offset = this._calculateOffset(e);

            this.objects.zoomImage.css({
                left: offset.x,
                top: offset.y
            });

            return;
        },

        _calculateOffset: function (e) {

            var cursor, scale, dims, maxX, maxY;

            dims = this.zoomSettings[this.zoomLevel];

            if (!e) {
                return {
                    x: (dims.w - this.clipper.w) / -2,
                    y: (dims.h - this.clipper.h) / -2
                };
            }

            maxX = dims.w - this.clipper.w;
            maxY = dims.h - this.clipper.h;

            cursor = {
                x: Math.max(e.pageX - this.offset.left, 0),
                y: Math.max(e.pageY - this.offset.top, 0)
            };

            scale = {
                x: maxX / this.clipper.w,
                y: maxY / this.clipper.h
            };

            return {
                x: Math.max(-cursor.x * scale.x, -maxX),
                y: Math.max(-cursor.y * scale.y, -maxY)
            };

        },

        showImage: function (index) {

            var self = this;

            if (index === this.index || this.options.disabled) {
                return;
            }

            this.index = index;

            this.disable();

            $(new Image())
                .bind('load', function () {

                    var $image = $(this);

                    $image
                        .css({
                            position: 'absolute',
                            left:     0,
                            top:      0,
                            width:    self.zoomSettings[0].w,
                            height:   self.zoomSettings[0].h,
                            display:  'none'
                        })
                        .insertBefore(self.objects.blocker)
                        .fadeIn(500, function () {

                            self.objects.detailImage = $image;

                            self.objects.detailImage.siblings('img').remove();

                            self._resetImageAttributes();

                            self.enable();

                            if (self.options.onImageUpdate && typeof self.options.onImageUpdate === 'function') {
                                self.options.onImageUpdate(self.images[index], index);
                            }
                        })
                        ;

                })
                .attr('src', this.images[index].detail)
                ;

            return;
        },

        _resetImageAttributes: function () {

            this.zoomLevel = 0;

            this.objects.zoomImage = null;

            return;
        },

        showZoomImage: function () {

            if (this.objects.zoomImage) {
                this.objects.zoomImage
                    .animate({
                        opacity: 1.00
                    }, {
                        duration: 200,
                        queue:    false
                    })
                    ;
            }

            return;
        },

        hideZoomImage: function () {

            if (this.objects.zoomImage) {
                this.objects.zoomImage
                    .animate({
                        opacity: 0.00
                    }, {
                        duration: 200,
                        queue:    false
                    })
                    ;
            }

            return;
        }

    });

})(jQuery);