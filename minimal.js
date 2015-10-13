function XString(base) {
	var glyph = XRegExp('\\s|\\p{L}[\\p{Lm}\\p{M}\\p{No}\\p{Sk}]*','g');
	var t = []; // t for tokens
	XRegExp.forEach( base, glyph, function (match, i) {
		t.push( match[0] );
	});
	this.t = t;

	this.at = function(i) {
		return this.t[i];
	};
	
	this.length = function() {
		return this.t.length;
	};
	
	this.isIdentical = function( otherWord ) {
		if( this.t.length != otherWord.t.length ) {
			return false;
		}
		for(var i=0; i<this.t.length; i++ ) {
			if( this.t[i] != otherWord.t[i] ) {
				return false;
			}
		}
		return true;
	};
	
	this.toString = function() {
		var string = "";
		for(var i=0; i<this.t.length; i++ ) {
			string += this.t[i];
		}
		return string;
	};
	
	this.indexOf = function(substring, from) { // substring is an XString
		from = typeof from !== 'undefined' ? from : 0;
		for(var i=from; i<this.t.length; i++ ) {
			if( this.at(i) == substring.toString() ) { 
				return i;
			}
		}
		return -1;
	};
	
	this.matchEndOfWord = function( beforeX, notX ) { // these arguments are strings
		if( this.at( this.t.length - 1 ) != notX && this.at( this.t.length - 2 ) == beforeX ) {
			return 0;
		}
		for(var i=this.t.length-2; i>=0; i-- ) {
			if( this.at(i+1).match(/\s/g) && this.at(i) != notX && this.at(i-1) == beforeX ) { 
				return i;
			}
		}
		return -1;
	};
	
	this.matchBeginningOfWord = function( notX, afterX ) { // these arguments are strings
		if( this.at(0) != notX && this.at(1) == afterX ) {
			return 0;
		}
		for(var i=1; i<this.t.length-1; i++ ) {
			if( this.at(i-1).match(/\s/g) && this.at(i) != notX && this.at(i+1) == afterX ) { 
				return i;
			}
		}
		return -1;
	};
	
	this.matchTriplet = function( beforeX, notX, afterX ) { // these arguments are strings
		for(var i=1; i<this.t.length-1; i++ ) {
			if( this.at(i-1) == beforeX && this.at(i) != notX && this.at(i+1) == afterX ) { 
				return i;
			}
		}
		return -1;
	};
	
	this.isInitial = function(i) {
		if( i == 0 ) { return true; }
		if( this.at(i-1).match(/\s/g) ) {
			return true;
		}
		return false;
	}
	
	this.isFinal = function(i) {
		if( i == this.t.length - 1 ) { return true; }
		if( this.at(i+1).match(/\s/g) ) {
			return true;
		}
		return false;
	}
}

function Word(form,meaning) {
	this.form = new XString(form);
	var nonword = new XRegExp("[^\\w\\s]+", "g");
	this.meaning = meaning;
	this.isMinimal = function(otherWord) {
		if( this.form.isIdentical( otherWord.form ) ) {
			return false;
		}
		if( otherWord.form.length() != this.form.length() ) {
			return false;
		}
		var difference = Array();
		var diffs = 0;
		for(var i=0; i<this.form.length(); i++) {
			if( this.form.at(i) != otherWord.form.at(i) ) {
				difference[0] = this.form.at(i);
				difference[1] = otherWord.form.at(i);  
				if( i === 0 ) {
					difference[2] = "Initial";
				} else if ( i == this.form.length()-1 ) {
					difference[2] = "Final";
				} else {
					difference[2] = "Medial";
				}
				diffs++;
			}
			if( diffs > 1 ) {
				return false;
			}
		}
		return difference;
	};
	
	this.isAnalogous = function(otherWord, foci) {
		if( this.form.isIdentical( otherWord.form ) ) {
			return false;
		}
		var thisthis = this;
		var form = this.form;
		// for each focus
		for(var i=0; i<foci.length; i++) {
			var f = new XString( foci[i] );
			var firstFocus = thisthis.checkForAnalogousMatch( form, otherWord.form, f );
			if( firstFocus !== false ) {
				return firstFocus;
			}
			var secondFocus = thisthis.checkForAnalogousMatch( otherWord.form, form, f );
			if( secondFocus !== false ) {
				return secondFocus;
			}
		}
		return false;
	};
	
	this.checkForAnalogousMatch = function( first, second, f ) { // these parameters are all XStrings
		// find the focus in this word
		var indices = indicesOf( first, f);
		for(var i=0; i<indices.length; i++) {
			index = indices[i];
			if( first.isInitial(index) ) { // TODO if it's preceded by a space
				match = second.matchBeginningOfWord( first.at(index), first.at(index+1) );
				if( match !== -1 ) {
					return [f, new XString(second.at(match)), "Initial" ];
				}
			} else if ( first.isFinal(index) ) {
				match = second.matchEndOfWord( first.at(first.length()-2), first.at(first.length()-1) );
				if( match != -1 ) {
					return [f, new XString(second.at(match)), "Final" ];
				}
			} else { // middle of string
				match = second.matchTriplet( first.at(index-1), first.at(index), first.at(index+1) );
				if( match != -1 ) {
					return [f, new XString(second.at(match)), "Medial" ];
				}
			}
		}
		return false;
	};
}

