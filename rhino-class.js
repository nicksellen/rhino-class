var copyMethods = function(source,target,superclass,excludes) {
	var name, setter, getter, item, type;
	
	excludes = ensureArray(excludes);
	
	for (name in source) {
		if (contains(excludes,name)) continue;
		getter = source.__lookupGetter__(name);
		setter = source.__lookupSetter__(name);
		item = source[name];
		type = typeof item;
		
		if (getter || setter) {
			if (getter) {
				target.__defineGetter__(name,getter);
			}
			if (setter) {
				target.__defineSetter__(name,setter);
			}
		} else if (type === 'function'){
			
			if (superclass && superclass.prototype[name]) {
				
				// defining a this.base() function to call the superclass method
				// TODO: if it's not available define a this.base() that throws an error saying so
			
				target[name] = function() {
					var _args = arguments;
					var previous = this.base;
					
					this.base = function() { 
						
						// if they call base() without arguments then pass through the arguments anyway
						// the downside is that if they actually wanted to call base() without any arguments it would be like base.call(this)
						
						var args = arguments.length === 0 ? _args : arguments;
						return superclass.prototype[name].apply(this,args); 
					}
					var result = item.apply(this,arguments);
					this.base = previous;
					return result;
				}
			
			} else {
				target[name] = item;
			}
			
		} else {
			target[name] = item;	
		}
	}
}

var ensureArray = function(val) {
	if (!val) val = [];	
	if (val.constructor !== Array) val = [val];
	return val;
}

var contains = function(array,item) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] === item) {
			return true;
		}
	}
	return false;
};

var DefaultInitialize = function(){};

function Class(methods,superclass) {
	
	var	constructor,
		initialize 	= methods.initialize || DefaultInitialize, 
		includes 	= methods.includes || [],
		implements	= methods.implements || [];
	
	if (initialize !== DefaultInitialize && initialize.name === "") {
		throw new Error("Please name your initialize function, e.g. Class({ initialize: function SomeName() { ... } })");
	}
	
	delete methods.initialize;
	delete methods.includes;
	delete methods.implements;
	
	constructor = function() {
		
		if (this.constructor !== constructor) {
			var exampleClass = initialize.name || 'MyClass';
			throw new Error("please create objects using the new keyword, " + 
				"e.g. 'var thing = new " + exampleClass + "()' not " + 
				"'var thing = " + exampleClass + "()'");
		}
		
		this.className = initialize.name;
		initialize.apply(this,arguments);
	}
	
	// add the superclass to the prototype chain
	if (superclass) constructor.prototype.__proto__ = superclass.prototype;
	
	constructor.className = initialize.name;
	constructor.constructor = Class;
	
	constructor.includes = function() {
		var i = 0, source;
		for (; i < arguments.length; i++) {
			source = arguments[i];
			if (typeof source === "function") {
				source = source.prototype;
			}
			copyMethods(source,constructor.prototype,null,'initialize');
		}
		return this;
	};
	
	includes = ensureArray(includes);
	
	constructor.includes.apply(constructor,includes);
	
	copyMethods(methods,constructor.prototype,superclass);
	
	constructor.extend = function(methods) {
		if (!methods) methods = {};
		if (!methods.initialize) methods.initialize = initialize;
		methods.includes = ensureArray(methods.includes);
		return Class(methods,constructor);
	};
	
	implements = ensureArray(implements);
	
	for (i = 0; i < implements.length; i++) {
		implements[i].validate(constructor.prototype,constructor.className);
	}
	
	return constructor;
}

function Interface(spec) {
	if (this.constructor === Interface) {
		this.spec = spec;
	} else {
		return new Interface(spec);
	}
}

Interface.UNDEFINED = 'undefined';
Interface.PROPERTY 	= 'property';
Interface.METHOD 	= 'method';
Interface.GETTER 	= 'getter';
Interface.SETTER 	= 'setter';
Interface.ACCESSOR 	= 'accessor';

Interface.prototype.validate = function(obj,objName) {
	var expected, actual, name, type, getter, setter;
	
	if (!objName) objName = obj.className || obj.name || obj;
	
	for (name in this.spec) {
		
		expected = this.spec[name];
		
		type = typeof obj[name];
		
		getter = obj.__lookupGetter__(name);
		setter = obj.__lookupSetter__(name);
		
		if (getter && setter) {
			if (expected === Interface.GETTER || expected === Interface.SETTER) {
				// the interfaces specifies either setter or getter but we have both, thats just dandy, let them have their cake
				actual = expected; 
			} else {
				actual = Interface.ACCESSOR;	
			}
		} else if (getter) {
			actual = Interface.GETTER;
		} else if (setter) {
			actual = Interface.SETTER;
		} else if (type === 'function') {
			actual = Interface.METHOD;
		} else if (type !== 'undefined'){
			actual = Interface.PROPERTY;
		} else {
			actual = Interface.UNDEFINED;
		}
		
		if (actual !== expected) {
			var actualStr = actual === Interface.UNDEFINED ? '' : ' not ' + actual;
			throw new Error("Interface requires that " + objName + " must define '" + name + "' as a " + expected + actualStr);
		}
		
	}
	
}

Class.Interface = Interface;

if (typeof exports !== 'undefined') {
	module.exports = exports = Class;
}