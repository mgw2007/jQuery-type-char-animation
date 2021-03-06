/*
 *  jQuery Type Char Animation - v2.0.x
 *
 *  Copyright (c) 2012, 2014 Deux Huit Huit (https://www.deuxhuithuit.com/)
 *  Licensed under the MIT License (http://deuxhuithuit.mit-license.org)
 */

(function ($, undefined) {

	'use strict';
	
	var KEYDOWN = 'keydown.typeCharAnimation';

	var getCharTime = function (char, tPos) {
		return ((~~(Math.random() * 10000)) % 30) + 50;
	};
	
	var getSpaceTime = function (char, tPos) {
		return 150;
	};

	var isWhiteSpace = function (char, tPos) {
		return !char || /\s/.test(char);
	};
	
	var typeCharAnimation = function (options, args) {
		var t = $(this);
		
		return t.each(function () {
			var t = $(this);
			// ensure options
			var o = $.type(options) === 'string' ?
						options :
						$.extend({}, $.typeCharAnimation.defaults, options);
			
			// start animation
			startTypeChar(t, o, args);
		});
	};
	
	var keydown = function (e) {
		e.preventDefault();
		return false;
	};
	
	var normalStrategy = {
		initialPosition: function (dT) {
			return 0;
		},
		increment: 1,
		char: function (dT, tPos) {
			return dT[tPos];
		},
		newValue: function (dT, tPos, value) {
			return value + dT[tPos];
		},
		isOver: function (dT, tPos) {
			return tPos === dT.length;
		}
	};
	
	var reverseStrategy = {
		initialPosition: function (dT) {
			return dT.length;
		},
		increment: -1,
		char: function (dT, tPos) {
			return dT[tPos];
		},
		newValue: function (dT, tPos, value) {
			return value.substring(0, value.length - 1);
		},
		isOver: function (dT, tPos) {
			return tPos === 0;
		}
	};
	
	var processMatrix = function (value, tPos, options) {
		if (!!options.matrixEffect) {
			value = value.split('');
			var end = Math.min(options.matrixEffect, value.length);
			var r, c, x = end, p = value.length - 1;
			while (x > 0 && p >= 0) {
				if (!options.isWhiteSpace(value[p])) {
					r = (~~(Math.random() * 10000)) % options.matrixValues.length;
					c = options.matrixValues[r];
					value[p] = c;
					x--;
				}
				p--;
			}
			value = value.join('');
		}
		return value;
	};
	
	var startTypeChar = function (t, options, args) {
		var txtBox = $(t);
		var data = txtBox.data();
		var setValue = (function (valueFx) {
			return function _valueFx(value) {
				return valueFx.call(txtBox, value);
			};
		})(txtBox[txtBox.is('input, textarea') ? 'val' : 'text']);
		
		// clear any existing timeouts
		if (!!data.typeCharAnimation) {
			clearTimeout(data.typeCharAnimation._timeout);
		}
		
		// check commands
		if ($.type(options) === 'string') {
			var cmd = options;
			options = data.typeCharAnimation;
			if (!!options) {
				if (cmd === 'stop') {
					if (!!args && args.end) {
						setValue((options.initialText || '') + options.text);
					}
				}
			}
			return;
		}
		
		// save options
		data.typeCharAnimation = options;
		
		// initial state
		var dT = options.text.split('');
		var strategy = !options.reverse ? normalStrategy : reverseStrategy;
		var tPos = strategy.initialPosition(dT);
		var pass = 0;
		var initialText = options.initialText || '';
		
		if (!!options.reverse) {
			initialText += options.text;
		}
		
		var currentValue = initialText;
		
		var endLoop = function () {
			if (options.matrixEffect > 0 && !!currentValue) {
				options.matrixEffect--;
				// process the matrix with the new effects
				var v = processMatrix(currentValue, tPos, options);
				setValue(v);
				end();
			} else {
				// clean up
				txtBox.off(KEYDOWN, keydown);
				
				// set end value
				setValue(currentValue);
				
				// call complete callback
				if ($.isFunction(options.complete)) {
					options.complete.call(t);
				}
			}
		};
		var end = function () {
			data.typeCharAnimation._timeout = setTimeout(endLoop,
				options.charTime(currentValue.substring(currentValue.length-1), tPos)
			);
		};
		
		var typeChar = function () {
			// get current char
			var char = strategy.char(dT, tPos);
			
			var newValue = strategy.newValue(dT, tPos, currentValue);
			
			// is this a whitespace ?
			var whiteSpace = options.isWhiteSpace(char, tPos);
			
			// matrix!
			var stepValue = processMatrix(newValue, tPos, options);
			
			// set new value
			setValue(stepValue);
			
			// increment pass count
			pass++;
			
			// if number of passes is reached
			if (pass >= options.passes) {
				pass = 0;
				// increment pointer
				tPos += strategy.increment;
				// cache the new current value
				currentValue = newValue;
			}
			
			// call step
			if ($.isFunction(options.step)) {
				options.step.call(t, char, tPos);
			}
			
			// focus the element
			if (options.focus) {
				txtBox.focus();
			}
			
			// If the animation is not complete
			if (!strategy.isOver(dT, tPos)) {
				// loop!
				data.typeCharAnimation._timeout = setTimeout(typeChar,
					whiteSpace ?
					options.spaceTime(char, tPos) :
					options.charTime(char, tPos)
				);
				
			} else {
				
				// end the animation
				end();
			}
		};
		
		// set initial text
		if (!!initialText) {
			setValue(initialText);
		}
		
		// block user input
		if (!!options.blockUserInput) {
			txtBox.on(KEYDOWN, keydown);
		}
		
		// focus
		if (options.focus) {
			txtBox.focus();
		}
		
		// type first char
		setTimeout(typeChar, options.initialDelay);
	};
	
	
	// ACTUAL PLUGIN
	$.fn.extend({
		typeCharAnimation: typeCharAnimation
	});
	
	// defaults
	$.typeCharAnimation = {
		defaults: {
			// private
			_timeout: 0,
			// public
			initialText: null, // string
			initialDelay: 0,
			text: null, // string
			step: null, // function (char, tPos)
			complete: null, // function ()
			blockUserInput: false,
			focus: true,
			reverse: false,
			matrixEffect: 0,
			passes: 1,
			matrixValues: 'abcdefghijklmnopqrstuvwxyz'.split(''),
			charTime: getCharTime, // function (char, tPos)
			spaceTime: getSpaceTime, // function (char, tPos)
			isWhiteSpace: isWhiteSpace // function (char, tPos)
		}
	};
	
})(jQuery);