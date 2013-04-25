Javascript class framework for Rhino
=========

Allows you to create create class hierarchies (and primitive form of interfaces).

Will behave correctly in a CommonJS environment require('rhino-class') or just standalone load('rhino-class.js').

Basic example:

    var Cat = Class({
      meow: function() {
        print("mrow");
      }
    });

    var cat = new Cat();
    cat.meow();

Allows initialize function:

    var Person = Class({
      initialize: function Person() {
        this.name = 'John Smith';
      },
      speak: function() {
        print('My name is ' + this.name);
      }
    });

Also allows mixins (ruby-ish):

    var Age = {
      age: function() {
        if (this.name) {
          console.log("I am",this.name,"and have an unknown age");
        } else {
          console.log("I have an unknown age");
        }
      }
    };

    var Speech = {

      speak: function(postfix) {
        console.log("my name is",this.name,postfix);
      }
    };

    var Animal = Class({
      includes: [Age,Speech]      
    });

And setters/getters for properties (in this case in a mixin, but could be in the class definition):

    var Weighted = {
        
      get weight() {
        return this._weight;
      },
    
      set weight(val) {
        this._weight = val;
      }  
    
    };

New classes can be extensions of old ones:

    var Mouse = Animal.extend({
      includes: Weighted,
      squeak: function() {
        print("eeek!");
      }
    });
