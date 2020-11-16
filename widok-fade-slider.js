/**
 * version:	1.1
 * add new Slider
 * @param {selector} container slider container
 * @param {object} options extra options
 * @param {function} options.onChange callback function which is executed on change
 * @param {boolean} option.adjustHeight defalut = false
 * @param {selector} option.bulletContainer
 * @param {selector} option.bulletSelector
 * @param {integer} option.interval
 * @returns {Object} Slider
 * containerIn '.lb'
 * arrows '.slider-arrows' '.slider-left' '.slider-right'
 */

const $ = require('cash-dom');
const createScrollItem = require('widok-scroll-item');

const createFadeSlider = (function () {
  fadeSliders = [];
  class Slider {
    constructor(element, options) {
      this.applyCss(element);
      this.options = {
        adjustHeight: false,
      };
      Object.assign(this.options, options);
      if (this.options.interval !== undefined) {
        this.intervalHandle = setInterval(
          this.next.bind(this),
          this.options.interval
        );
      }

      this.h = 0;
      this.c = 0;
      this.id = this.element.attr('id');
      this.scrollItem = createScrollItem(this.element);
      this.refresh();

      this.slides.eq(0).addClass('current-slide');
      this.prepareArrows();
      this.prepareBullets();
    }

    applyCss(element) {
      this.element = $(element);
      this.bar = $(document.createElement('div'))
        .addClass('slider-bar')
        .css({ position: 'relative' })
        .appendTo(this.element);
      this.slides = this.element
        .find('.slider-single')
        .css({
          position: 'absolute',
          width: '100%',
        })
        .appendTo(this.bar);
    }

    prepareArrows() {
      this.arrows = this.element.data('arrows');
      if (this.arrows === undefined) {
        this.arrows = this.element.find('.slider-arrows');
      } else {
        this.arrows = $(this.arrows);
      }
      if (this.arrows.length > 0) {
        this.left = this.arrows.find('.slider-left');
        this.right = this.arrows.find('.slider-right');
        this.left.click(() => {
          if (this.options.interval) {
            clearInterval(this.intervalHandle);
          }
          this.prev();
        });
        this.right.click(() => {
          if (this.options.interval) {
            clearInterval(this.intervalHandle);
          }
          this.next();
        });
      }
    }

    prepareBullets() {
      this.bullets = [];
      if (this.options.bulletContainer === undefined) {
        this.options.bulletContainer = $(document.createElement('div'))
          .addClass('slider-bullets')
          .appendTo(this.element);
        this.bullets = [];
        this.slides.map((index, slide) => {
          this.bullets.push(
            $(document.createElement('div'))
              .addClass('slider-bullet')
              .appendTo(this.options.bulletContainer)
          );
        });
      } else {
        this.options.bulletContainer = $(this.options.bulletContainer);
        if (this.options.bulletSelector === undefined) {
          this.slides.map((index, slide) => {
            this.bullets.push(
              $(document.createElement('div'))
                .addClass('slider-bullet')
                .appendTo(this.options.bulletContainer)
            );
          });
        } else {
          this.options.bulletContainer
            .find(this.options.bulletSelector)
            .each((index, element) => {
              this.bullets.push($(element));
            });
        }
      }

      if (this.bullets.length > 0) {
        this.bullets.map((bullet, index) => {
          bullet.on('click', () => {
            this.goTo(index);
            if (this.options.interval) {
              clearInterval(this.intervalHandle);
            }
          });
        });
      }
      if (this.bullets.length <= 1) {
        this.options.bulletContainer.hide(0);
      } else {
        this.bullets[0].addClass('active');
      }
    }

    refresh() {
      if (this.options.adjustHeight) {
        this.bar.css({ height: 0 });
        let h = 0;
        this.slides.each((index, element) => {
          h = Math.max($(element).height(), h);
        });
        this.h = h;
        this.setHeight();
      }
      this.scrollItem._onResize();
    }

    setHeight() {
      this.bar.css({ height: this.h });
    }

    goTo(n) {
      if (this.c !== n) {
        const previous = this.c;
        this.slides.filter('.current-slide').removeClass('current-slide');
        this.slides.eq(n).addClass('current-slide');
        this.bullets[previous].removeClass('active');
        this.bullets[n].addClass('active');
        if (this.options.onChange !== undefined) {
          this.options.onChange.call(this, n);
        }
        this.c = n;
        window.dispatchEvent(
          new CustomEvent('fadeSliderChange', {
            detail: { slider: this, prev: previous },
          })
        );
      }
    }

    onLoad() {
      window.dispatchEvent(
        new CustomEvent('fadeSliderChange', {
          detail: { slider: this, prev: -1 },
        })
      );
    }

    next() {
      this.goTo((this.c + 1) % this.slides.length);
    }

    prev() {
      let target = this.c - 1;
      if (target < 0) target = this.slides.length - 1;
      this.goTo(target);
    }
  }

  function refresh() {
    for (const slider in fadeSliders) {
      fadeSliders[slider].refresh();
    }
  }

  function load() {
    for (const slider in fadeSliders) {
      fadeSliders[slider].onLoad();
    }
  }

  $(window).on('load', load);
  window.addEventListener('layoutChange', refresh);
  window.addEventListener('keydown', event => {
    if (event.which !== 39 && event.which !== 37) return;
    if (fadeSliders.length === 0) return;
    let closest;
    let closestDiff = Infinity;
    for (const slider of fadeSliders) {
      const diff = Math.abs(slider.scrollItem.screenPos(0.5) - 0.5);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = slider;
      } else {
        break;
      }
    }
    if (event.which === 39) {
      closest.next();
    } else if (event.which === 37) {
      closest.prev();
    }
  });

  return function (container, options) {
    if (options === undefined) options = {};
    const fadeSliders = [];
    $(container).each((index, element) => {
      const slider = new Slider(element, options);
      if (slider.id === undefined || fadeSliders[slider.id] !== undefined) {
        slider.id = index;
      }
      fadeSliders[slider.id] = slider;
    });
    return fadeSliders;
  };
})();

if (typeof module !== 'undefined') module.exports = createFadeSlider;