function indicesOf( xstring, substring ) {
	var result = Array();
	var position = 0;
	// cycle through indices
	while( xstring.indexOf( substring, position) != -1 ) {
		result.push( xstring.indexOf( substring, position) );
		position = xstring.indexOf( substring, position) + 1;
	}
	return result;
}

function getWords() { 
	var words = Array();
	var plainText = document.getElementById("words").value;
	var lines = plainText.trim().split(/[\n\r]/);
	for(var i=0; i<lines.length; i++) {
		var elements = lines[i].trim().split(/\t+/);
		if( elements.length == 2 ) {
			words.push( new Word( elements[0], elements[1] ) );
		} else if ( elements.length == 1 ) {
			words.push( new Word( elements[0], "" ) );
		}
	}
	return words;
}

function addResultRow( first, second, difference, type ) {
	var tbody = $("table#output > tbody")[0];
	var row = tbody.insertRow(-1);
	row.insertCell(-1).innerHTML = difference[0].toString();
	row.insertCell(-1).innerHTML = difference[1].toString();
	row.insertCell(-1).innerHTML = "[" + first.form.toString() + "]";
	if( first.meaning.length > 0 ) {
		row.insertCell(-1).innerHTML = "“" + first.meaning + "”";
	} else {
		row.insertCell(-1);
	}
	row.insertCell(-1).innerHTML = "[" + second.form.toString() + "]";
	if( second.meaning.length > 0 ) {
		row.insertCell(-1).innerHTML = "“" + second.meaning + "”";
	} else {
		row.insertCell(-1);
	}
	row.insertCell(-1).innerHTML = difference[2];
	row.insertCell(-1).innerHTML = type;
}

function find() {
	$('table#output > tbody > tr').remove();
	var foci = Array();
	var bothfoci = $("#foci-both").attr('checked');
	if( $("#foci").val().trim().length > 0 ) {
		foci = $("#foci").val().split(/\s+/);
	}
	var words = getWords();
	for( var i=0; i<words.length; i++ ) {
		for( var j=i+1; j<words.length; j++ ) {
			if( document.getElementById("cae").checked ) {
				difference = words[i].isAnalogous( words[j], foci );
				if( difference !== false ) {
					if( ( bothfoci === false &&  (foci.length === 0 || foci.indexOf( difference[0].toString() ) != -1 || foci.indexOf( difference[1].toString() ) != -1 ) ) || 
						( bothfoci === true &&  (foci.length === 0 || ( foci.indexOf( difference[0].toString() ) != -1 && foci.indexOf( difference[1].toString() ) != -1 ) ) ) ) {
						addResultRow( words[i], words[j], difference, "CAE" );
						addResultRow( words[j], words[i], Array( difference[1], difference[0], difference[2] ), "CAE" );
					}
				}
			}
			difference = words[i].isMinimal( words[j] );
			if( difference !== false ) {
				if( ( bothfoci === false &&  (foci.length === 0 || foci.indexOf( difference[0].toString() ) != -1 || foci.indexOf( difference[1].toString() ) != -1 ) ) || 
					( bothfoci === true &&  (foci.length === 0 || ( foci.indexOf( difference[0].toString() ) != -1 && foci.indexOf( difference[1].toString() ) != -1 ) ) ) ) {
					addResultRow( words[i], words[j], difference, "CIE" );
					addResultRow( words[j], words[i], Array( difference[1], difference[0], difference[2] ), "CIE" );
				}
			}
		}
	}
	$('#output-panel').show(0);
	$("table").trigger("update");
}

function tableToCsv() {
	var code = "";
	$('table#output').find('tr').each(function() {
		$(this).find("td,th").each(function() {
			code += "\"" + $(this).text().replace("\"","\\\"") + "\",";
		});
		code += "\r\n";
	});
	return code;
}

// http://stackoverflow.com/a/18197341/1447002
function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

$(document).ready(function() {
	$("#output").tablesorter();
	
	$("#cae").change(function() {
		if( $("#foci").val().length === 0 ) {
			$(this).attr('checked',false);
			$("#cae-warning").show();
		}
	});
	
	$("#foci").change(function() {
		if( $("#foci").val().length > 0 ) {
			$("#cae-warning").hide();
		}
	});	

	$( "#download-button" )
		.click(function() {
			download( 'minimal.csv' , tableToCsv() );
		});

});
	