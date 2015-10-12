function Word(form,meaning) {
	this.form = form;
	var nonword = new XRegExp("\\P{L}+", "g")
	this.form =  XRegExp.replace(this.form, nonword, '', 'all');
	this.meaning = meaning;
	this.isMinimal = function(otherWord) {
		if( this.form == otherWord.form ) {
			return false;
		}
		var difference = Array();
		if( otherWord.form.length != this.form.length ) {
			return false;
		}
		var diffs = 0;
		for(var i=0; i<this.form.length; i++) {
			if( this.form[i] != otherWord.form[i] ) {
				difference[0] = this.form[i];
				difference[1] = otherWord.form[i];  
				if( i === 0 ) {
					difference[2] = "Initial";
				} else if ( i == this.form.length-1 ) {
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
		if( this.form == otherWord.form ) {
			return false;
		}
		var thisthis = this;
		var form = this.form;
		// for each focus
		for(var i=0; i<foci.length; i++) {
			var f = foci[i];
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
	
	this.checkForAnalogousMatch = function( first, second, f ) {
		// find the focus in this word
		var indices = indicesOf( first, f);
		for(var i=0; i<indices.length; i++) {
			index = indices[i];
			var notf = '[^' + first[index] + ']';
			if( index === 0 ) {
				match = second.search( new RegExp( '^' + notf + first[1] ,'g') );
				if( match != -1 ) {
					return [f, second[0], "Initial" ];
				}
			} else if ( index == first.length - 1 ) {
				match = second.search( new RegExp( first[first.length-2] + notf + '$' ,'g') );
				if( match != -1 ) {
					return [f, second[second.length-1], "Final" ];
				}
			} else { // middle of string
				var regexp = new RegExp( first[index-1] + notf + first[index+1] ,'g');
				match = second.search(regexp);
				if( match != -1 ) {
					return [f, second[match+1], "Medial" ];
				}
			}
		}
		return false;
	};
}

function indicesOf( str, substring ) {
	var result = Array();
	var position = 0;
	// cycle through in
	while( str.indexOf( substring, position) != -1 ) {
		result.push( str.indexOf( substring, position) );
		position = str.indexOf( substring, position) + 1;
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
	row.insertCell(-1).innerHTML = difference[0];
	row.insertCell(-1).innerHTML = difference[1];
	row.insertCell(-1).innerHTML = "[" + first.form + "]";
	if( first.meaning.length > 0 ) {
		row.insertCell(-1).innerHTML = "“" + first.meaning + "”";
	} else {
		row.insertCell(-1);
	}
	row.insertCell(-1).innerHTML = "[" + second.form + "]";
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
	if( $("#foci").val().trim().length > 0 ) {
		foci = $("#foci").val().split(/\s+/);
	}
	var words = getWords();
	for( var i=0; i<words.length; i++ ) {
		for( var j=i+1; j<words.length; j++ ) {
			if( document.getElementById("cae").checked ) {
				difference = words[i].isAnalogous( words[j], foci );
				if( difference !== false ) {
					addResultRow( words[i], words[j], difference, "CAE" );
					addResultRow( words[j], words[i], Array( difference[1], difference[0], difference[2] ), "CAE" );
				}
			}
			difference = words[i].isMinimal( words[j] );
			if( difference !== false ) {
				if( foci.length === 0 || foci.indexOf( difference[0] ) != -1 || foci.indexOf( difference[1] ) != -1 ) {
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
	