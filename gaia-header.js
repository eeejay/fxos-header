(function(define){'use strict';define(function(require,exports,module){
/*jshint esnext:true*/
/*jshint node:true*/
/*globals define*/

/**
 * Dependencies
 */

var loadGaiaIcons = require('gaia-icons');
var fontFit = require('./lib/font-fit');

/**
 * Locals
 */

var baseComponents = window.COMPONENTS_BASE_URL || 'bower_components/';
var base = window.GAIA_HEADER_BASE_URL || baseComponents + 'gaia-header/';

/**
 * Element prototype, extends from HTMLElement
 *
 * @type {Object}
 */
var proto = Object.create(HTMLElement.prototype);

/**
 * Supported action types
 *
 * @type {Object}
 */
var actionTypes = {
  menu: true,
  back: true,
  close: true,
};

/**
 * Called when the element is first created.
 *
 * Here we create the shadow-root and
 * inject our template into it.
 *
 * @private
 */
proto.createdCallback = function() {
  var shadow = this.createShadowRoot();
  var tmpl = template.content.cloneNode(true);

  // Get els
  this.els = {
    actionButton: tmpl.querySelector('.action-button'),
    headings: this.querySelectorAll('h1,h2,h3,h4'),
    inner: tmpl.querySelector('.inner')
  };

  this.els.actionButton.addEventListener('click',
    proto.onActionButtonClick.bind(this));

  this.configureActionButton();
  this.setupInteractionListeners();
  shadow.appendChild(tmpl);
  this.styleHack();
  this.runFontFit();
};

proto.styleHack = function() {
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  this.classList.add('-content', '-host');
  style.setAttribute('scoped', '');
  this.appendChild(style);
};

proto.attachedCallback = function() {
  this.shadowStyleHack();
  this.rerunFontFit();
};

/**
 * Workaround for bug 1056783.
 *
 * Fixes shadow-dom stylesheets not applying
 * when shadow host node is detached on
 * shadow-root creation.
 *
 * @private
 */
proto.shadowStyleHack = function() {
  var style = this.shadowRoot.querySelector('style');
  this.shadowRoot.removeChild(style);
  this.shadowRoot.appendChild(style);
};

/**
 * Rerun font-fit logic.
 *
 * TODO: We really need an official API for this.
 *
 * @private
 */
proto.rerunFontFit = function() {
  for (var i = 0; i < this.els.headings.length; i++) {
    this.els.headings[i].textContent = this.els.headings[i].textContent;
  }
};

proto.runFontFit = function() {
  for (var i = 0; i < this.els.headings.length; i++) {
    fontFit.reformatHeading(this.els.headings[i]);
    fontFit.observeHeadingChanges(this.els.headings[i]);
  }
};

/**
 * Called when one of the attributes
 * on the element changes.
 *
 * @private
 */
proto.attributeChangedCallback = function(attr, oldVal, newVal) {
  if (attr === 'action') {
    this.configureActionButton();
    fontFit.reformatHeading(this._heading);
  }
};

/**
 * Triggers the 'action' button
 * (used in testing).
 *
 * @public
 */
proto.triggerAction = function() {
  if (this.isSupportedAction(this.getAttribute('action'))) {
    this.els.actionButton.click();
  }
};

/**
 * Configure the action button based
 * on the value of the `data-action`
 * attribute.
 *
 * @private
 */
proto.configureActionButton = function() {
  var old = this.els.actionButton.getAttribute('icon');
  var type = this.getAttribute('action');
  var supported = this.isSupportedAction(type);
  this.els.actionButton.classList.remove('icon-' + old);
  this.els.actionButton.setAttribute('icon', type);
  this.els.inner.classList.toggle('supported-action', supported);
  if (supported) { this.els.actionButton.classList.add('icon-' + type); }
};

/**
 * Validate action against supported list.
 *
 * @private
 */
proto.isSupportedAction = function(action) {
  return action && actionTypes[action];
};

/**
 * Handle clicks on the action button.
 *
 * Fired async to allow the 'click' event
 * to finish its event path before
 * dispatching the 'action' event.
 *
 * @param  {Event} e
 * @private
 */
proto.onActionButtonClick = function(e) {
  var config = { detail: { type: this.getAttribute('action') } };
  var actionEvent = new CustomEvent('action', config);
  setTimeout(this.dispatchEvent.bind(this, actionEvent));
};

/**
 * Adds helper classes to allow us to style
 * specifically when a touch interaction is
 * taking place.
 *
 * We use this specifically to apply a
 * transition-delay when the user releases
 * their finger from a button so that they
 * can momentarily see the :active state,
 * reinforcing the UI has responded to
 * their touch.
 *
 * We bind to mouse events to facilitate
 * desktop usage.
 *
 * @private
 */
proto.setupInteractionListeners = function() {
  stickyActive(this.els.inner);
};

// HACK: Create a <template> in memory at runtime.
// When the custom-element is created we clone
// this template and inject into the shadow-root.
// Prior to this we would have had to copy/paste
// the template into the <head> of every app that
// wanted to use <gaia-header>, this would make
// markup changes complicated, and could lead to
// things getting out of sync. This is a short-term
// hack until we can import entire custom-elements
// using HTML Imports (bug 877072).

var template = document.createElement('template');
template.innerHTML = `
<style>

gaia-header {
  display: block;

  --gaia-header-button-color:
    var(--header-button-color,
    var(--header-color,
    var(--link-color,
    inherit)));
}

/**
 * [hidden]
 */

gaia-header[hidden] {
  display: none;
}

/** Reset
 ---------------------------------------------------------*/

::-moz-focus-inner { border: 0; }

/** Inner
 ---------------------------------------------------------*/

.inner {
  display: flex;
  min-height: 50px;

  background:
    var(--header-background,
    var(--background,
    #fff));
}

/** Action Button
 ---------------------------------------------------------*/

/**
 * 1. Hidden by default
 */

.action-button {
  display: none; /* 1 */
  position: relative;
  align-items: center;
  width: 50px;
  font-size: 30px;
  border: none;

  color:
    var(--header-action-button-color,
    var(--header-icon-color,
    var(--gaia-header-button-color)));
}

/**
 * .action-supported
 *
 * 1. For icon vertical-alignment
 */

.supported-action .action-button {
  display: flex; /* 1 */
}

/** Action Button Icon
 ---------------------------------------------------------*/

/**
 * 1. To enable vertical alignment.
 */

.action-button:before {
  display: block;
}

/** Action Button Text
 ---------------------------------------------------------*/

/**
 * To provide custom localized content for
 * the action-button, we allow the user
 * to provide an element with the class
 * .l10n-action. This node is then
 * pulled inside the real action-button.
 *
 * Example:
 *
 *   <gaia-header action="back">
 *     <span class="l10n-action" aria-label="Back">Localized text</span>
 *     <h1>title</h1>
 *   </gaia-header>
 */

.-content .l10n-action {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  font-size: 0;
}

/** Title
 ---------------------------------------------------------*/

/**
 * 1. Vertically center text. We can't use flexbox
 *    here as it breaks text-overflow ellipsis
 *    without an inner div.
 */

.-content h1 {
  flex: 1;
  margin: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  text-align: center;
  line-height: 50px; /* 1 */
  font-weight: 300;
  font-style: italic;
  font-size: 24px;

  color:
    var(--header-title-color,
    var(--header-color,
    var(--title-color,
    inherit)));
}

/**
 * .flush-left
 *
 * When the fitted text is flush with the
 * edge of the left edge of the container
 * we pad it in a bit.
 */

.-content h1.flush-left {
  padding-left: 10px;
}

/**
 * .flush-right
 *
 * When the fitted text is flush with the
 * edge of the right edge of the container
 * we pad it in a bit.
 */

.-content h1.flush-right {
  padding-right: 10px; /* 1 */
}

/** Buttons
 ---------------------------------------------------------*/

a,
button,
.-content a,
.-content button {
  box-sizing: border-box;
  display: flex;
  border: none;
  width: auto;
  height: auto;
  margin: 0;
  padding: 0 10px;
  font-size: 14px;
  line-height: 1;
  min-width: 50px;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  text-align: center;
  background: none;
  border-radius: 0;
  font-style: italic;

  transition:
    var(--button-trasition);

  color:
    var(--gaia-header-button-color);
}

/**
 * .active
 *
 * Turn off transiton-delay so the
 * active state shows instantly.
 *
 * Only apply the :active state when the
 * component indicates an interaction is
 * taking place.
 */

a.active,
button.active,
.-content a.active,
.-content button.active {
  opacity: 0.2;
  transition: none;
}

/**
 * [hidden]
 */

.-content a[hidden],
.-content button[hidden] {
  display: none;
}

/**
 * [disabled]
 */

.-content a[disabled],
.-content button[disabled] {
  pointer-events: none;
  opacity: 0.5;
}

/** Icon Buttons
 ---------------------------------------------------------*/

/**
 * Icons are a different color to text
 */

.-content .icon,
.-content [data-icon] {
  color:
    var(--header-icon-color,
    var(--gaia-header-button-color));
}

/** Icons
 ---------------------------------------------------------*/

[class^="icon-"]:before,
[class*="icon-"]:before {
  font-family: 'gaia-icons';
  font-style: normal;
  text-rendering: optimizeLegibility;
  font-weight: 500;
}

.icon-back:before { content: 'back'; }
.icon-menu:before { content: 'menu'; }
.icon-close:before { content: 'close'; }

</style>

<div class="inner">
  <button class="action-button">
    <content select=".l10n-action"></content>
  </button>
  <content select="h1,h2,h3,h4,a,button"></content>
</div>`;

/**
 * Adds a '.active' helper class to the given
 * element that sticks around for the given
 * lag period.
 *
 * Usually the native :active hook is far
 * too quick for our UX needs.
 *
 * This may be needed in other components, so I've
 * made sure it's decoupled from gaia-header.
 *
 * We support mouse events so that our visual
 * demos still work correcly on desktop.
 *
 * Options:
 *
 *   - `on` {Function} active callback
 *   - `off` {Function} inactive callback
 *   - `ms` {Number} number of ms lag
 *
 * @param {Element} el
 * @param {Object} options
 * @private
 */
var stickyActive = (function() {
  var noop = function() {};
  var pointer = [
    { down: 'touchstart', up: 'touchend' },
    { down: 'mousedown', up: 'mouseup' }
  ]['ontouchstart' in window ? 0 : 1];

  function exports(el, options) {
    options = options || {};
    var on = options.on || noop;
    var off = options.off || noop;
    var lag = options.ms || 300;
    var timeout;

    el.addEventListener(pointer.down, function(e) {
      var target = e.target;
      clearTimeout(timeout);
      target.classList.add(exports.class);
      on();

      el.addEventListener(pointer.up, function fn(e) {
        el.removeEventListener(pointer.up, fn);
        timeout = setTimeout(function() {
          target.classList.remove(exports.class);
          off();
        }, lag);
      });
    });
  }

  exports.class = 'active';
  return exports;
})();

// Header depends on gaia-icons
loadGaiaIcons(baseComponents);

// Register and return the constructor
// and expose `protoype` (bug 1048339)
module.exports = document.registerElement('gaia-header', { prototype: proto });
module.exports._prototype = proto;

});})((function(n,w){'use strict';return typeof define=='function'&&define.amd?
define:typeof module=='object'?function(c){c(require,exports,module);}:
function(c){var m={exports:{}},r=function(n){return w[n];};
w[n]=c(r,m.exports,m)||m.exports;};})('gaia-header',this));
