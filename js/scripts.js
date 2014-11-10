var quizApp = {};
quizApp.key = '9314b8803e6b1e173d0c8a52303b82ce';
quizApp.name = '';
quizApp.credits = [];
quizApp.moviesLeft = 0;
quizApp.players = [];
quizApp.activePlayer = 0;
quizApp.totalPlayers = 3;
quizApp.playersLeft = 3;
quizApp.lives = 1;
quizApp.playerEliminated = false;
quizApp.keepPlaying = true;

quizApp.init = function() {
	// cache jQuery selectors
	quizApp.$setup = $('#setup');
	quizApp.$answers = $('#answers');
	quizApp.$nameInput = $('#name-input');
	quizApp.$random = $('#random-name');
	quizApp.$setup = $('div#setup');
	quizApp.$play = $('div#play');
	quizApp.$reset = $('#reset');
	quizApp.$movieInput = $('#movie-input');
	quizApp.$guessMovie = $('#guess-movie');
	quizApp.$numPlayers = $('#players');
	quizApp.$playerField = $('#setup').find('p.player-number');
	quizApp.$lives = $('#lives');
	quizApp.$passTurn = $('#pass-turn');
	quizApp.$displayTurn = $('#display-turn');
	//prevent page reloads on buttonclicks
	$('button').on('click', function(e){
		e.preventDefault();
	});
	//set listeners
	quizApp.$setup.on('submit', function(e){
		e.preventDefault();
		quizApp.startGame();
	});
	quizApp.$random.on('click', function(){
		quizApp.randomStart();
	});
	quizApp.$reset.on('click', function(){
		quizApp.reset();
	});
	quizApp.$guessMovie.on('submit', function(e){
		e.preventDefault();
		quizApp.guessMovie();
	});
	quizApp.$passTurn.on('click', function(){
		quizApp.pass();
	});
	quizApp.$numPlayers.on('input change', function(){
		quizApp.totalPlayers = $(this).val();
		quizApp.$playerField.text(quizApp.totalPlayers + ' players');
		if (quizApp.totalPlayers == 1) {
			quizApp.$playerField.text(quizApp.totalPlayers + ' player'); 
		}
	})

};

quizApp.setVariables = function(){
	//clear variables from the last game
	quizApp.lives = Number(quizApp.$lives.find('input:checked').val());
	quizApp.playersLeft = quizApp.totalPlayers;
	quizApp.moviesLeft = 0;
	quizApp.players = [];
	quizApp.activePlayer = 0;
	quizApp.credits = [];
}

//API REQUESTS AND UPDATING DOM
//click the getname button to start the program
quizApp.startGame = function(){
	//clear the dom
	quizApp.$answers.empty();
	quizApp.setVariables();
	//check if entry is blank
	quizApp.name = quizApp.$nameInput.val();
	if (quizApp.name !== ''){
		quizApp.getName(quizApp.name);
	} else {
		swal('Enter a name!', '', 'error');
	};
};

//random start
quizApp.randomStart = function(){
	//insert get-new-random button
	quizApp.$answers.empty();
	quizApp.setVariables();
	$.ajax({
		url: 'http://api.themoviedb.org/3/person/popular',
		type: 'GET',
		dataType: 'jsonp',
		data: {
			api_key: '9314b8803e6b1e173d0c8a52303b82ce',
			page: 1
		},
		success: function(result){
			var randomNumber = Math.floor(Math.random() * result.results.length);
			var id = result.results[randomNumber].id
			quizApp.name = result.results[randomNumber].name;
			//check to see if the players know who the actor is
			swal({
				title: quizApp.name + '?',
				text: 'Ever heard of them?',
				type: 'info',
				cancelButtonText: 'Nope',
				confirmButtonText: 'Yep',
				showCancelButton: true,
				closeOnCancel: false
			},
			function(isConfirm){
				if (isConfirm) {
					quizApp.getCredits(id);	
				} else {
					quizApp.randomStart();
					console.log('cancel');
				}
			});
		}
	});
	// var randomNumber = Math.floor(Math.random() * quizApp.randomIDs.length);
	// quizApp.getCredits(quizApp.randomIDs[randomNumber]);
}

quizApp.getName = function(name){
//feed in the name to get the ID
	$.ajax({
		url: 'http://api.themoviedb.org/3/search/person',
		type: 'GET',
		dataType: 'jsonp',
		data: {
			api_key: '9314b8803e6b1e173d0c8a52303b82ce',
			query: name
		},
		//error function
		success: function(result){
			//TO DO check to see if result is valid
			if (result.total_results > 0){
				var id = result.results[0].id
				//make name properly capitalized
				quizApp.name = result.results[0].name;
				quizApp.getCredits(id);
			} else {
				swal('Whoops!', 'That name isn\'t in TMDb. Check your spelling and try again.', 'error');
			}
		}
	});
};

quizApp.getCredits = function(id){
//with the ID, do another ajax call to get the function
	$.ajax({
		url: 'http://api.themoviedb.org/3/person/' + id + '/movie_credits',
		type: 'GET',
		dataType: 'jsonp',
		data: {
			api_key: '9314b8803e6b1e173d0c8a52303b82ce'
		},
		success: function(result){
			var rawData = result.cast;
			quizApp.parseData(rawData);
		}
	});
};

quizApp.parseData = function(data){
//with the data from the AJAX id call, create an array with movie name & year
	quizApp.credits = [];
	$.each(data, function(i,piece){
		//check data for errors
		if (piece.character !== '' && piece.release_date && piece.title) {
			quizApp.credits.push({
				title: piece.title,
				year: Number(piece.release_date.slice(0,4))
			});
			quizApp.moviesLeft++;
		};
	});
	//check the number of movies. If < 10, give a warning
	quizApp.checkLength();

	//sort data by year
	quizApp.credits = quizApp.credits.sort(quizApp.sortByYear);
	quizApp.updateDOM();
};

//check length
quizApp.checkLength = function(){
	if (quizApp.credits.length < 10){
		console.log('There are fewer than 10 movies on this list');
		//TO DO warning function
		swal({
			title: 'Just so you know!',
			text: 'There are only going to be ' + quizApp.length + 'movies to choose from.',
			type: 'warning'
		})
	}
};

//sort movies by year
quizApp.sortByYear = function(a,b){
	var aYear = a.year;
	var bYear = b.year; 
  	return ((aYear < bYear) ? -1 : ((aYear > bYear) ? 1 : 0));
};

//clear setup function
quizApp.clearSetup = function(){
	$('p.benson').slideUp(function(){
		quizApp.$setup.fadeOut(function(){
			quizApp.$nameInput.val('');
			quizApp.$play.fadeIn();
		});		
	});
	quizApp.setPlayers(quizApp.totalPlayers);
	quizApp.playersLeft = quizApp.players.length;
};

quizApp.setPlayers = function(n){
	for(var i=0; i < n; i++) {
		quizApp.players[i] = {
			playerName: 'player'+ Number(i+1),
			playerAlias: 'Player '+ Number(i+1),
			lives: quizApp.lives,
			eliminated: false
		};
	};
};

quizApp.reset = function(){
//clear playmode function, return set-up function
	quizApp.$answers.empty();
	quizApp.$play.fadeOut(function(){
		quizApp.$movieInput.val('');
		quizApp.$displayTurn.empty();
		quizApp.$guessMovie.find('input').removeClass('is-disabled');
		quizApp.$passTurn.removeClass('is-disabled');
		quizApp.$reset.text('Reset');
		quizApp.$setup.fadeIn();
	});
};


quizApp.updateDOM = function(){
	//run clear setup function
	quizApp.clearSetup();
	//add movies as divs in answer field
	$.each(quizApp.credits, function(i, movie){
		var movieNew = $('<div>').addClass('movie disabled answer'+i).append('<h3>' + movie.title + ' (' + movie.year + ')');
		quizApp.$answers.append(movieNew);
	});
	//add line letting players know how many movies there are
	quizApp.$answers.prepend('<p class="moviesremain">According to TMDb, ' + quizApp.name + ' has been in ' + quizApp.credits.length + ' movies.<span class="movies-left"></span></p>');
	console.log('test');
	quizApp.showTurn();
};

//GUESSING NAMES!

quizApp.guessMovie = function(){
	quizApp.resetBools();
	quizApp.movieGuess = quizApp.$movieInput.val();
	//check to see if the input is blank
	if (quizApp.movieGuess !== '') {
		quizApp.compareGuess(quizApp.movieGuess);
	} else {
		swal('Enter a guess!', '', 'error');
	}
}

quizApp.pass = function(){
// what happens if you pass on your turn
	quizApp.resetBools();
	quizApp.movieGuess = 'the movie you couldn\'t think of';
	quizApp.compareGuess(quizApp.movieGuess);
} 


quizApp.compareGuess = function(guess){
		//check the answer against all possibles
	$.each(quizApp.credits, function(i,credit){
		//create temporary variables for guesses/answers
		var answer = credit.title.toLowerCase();
		var guess = quizApp.movieGuess.toLowerCase();
		quizApp.guess = quizApp.stringManipulate(guess);
		quizApp.answer = quizApp.stringManipulate(answer);
		if (quizApp.guess !== quizApp.answer){
			//move on to the next one
			if (i+1 === quizApp.credits.length) {
				quizApp.wrongAnswer()
				return false
				//if you get to the end of the list, the answer is wrong
			}
		} else {
			if (quizApp.$answers.find('div.answer'+i).hasClass('disabled')) { //if it hasn't been guessed
				quizApp.rightAnswer(i);
				return false
			} else { //if you guessed the same as a previous guess
				quizApp.sameAnswer();
				return false
			};
		};
	});
};

quizApp.stringManipulate = function(string){
	//manipulate the string to make guessing easier
	//add spaces to properly trigger on numbers at beginning/end of string
	string = ' ' + string + ' ';
	//remove articles at the beginning of answers/guesses
	string = string.replace(/(?:(the |a |an ))/, '');
	//change & and + to 'and'
	string = string.replace(/([&+])/g, 'and');
	//replace dashes with spaces
	string = string.replace(/(\s-\s)/g, ' ');
	//removeve special characters
	string = string.replace(/([^a-zA-Z\d\s])/g, '');
	//fix the movie seven
	string = string.replace(/(\sse7en\s)/g, 'seven');
	//convert numbers (1-17) to strings
	string = string.replace(/(\s1\s)/g, ' one ');
	string = string.replace(/(\s2\s)/g, ' two ');
	string = string.replace(/(\s3\s)/g, ' three ');
	string = string.replace(/(\s4\s)/g, ' four ');
	string = string.replace(/(\s5\s)/g, ' five ');
	string = string.replace(/(\s6\s)/g, ' six ');
	string = string.replace(/(\s7\s)/g, ' seven ');
	string = string.replace(/(\s8\s)/g, ' eight ');
	string = string.replace(/(\s9\s)/g, ' nine ');
	string = string.replace(/(\s10\s)/g, ' ten ');
	string = string.replace(/(\s11\s)/g, ' eleven ');
	string = string.replace(/(\s12\s)/g, ' twelve ');
	string = string.replace(/(\s13\s)/g, ' thirteen ');
	string = string.replace(/(\s14\s)/g, ' fourteen ');
	string = string.replace(/(\s15\s)/g, ' fifteen ');
	string = string.replace(/(\s16\s)/g, ' sixteen ');
	string = string.replace(/(\s17\s)/g, ' seventeen ');
	string = string.replace(/(\s21\s)/g, ' twentyone ');
	string = string.replace(/(\s22\s)/g, ' twentytwo ');
	string = string.replace(/(\s30\s)/g, ' thirty ');
	//convert roman numerals 1-8
	string = string.replace(/(\si\s)/g, ' one ');
	string = string.replace(/(\sii\s)/g, ' two ');
	string = string.replace(/(\siii\s)/g, ' three ');
	string = string.replace(/(\siv\s)/g, ' four ');
	string = string.replace(/(\sv\s)/g, ' five ');
	string = string.replace(/(\svi\s)/g, ' six ');
	string = string.replace(/(\svii\s)/g, ' seven ');
	string = string.replace(/(\sviii\s)/g, ' eight ');
	string = string.replace(/(\six\s)/g, ' nine ');
	//convert special characters (accents etc)
	string = string.replace(/([àáâãäå])/g,'a');
	string = string.replace(/([ç])/g,'c');
	string = string.replace(/([èéêë])/g,'e');
	string = string.replace(/([ìíîï])/g,'i');
	string = string.replace(/([ñ])/g,'n');
	string = string.replace(/([òóôõö])/g,'o');
	string = string.replace(/([ùúûü])/g,'u');
	string = string.replace(/([ýÿ])/g,'y');
	//remove spaces to avoid weird errors
	string = string.replace(/(\s)/g, '');
	console.log('|' + string + '|')
    return string;
};

quizApp.rightAnswer = function(i){
	//right answer
	quizApp.currentAnswer = 'correct'
	quizApp.$answers.find('div.answer'+i).addClass(quizApp.players[quizApp.activePlayer].playerName).insertAfter(quizApp.$answers.find('.moviesremain')).fadeIn(function(){
		$(this).removeClass('disabled');	
	});
	quizApp.moviesLeft--
	if (quizApp.moviesLeft > 0){
		quizApp.$answers.find('.movies-left').text(' ' + quizApp.moviesLeft+' more to go.');
		quizApp.endTurn();	
	} else {
		quizApp.noMoreMovies();
	};
};

quizApp.wrongAnswer = function(){
	//wrong answer
	quizApp.currentAnswer = 'wrong';
	quizApp.players[quizApp.activePlayer].lives--
	if (quizApp.players[quizApp.activePlayer].lives === 0){
		quizApp.eliminatePlayer();
	}
	quizApp.endTurn();
};


quizApp.sameAnswer = function(){
	//same answer as another guess
	quizApp.currentAnswer = 'same';
	quizApp.players[quizApp.activePlayer].lives--
	if (quizApp.players[quizApp.activePlayer].lives == 0){
		quizApp.eliminatePlayer();
	}
	quizApp.endTurn();
};

quizApp.endTurn = function(){
	quizApp.switchPlayer();
	if (quizApp.playersLeft == 1){
		quizApp.declareWinner();
	} else {
		// quizApp.$movieInput.val('').attr('placeholder', quizApp.players[quizApp.activePlayer].playerAlias + '\'s turn!');
		quizApp.showTurn();
	};
	quizApp.alerts();
	//trigger gameover if only 1 player left
	if (quizApp.keepPlaying == false){
		quizApp.gameOver(quizApp.players[quizApp.activePlayer].playerAlias);
	}
};

quizApp.showTurn = function() {
	//displays whose turn it is
	quizApp.$guessMovie.removeClass().addClass(quizApp.players[quizApp.activePlayer].playerName);
	if (quizApp.lives === 1){
		quizApp.$displayTurn.html('It is ' + quizApp.players[quizApp.activePlayer].playerAlias + '\'s turn.');
	} else{
		if (quizApp.players[quizApp.activePlayer].lives == 1){
		quizApp.$displayTurn.html('It is ' + quizApp.players[quizApp.activePlayer].playerAlias + '\'s turn. You have <span class="one-life">' + quizApp.players[quizApp.activePlayer].lives + '</span> life left.');
		} else {
		quizApp.$displayTurn.html('It is ' + quizApp.players[quizApp.activePlayer].playerAlias + '\'s turn. You have ' + quizApp.players[quizApp.activePlayer].lives + ' lives left.');
		};
	};
};

quizApp.eliminatePlayer = function(){
	//eliminate a player if necessary
	quizApp.players[quizApp.activePlayer].eliminated = true;
	quizApp.playersLeft--
	quizApp.playerEliminated = true;
};

quizApp.switchPlayer = function(){
	//switch the active player
	var currentPlayer = quizApp.activePlayer;
	quizApp.activePlayer++
	if (quizApp.activePlayer >= quizApp.players.length) {
		quizApp.activePlayer = 0;
	} ;
	while (quizApp.players[quizApp.activePlayer].eliminated){
		quizApp.activePlayer++
	};
};

quizApp.noMoreMovies = function(){
	//what happens when you run out of movies to guess
	quizApp.keepPlaying = false;
};

quizApp.declareWinner = function(){
	quizApp.keepPlaying = false;
};

quizApp.gameOver = function(winner){
	//disable the form, leave the reset button
	quizApp.$guessMovie.find('input').addClass('is-disabled');
	quizApp.$passTurn.addClass('is-disabled');
	quizApp.$displayTurn.text(winner + ' wins!');
	quizApp.$reset.text('Play again?');
	quizApp.$answers.find('.disabled').removeClass('disabled');
	var answersRight = Number(quizApp.credits.length - quizApp.moviesLeft)
	quizApp.$answers.find('.moviesremain').text('You correctly guessed ' + answersRight + ' of ' + quizApp.name + "'s movies, but missed " + quizApp.moviesLeft + '. Scroll down to see them.');
};

quizApp.alerts = function(){
//send proper sweetalerts at the end of the turn
	if (quizApp.currentAnswer == 'correct'){
		swal({
			title: 'Correct!', 
			type: 'success',
			closeOnConfirm: false
		}, function(){
			if (quizApp.keepPlaying == false){ //all movies have been guessed
				swal({
					title: 'No more movies!',
					text: 'You have somehow guessed them all!',
					type: 'success'
				});
			} else { //switch turn
				quizApp.nextPlayerAlert();
			}
		});
	} else if (quizApp.currentAnswer == 'same') {
		swal({
			title: 'Nope!',
			text: 'Someone already got that one! Pay attention!',
			type: 'error',
			closeOnConfirm: false
		}, function(){
			quizApp.wrongAnswerAlerts();
		});
	} else {
		swal({
			title: 'Nope!',
			text: quizApp.name + ' is not in ' + quizApp.movieGuess,
			type: 'error',
			closeOnConfirm: false
		}, function(){
			quizApp.wrongAnswerAlerts();
		});
	}
}

quizApp.wrongAnswerAlerts = function(){
//sweet alerts for wrong answers
	if (quizApp.playerEliminated !== false){
		swal({
			title: 'You have been eliminated!',
			imageUrl: 'images/coffin.png',
			closeOnConfirm: false
		}, function (){
			if (quizApp.keepPlaying == false){
				swal({
					title: quizApp.players[quizApp.activePlayer].playerAlias + ' wins!',
					text: 'You are the Last Man Stanton!',
					imageUrl: 'images/award.png'
				})
			} else {
				quizApp.nextPlayerAlert();
			}
		})
	} else {
		quizApp.nextPlayerAlert()
	}
}

quizApp.nextPlayerAlert = function(){
//alert the next player it is their turn, warning if they have 1 life left
	if (quizApp.players[quizApp.activePlayer].lives == 1 && quizApp.lives > 1) {
		swal({
			title: 'Last chance, ' + quizApp.players[quizApp.activePlayer].playerAlias + '!',
			text: 'You have one life left.',
			type: 'warning'
			},
		function(){
			quizApp.$movieInput.val('').attr('placeholder', quizApp.players[quizApp.activePlayer].playerAlias + '\'s turn!').focus();
		})
	}
	else {
		swal({
			title: '' + quizApp.players[quizApp.activePlayer].playerAlias + '\'s turn!'
			},
		function(){
			quizApp.$movieInput.val('').attr('placeholder', quizApp.players[quizApp.activePlayer].playerAlias + '\'s turn!').focus();
		});
	}
}

quizApp.resetBools = function() {
//reset end of turn alert triggers
	quizApp.keepPlaying = true;
	quizApp.playerEliminated = false;
	quizApp.currentAnswer = '';
}

//doc ready
$(function(){
	quizApp.init();
});
// SweetAlert
// 2014 (c) - Tristan Edwards
// github.com/t4t5/sweetalert
(function(window, document) {

  var modalClass   = '.sweet-alert',
      overlayClass = '.sweet-overlay',
      alertTypes   = ['error', 'warning', 'info', 'success'];


  /*
   * Manipulate DOM
   */

  var getModal = function() {
      return document.querySelector(modalClass);
    },
    getOverlay = function() {
      return document.querySelector(overlayClass);
    },
    hasClass = function(elem, className) {
      return new RegExp(' ' + className + ' ').test(' ' + elem.className + ' ');
    },
    addClass = function(elem, className) {
      if (!hasClass(elem, className)) {
        elem.className += ' ' + className;
      }
    },
    removeClass = function(elem, className) {
      var newClass = ' ' + elem.className.replace(/[\t\r\n]/g, ' ') + ' ';
      if (hasClass(elem, className)) {
        while (newClass.indexOf(' ' + className + ' ') >= 0) {
          newClass = newClass.replace(' ' + className + ' ', ' ');
        }
        elem.className = newClass.replace(/^\s+|\s+$/g, '');
      }
    },
    escapeHtml = function(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    },
    _show = function(elem) {
      elem.style.opacity = '';
      elem.style.display = 'block';
    },
    show = function(elems) {
      if (elems && !elems.length) {
        return _show(elems);
      }
      for (var i = 0; i < elems.length; ++i) {
        _show(elems[i]);
      }
    },
    _hide = function(elem) {
      elem.style.opacity = '';
      elem.style.display = 'none';
    },
    hide = function(elems) {
      if (elems && !elems.length) {
        return _hide(elems);
      }
      for (var i = 0; i < elems.length; ++i) {
        _hide(elems[i]);
      }
    },
    isDescendant = function(parent, child) {
      var node = child.parentNode;
      while (node !== null) {
        if (node === parent) {
          return true;
        }
        node = node.parentNode;
      }
      return false;
    },
    getTopMargin = function(elem) {
      elem.style.left = '-9999px';
      elem.style.display = 'block';

      var height = elem.clientHeight;
      var padding = parseInt(getComputedStyle(elem).getPropertyValue('padding'), 10);

      elem.style.left = '';
      elem.style.display = 'none';
      return ('-' + parseInt(height / 2 + padding) + 'px');
    },
    fadeIn = function(elem, interval) {
      if(+elem.style.opacity < 1) {
        interval = interval || 16;
        elem.style.opacity = 0;
        elem.style.display = 'block';
        var last = +new Date();
        var tick = function() {
          elem.style.opacity = +elem.style.opacity + (new Date() - last) / 100;
          last = +new Date();

          if (+elem.style.opacity < 1) {
            setTimeout(tick, interval);
          }
        };
        tick();
      }
    },
    fadeOut = function(elem, interval) {
      interval = interval || 16;
      elem.style.opacity = 1;
      var last = +new Date();
      var tick = function() {
        elem.style.opacity = +elem.style.opacity - (new Date() - last) / 100;
        last = +new Date();

        if (+elem.style.opacity > 0) {
          setTimeout(tick, interval);
        } else {
          elem.style.display = 'none';
        }
      };
      tick();
    },
    fireClick = function(node) {
      // Taken from http://www.nonobtrusive.com/2011/11/29/programatically-fire-crossbrowser-click-event-with-javascript/
      // Then fixed for today's Chrome browser.
      if (MouseEvent) {
        // Up-to-date approach
        var mevt = new MouseEvent('click', {
          view: window,
          bubbles: false,
          cancelable: true
        });
        node.dispatchEvent(mevt);
      } else if ( document.createEvent ) {
        // Fallback
        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', false, false);
        node.dispatchEvent(evt);
      } else if( document.createEventObject ) {
        node.fireEvent('onclick') ;
      } else if (typeof node.onclick === 'function' ) {
        node.onclick();
      }
    },
    stopEventPropagation = function(e) {
      // In particular, make sure the space bar doesn't scroll the main window.
      if (typeof e.stopPropagation === 'function') {
        e.stopPropagation();
        e.preventDefault();
      } else if (window.event && window.event.hasOwnProperty('cancelBubble')) {
        window.event.cancelBubble = true;
      }
    };

  // Remember state in cases where opening and handling a modal will fiddle with it.
  var previousActiveElement,
      previousDocumentClick,
      previousWindowKeyDown,
      lastFocusedButton;

  /*
   * Add modal + overlay to DOM
   */

  function initialize() {
    var sweetHTML = '<div class="sweet-overlay" tabIndex="-1"></div><div class="sweet-alert" tabIndex="-1"><div class="icon error"><span class="x-mark"><span class="line left"></span><span class="line right"></span></span></div><div class="icon warning"> <span class="body"></span> <span class="dot"></span> </div> <div class="icon info"></div> <div class="icon success"> <span class="line tip"></span> <span class="line long"></span> <div class="placeholder"></div> <div class="fix"></div> </div> <div class="icon custom"></div> <h2>Title</h2><p>Text</p><button class="cancel" tabIndex="2">Cancel</button><button class="confirm" tabIndex="1">OK</button></div>',
        sweetWrap = document.createElement('div');

    sweetWrap.innerHTML = sweetHTML;

    // For readability: check sweet-alert.html
    document.body.appendChild(sweetWrap);

    // For development use only!
    /*jQuery.ajax({
        url: '../lib/sweet-alert.html', // Change path depending on file location
        dataType: 'html'
      })
      .done(function(html) {
        jQuery('body').append(html);
      });*/
  }



  /*
   * Global sweetAlert function
   */

  window.sweetAlert = window.swal = function() {

    // Default parameters
    var params = {
      title: '',
      text: '',
      type: null,
      allowOutsideClick: false,
      showCancelButton: false,
      closeOnConfirm: true,
      closeOnCancel: true,
      confirmButtonText: 'OK',
      confirmButtonColor: '#AEDEF4',
      cancelButtonText: 'Cancel',
      imageUrl: null,
      imageSize: null
    };

    if (arguments[0] === undefined) {
      window.console.error('sweetAlert expects at least 1 attribute!');
      return false;
    }


    switch (typeof arguments[0]) {

      case 'string':
        params.title = arguments[0];
        params.text  = arguments[1] || '';
        params.type  = arguments[2] || '';

        break;

      case 'object':
        if (arguments[0].title === undefined) {
          window.console.error('Missing "title" argument!');
          return false;
        }

        params.title              = arguments[0].title;
        params.text               = arguments[0].text || params.text;
        params.type               = arguments[0].type || params.type;
        params.allowOutsideClick  = arguments[0].allowOutsideClick || params.allowOutsideClick;
        params.showCancelButton   = arguments[0].showCancelButton !== undefined ? arguments[0].showCancelButton : params.showCancelButton;
        params.closeOnConfirm     = arguments[0].closeOnConfirm !== undefined ? arguments[0].closeOnConfirm : params.closeOnConfirm;
        params.closeOnCancel      = arguments[0].closeOnCancel !== undefined ? arguments[0].closeOnCancel : params.closeOnCancel;

        // Show "Confirm" instead of "OK" if cancel button is visible
        params.confirmButtonText  = (params.showCancelButton) ? 'Confirm' : params.confirmButtonText;

        params.confirmButtonText  = arguments[0].confirmButtonText || params.confirmButtonText;
        params.confirmButtonColor = arguments[0].confirmButtonColor || params.confirmButtonColor;
        params.cancelButtonText   = arguments[0].cancelButtonText || params.cancelButtonText;
        params.imageUrl           = arguments[0].imageUrl || params.imageUrl;
        params.imageSize          = arguments[0].imageSize || params.imageSize;
        params.doneFunction       = arguments[1] || null;

        break;

      default:
        window.console.error('Unexpected type of argument! Expected "string" or "object", got ' + typeof arguments[0]);
        return false;

    }

    setParameters(params);
    fixVerticalPosition();
    openModal();


    // Modal interactions
    var modal = getModal();

    // Mouse interactions
    var onButtonEvent = function(e) {

      var target = e.target || e.srcElement,
          targetedConfirm    = (target.className === 'confirm'),
          modalIsVisible     = hasClass(modal, 'visible'),
          doneFunctionExists = (params.doneFunction && modal.getAttribute('data-has-done-function') === 'true');

      switch (e.type) {
        case ("mouseover"):
          if (targetedConfirm) {
            e.target.style.backgroundColor = colorLuminance(params.confirmButtonColor, -0.04);
          }
          break;
        case ("mouseout"):
          if (targetedConfirm) {
            e.target.style.backgroundColor = params.confirmButtonColor;
          }
          break;
        case ("mousedown"):
          if (targetedConfirm) {
            e.target.style.backgroundColor = colorLuminance(params.confirmButtonColor, -0.14);
          }
          break;
        case ("mouseup"):
          if (targetedConfirm) {
            e.target.style.backgroundColor = colorLuminance(params.confirmButtonColor, -0.04);
          }
          break;
        case ("focus"):
          var $confirmButton = modal.querySelector('button.confirm'),
              $cancelButton  = modal.querySelector('button.cancel');

          if (targetedConfirm) {
            $cancelButton.style.boxShadow = 'none';
          } else {
            $confirmButton.style.boxShadow = 'none';
          }
          break;
        case ("click"):
          if (targetedConfirm && doneFunctionExists && modalIsVisible) { // Clicked "confirm"

            params.doneFunction(true);

            if (params.closeOnConfirm) {
              closeModal();
            }
          } else if (doneFunctionExists && modalIsVisible) { // Clicked "cancel"

            // Check if callback function expects a parameter (to track cancel actions)
            var functionAsStr          = String(params.doneFunction).replace(/\s/g, '');
            var functionHandlesCancel  = functionAsStr.substring(0, 9) === "function(" && functionAsStr.substring(9, 10) !== ")";

            if (functionHandlesCancel) {
              params.doneFunction(false);
            }

            if (params.closeOnCancel) {
              closeModal();
            }
          } else {
            closeModal();
          }

          break;
      }
    };

    var $buttons = modal.querySelectorAll('button');
    for (var i = 0; i < $buttons.length; i++) {
      $buttons[i].onclick     = onButtonEvent;
      $buttons[i].onmouseover = onButtonEvent;
      $buttons[i].onmouseout  = onButtonEvent;
      $buttons[i].onmousedown = onButtonEvent;
      //$buttons[i].onmouseup   = onButtonEvent;
      $buttons[i].onfocus     = onButtonEvent;
    }

    // Remember the current document.onclick event.
    previousDocumentClick = document.onclick;
    document.onclick = function(e) {
      var target = e.target || e.srcElement;

      var clickedOnModal = (modal === target),
          clickedOnModalChild = isDescendant(modal, e.target),
          modalIsVisible = hasClass(modal, 'visible'),
          outsideClickIsAllowed = modal.getAttribute('data-allow-ouside-click') === 'true';

      if (!clickedOnModal && !clickedOnModalChild && modalIsVisible && outsideClickIsAllowed) {
        closeModal();
      }
    };


    // Keyboard interactions
    var $okButton = modal.querySelector('button.confirm'),
        $cancelButton = modal.querySelector('button.cancel'),
        $modalButtons = modal.querySelectorAll('button:not([type=hidden])');


    function handleKeyDown(e) {
      var keyCode = e.keyCode || e.which;

//don't do anything on enter
      // if ([9,13,32,27].indexOf(keyCode) === -1) {
      if ([9,32,27].indexOf(keyCode) === -1) {
        
        // Don't do work on keys we don't care about.
        return;
      }

      var $targetElement = e.target || e.srcElement;

      var btnIndex = -1; // Find the button - note, this is a nodelist, not an array.
      for (var i = 0; i < $modalButtons.length; i++) {
        if ($targetElement === $modalButtons[i]) {
          btnIndex = i;
          break;
        }
      }

      if (keyCode === 9) {
        // TAB
        if (btnIndex === -1) {
          // No button focused. Jump to the confirm button.
          $targetElement = $okButton;
        } else {
          // Cycle to the next button
          if (btnIndex === $modalButtons.length - 1) {
            $targetElement = $modalButtons[0];
          } else {
            $targetElement = $modalButtons[btnIndex + 1];
          }
        }

        stopEventPropagation(e);
        $targetElement.focus();
        setFocusStyle($targetElement, params.confirmButtonColor); // TODO

      } else {
        //don't do anything on enter
        // if (keyCode === 13 || keyCode === 32) {
          if (keyCode === 32) {
            if (btnIndex === -1) {
              // ENTER/SPACE clicked outside of a button.
              $targetElement = $okButton;
            } else {
              // Do nothing - let the browser handle it.
              $targetElement = undefined;
            }
        } else if (keyCode === 27 && !($cancelButton.hidden || $cancelButton.style.display === 'none')) {
          // ESC to cancel only if there's a cancel button displayed (like the alert() window).
          $targetElement = $cancelButton;
        } else {
          // Fallback - let the browser handle it.
          $targetElement = undefined;
        }

        if ($targetElement !== undefined) {
          fireClick($targetElement, e);
        }
      }
    }

    previousWindowKeyDown = window.onkeydown;
    window.onkeydown = handleKeyDown;

    function handleOnBlur(e) {
      var $targetElement = e.target || e.srcElement,
          $focusElement = e.relatedTarget,
          modalIsVisible = hasClass(modal, 'visible');

      if (modalIsVisible) {
        var btnIndex = -1; // Find the button - note, this is a nodelist, not an array.

        if ($focusElement !== null) {
          // If we picked something in the DOM to focus to, let's see if it was a button.
          for (var i = 0; i < $modalButtons.length; i++) {
            if ($focusElement === $modalButtons[i]) {
              btnIndex = i;
              break;
            }
          }

          if (btnIndex === -1) {
            // Something in the dom, but not a visible button. Focus back on the button.
            $targetElement.focus();
          }
        } else {
          // Exiting the DOM (e.g. clicked in the URL bar);
          lastFocusedButton = $targetElement;
        }
      }
    }

    $okButton.onblur = handleOnBlur;
    $cancelButton.onblur = handleOnBlur;

    window.onfocus = function() {
      // When the user has focused away and focused back from the whole window.
      window.setTimeout(function() {
        // Put in a timeout to jump out of the event sequence. Calling focus() in the event
        // sequence confuses things.
        if (lastFocusedButton !== undefined) {
          lastFocusedButton.focus();
          lastFocusedButton = undefined;
        }
      }, 0);
    };
  };


  /*
   * Set type, text and actions on modal
   */

  function setParameters(params) {
    var modal = getModal();

    var $title = modal.querySelector('h2'),
        $text = modal.querySelector('p'),
        $cancelBtn = modal.querySelector('button.cancel'),
        $confirmBtn = modal.querySelector('button.confirm');

    // Title
    $title.innerHTML = escapeHtml(params.title).split("\n").join("<br>");

    // Text
    $text.innerHTML = escapeHtml(params.text || '').split("\n").join("<br>");
    if (params.text) {
      show($text);
    }

    // Icon
    hide(modal.querySelectorAll('.icon'));
    if (params.type) {
      var validType = false;
      for (var i = 0; i < alertTypes.length; i++) {
        if (params.type === alertTypes[i]) {
          validType = true;
          break;
        }
      }
      if (!validType) {
        window.console.error('Unknown alert type: ' + params.type);
        return false;
      }
      var $icon = modal.querySelector('.icon.' + params.type);
      show($icon);

      // Animate icon
      switch (params.type) {
        case "success":
          addClass($icon, 'animate');
          addClass($icon.querySelector('.tip'), 'animateSuccessTip');
          addClass($icon.querySelector('.long'), 'animateSuccessLong');
          break;
        case "error":
          addClass($icon, 'animateErrorIcon');
          addClass($icon.querySelector('.x-mark'), 'animateXMark');
          break;
        case "warning":
          addClass($icon, 'pulseWarning');
          addClass($icon.querySelector('.body'), 'pulseWarningIns');
          addClass($icon.querySelector('.dot'), 'pulseWarningIns');
          break;
      }

    }

    // Custom image
    if (params.imageUrl) {
      var $customIcon = modal.querySelector('.icon.custom');

      $customIcon.style.backgroundImage = 'url(' + params.imageUrl + ')';
      show($customIcon);

      var _imgWidth  = 80,
          _imgHeight = 80;

      if (params.imageSize) {
        var imgWidth  = params.imageSize.split('x')[0];
        var imgHeight = params.imageSize.split('x')[1];

        if (!imgWidth || !imgHeight) {
          window.console.error("Parameter imageSize expects value with format WIDTHxHEIGHT, got " + params.imageSize);
        } else {
          _imgWidth  = imgWidth;
          _imgHeight = imgHeight;

          $customIcon.css({
            'width': imgWidth + 'px',
            'height': imgHeight + 'px'
          });
        }
      }
      $customIcon.setAttribute('style', $customIcon.getAttribute('style') + 'width:' + _imgWidth + 'px; height:' + _imgHeight + 'px');
    }

    // Cancel button
    modal.setAttribute('data-has-cancel-button', params.showCancelButton);
    if (params.showCancelButton) {
      $cancelBtn.style.display = 'inline-block';
    } else {
      hide($cancelBtn);
    }

    // Edit text on cancel and confirm buttons
    if (params.cancelButtonText) {
      $cancelBtn.innerHTML = escapeHtml(params.cancelButtonText);
    }
    if (params.confirmButtonText) {
      $confirmBtn.innerHTML = escapeHtml(params.confirmButtonText);
    }

    // Set confirm button to selected background color
    $confirmBtn.style.backgroundColor = params.confirmButtonColor;

    // Set box-shadow to default focused button
    setFocusStyle($confirmBtn, params.confirmButtonColor);

    // Allow outside click?
    modal.setAttribute('data-allow-ouside-click', params.allowOutsideClick);

    // Done-function
    var hasDoneFunction = (params.doneFunction) ? true : false;
    modal.setAttribute('data-has-done-function', hasDoneFunction);
  }


  /*
   * Set hover, active and focus-states for buttons (source: http://www.sitepoint.com/javascript-generate-lighter-darker-color)
   */

  function colorLuminance(hex, lum) {
    // Validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
      hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    }
    lum = lum || 0;

    // Convert to decimal and change luminosity
    var rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
      c = parseInt(hex.substr(i*2,2), 16);
      c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
      rgb += ("00"+c).substr(c.length);
    }

    return rgb;
  }

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? parseInt(result[1], 16) + ', ' + parseInt(result[2], 16) + ', ' + parseInt(result[3], 16) : null;
  }

  // Add box-shadow style to button (depending on its chosen bg-color)
  function setFocusStyle($button, bgColor) {
    var rgbColor = hexToRgb(bgColor);
    $button.style.boxShadow = '0 0 2px rgba(' + rgbColor +', 0.8), inset 0 0 0 1px rgba(0, 0, 0, 0.05)';
  }



  /*
   * Animations
   */

  function openModal() {
    var modal = getModal();
    fadeIn(getOverlay(), 10);
    show(modal);
    addClass(modal, 'showSweetAlert');
    removeClass(modal, 'hideSweetAlert');

    previousActiveElement = document.activeElement;
    var $okButton = modal.querySelector('button.confirm');
    $okButton.focus();

    setTimeout(function() {
      addClass(modal, 'visible');
    }, 500);
  }

  function closeModal() {
    var modal = getModal();
    fadeOut(getOverlay(), 5);
    fadeOut(modal, 5);
    removeClass(modal, 'showSweetAlert');
    addClass(modal, 'hideSweetAlert');
    removeClass(modal, 'visible');


    // Reset icon animations

    var $successIcon = modal.querySelector('.icon.success');
    removeClass($successIcon, 'animate');
    removeClass($successIcon.querySelector('.tip'), 'animateSuccessTip');
    removeClass($successIcon.querySelector('.long'), 'animateSuccessLong');

    var $errorIcon = modal.querySelector('.icon.error');
    removeClass($errorIcon, 'animateErrorIcon');
    removeClass($errorIcon.querySelector('.x-mark'), 'animateXMark');

    var $warningIcon = modal.querySelector('.icon.warning');
    removeClass($warningIcon, 'pulseWarning');
    removeClass($warningIcon.querySelector('.body'), 'pulseWarningIns');
    removeClass($warningIcon.querySelector('.dot'), 'pulseWarningIns');


    // Reset the page to its previous state
    window.onkeydown = previousWindowKeyDown;
    document.onclick = previousDocumentClick;
    if (previousActiveElement) {
      previousActiveElement.focus();
    }
    lastFocusedButton = undefined;
  }


  /*
   * Set "margin-top"-property on modal based on its computed height
   */

  function fixVerticalPosition() {
    var modal = getModal();

    modal.style.marginTop = getTopMargin(getModal());
  }



  /*
   * If library is injected after page has loaded
   */

  (function () {
	  if (document.readyState === "complete" || document.readyState === "interactive") {
		  initialize();
	  } else {
		  if (document.addEventListener) {
			  document.addEventListener('DOMContentLoaded', function factorial() {
				  document.removeEventListener('DOMContentLoaded', arguments.callee, false);
				  initialize();
			  }, false);
		  } else if (document.attachEvent) {
			  document.attachEvent('onreadystatechange', function() {
				  if (document.readyState === 'complete') {
					  document.detachEvent('onreadystatechange', arguments.callee);
					  initialize();
				  }
			  });
		  }
	  }
  })();

})(window, document);

var quizApp={};quizApp.key="9314b8803e6b1e173d0c8a52303b82ce",quizApp.name="",quizApp.credits=[],quizApp.moviesLeft=0,quizApp.players=[],quizApp.activePlayer=0,quizApp.totalPlayers=3,quizApp.playersLeft=3,quizApp.lives=1,quizApp.playerEliminated=!1,quizApp.keepPlaying=!0,quizApp.init=function(){quizApp.$setup=$("#setup"),quizApp.$answers=$("#answers"),quizApp.$nameInput=$("#name-input"),quizApp.$random=$("#random-name"),quizApp.$setup=$("div#setup"),quizApp.$play=$("div#play"),quizApp.$reset=$("#reset"),quizApp.$movieInput=$("#movie-input"),quizApp.$guessMovie=$("#guess-movie"),quizApp.$numPlayers=$("#players"),quizApp.$playerField=$("#setup").find("p.player-number"),quizApp.$lives=$("#lives"),quizApp.$passTurn=$("#pass-turn"),quizApp.$displayTurn=$("#display-turn"),$("button").on("click",function(e){e.preventDefault()}),quizApp.$setup.on("submit",function(e){e.preventDefault(),quizApp.startGame()}),quizApp.$random.on("click",function(){quizApp.randomStart()}),quizApp.$reset.on("click",function(){quizApp.reset()}),quizApp.$guessMovie.on("submit",function(e){e.preventDefault(),quizApp.guessMovie()}),quizApp.$passTurn.on("click",function(){quizApp.pass()}),quizApp.$numPlayers.on("input change",function(){quizApp.totalPlayers=$(this).val(),quizApp.$playerField.text(quizApp.totalPlayers+" players"),1==quizApp.totalPlayers&&quizApp.$playerField.text(quizApp.totalPlayers+" player")})},quizApp.setVariables=function(){quizApp.lives=Number(quizApp.$lives.find("input:checked").val()),quizApp.playersLeft=quizApp.totalPlayers,quizApp.moviesLeft=0,quizApp.players=[],quizApp.activePlayer=0,quizApp.credits=[]},quizApp.startGame=function(){quizApp.$answers.empty(),quizApp.setVariables(),quizApp.name=quizApp.$nameInput.val(),""!==quizApp.name?quizApp.getName(quizApp.name):swal("Enter a name!","","error")},quizApp.randomStart=function(){quizApp.$answers.empty(),quizApp.setVariables(),$.ajax({url:"http://api.themoviedb.org/3/person/popular",type:"GET",dataType:"jsonp",data:{api_key:"9314b8803e6b1e173d0c8a52303b82ce",page:1},success:function(e){var p=Math.floor(Math.random()*e.results.length),i=e.results[p].id;quizApp.name=e.results[p].name,swal({title:quizApp.name+"?",text:"Ever heard of them?",type:"info",cancelButtonText:"Nope",confirmButtonText:"Yep",showCancelButton:!0,closeOnCancel:!1},function(e){e?quizApp.getCredits(i):(quizApp.randomStart(),console.log("cancel"))})}})},quizApp.getName=function(e){$.ajax({url:"http://api.themoviedb.org/3/search/person",type:"GET",dataType:"jsonp",data:{api_key:"9314b8803e6b1e173d0c8a52303b82ce",query:e},success:function(e){if(e.total_results>0){var p=e.results[0].id;quizApp.name=e.results[0].name,quizApp.getCredits(p)}else swal("Whoops!","That name isn't in TMDb. Check your spelling and try again.","error")}})},quizApp.getCredits=function(e){$.ajax({url:"http://api.themoviedb.org/3/person/"+e+"/movie_credits",type:"GET",dataType:"jsonp",data:{api_key:"9314b8803e6b1e173d0c8a52303b82ce"},success:function(e){var p=e.cast;quizApp.parseData(p)}})},quizApp.parseData=function(e){quizApp.credits=[],$.each(e,function(e,p){""!==p.character&&p.release_date&&p.title&&(quizApp.credits.push({title:p.title,year:Number(p.release_date.slice(0,4))}),quizApp.moviesLeft++)}),quizApp.checkLength(),quizApp.credits=quizApp.credits.sort(quizApp.sortByYear),quizApp.updateDOM()},quizApp.checkLength=function(){quizApp.credits.length<10&&(console.log("There are fewer than 10 movies on this list"),swal({title:"Just so you know!",text:"There are only going to be "+quizApp.length+"movies to choose from.",type:"warning"}))},quizApp.sortByYear=function(e,p){var i=e.year,a=p.year;return a>i?-1:i>a?1:0},quizApp.clearSetup=function(){$("p.benson").slideUp(function(){quizApp.$setup.fadeOut(function(){quizApp.$nameInput.val(""),quizApp.$play.fadeIn()})}),quizApp.setPlayers(quizApp.totalPlayers),quizApp.playersLeft=quizApp.players.length},quizApp.setPlayers=function(e){for(var p=0;e>p;p++)quizApp.players[p]={playerName:"player"+Number(p+1),playerAlias:"Player "+Number(p+1),lives:quizApp.lives,eliminated:!1}},quizApp.reset=function(){quizApp.$answers.empty(),quizApp.$play.fadeOut(function(){quizApp.$movieInput.val(""),quizApp.$displayTurn.empty(),quizApp.$guessMovie.find("input").removeClass("is-disabled"),quizApp.$passTurn.removeClass("is-disabled"),quizApp.$reset.text("Reset"),quizApp.$setup.fadeIn()})},quizApp.updateDOM=function(){quizApp.clearSetup(),$.each(quizApp.credits,function(e,p){var i=$("<div>").addClass("movie disabled answer"+e).append("<h3>"+p.title+" ("+p.year+")");quizApp.$answers.append(i)}),quizApp.$answers.prepend('<p class="moviesremain">According to TMDb, '+quizApp.name+" has been in "+quizApp.credits.length+' movies.<span class="movies-left"></span></p>'),quizApp.showTurn()},quizApp.guessMovie=function(){quizApp.resetBools(),quizApp.movieGuess=quizApp.$movieInput.val(),""!==quizApp.movieGuess?quizApp.compareGuess(quizApp.movieGuess):swal("Enter a guess!","","error")},quizApp.pass=function(){quizApp.resetBools(),quizApp.movieGuess="the movie you couldn't think of",quizApp.compareGuess(quizApp.movieGuess)},quizApp.compareGuess=function(){$.each(quizApp.credits,function(e,p){var i=p.title.toLowerCase(),a=quizApp.movieGuess.toLowerCase();return quizApp.guess=quizApp.stringManipulate(a),quizApp.answer=quizApp.stringManipulate(i),quizApp.guess===quizApp.answer?quizApp.$answers.find("div.answer"+e).hasClass("disabled")?(quizApp.rightAnswer(e),!1):(quizApp.sameAnswer(),!1):e+1===quizApp.credits.length?(quizApp.wrongAnswer(),!1):void 0})},quizApp.stringManipulate=function(e){return e=" "+e+" ",e=e.replace(/(?:(the |a |an ))/,""),e=e.replace(/([&+])/g,"and"),e=e.replace(/(\s-\s)/g," "),e=e.replace(/([^a-zA-Z\d\s])/g,""),e=e.replace(/(\sse7en\s)/g,"seven"),e=e.replace(/(\s1\s)/g," one "),e=e.replace(/(\s2\s)/g," two "),e=e.replace(/(\s3\s)/g," three "),e=e.replace(/(\s4\s)/g," four "),e=e.replace(/(\s5\s)/g," five "),e=e.replace(/(\s6\s)/g," six "),e=e.replace(/(\s7\s)/g," seven "),e=e.replace(/(\s8\s)/g," eight "),e=e.replace(/(\s9\s)/g," nine "),e=e.replace(/(\s10\s)/g," ten "),e=e.replace(/(\s11\s)/g," eleven "),e=e.replace(/(\s12\s)/g," twelve "),e=e.replace(/(\s13\s)/g," thirteen "),e=e.replace(/(\s14\s)/g," fourteen "),e=e.replace(/(\s15\s)/g," fifteen "),e=e.replace(/(\s16\s)/g," sixteen "),e=e.replace(/(\s17\s)/g," seventeen "),e=e.replace(/(\s21\s)/g," twentyone "),e=e.replace(/(\s22\s)/g," twentytwo "),e=e.replace(/(\s30\s)/g," thirty "),e=e.replace(/(\si\s)/g," one "),e=e.replace(/(\sii\s)/g," two "),e=e.replace(/(\siii\s)/g," three "),e=e.replace(/(\siv\s)/g," four "),e=e.replace(/(\sv\s)/g," five "),e=e.replace(/(\svi\s)/g," six "),e=e.replace(/(\svii\s)/g," seven "),e=e.replace(/(\sviii\s)/g," eight "),e=e.replace(/(\six\s)/g," nine "),e=e.replace(/([àáâãäå])/g,"a"),e=e.replace(/([ç])/g,"c"),e=e.replace(/([èéêë])/g,"e"),e=e.replace(/([ìíîï])/g,"i"),e=e.replace(/([ñ])/g,"n"),e=e.replace(/([òóôõö])/g,"o"),e=e.replace(/([ùúûü])/g,"u"),e=e.replace(/([ýÿ])/g,"y"),e=e.replace(/(\s)/g,""),console.log("|"+e+"|"),e},quizApp.rightAnswer=function(e){quizApp.currentAnswer="correct",quizApp.$answers.find("div.answer"+e).addClass(quizApp.players[quizApp.activePlayer].playerName).insertAfter(quizApp.$answers.find(".moviesremain")).fadeIn(function(){$(this).removeClass("disabled")}),quizApp.moviesLeft--,quizApp.moviesLeft>0?(quizApp.$answers.find(".movies-left").text(" "+quizApp.moviesLeft+" more to go."),quizApp.endTurn()):quizApp.noMoreMovies()},quizApp.wrongAnswer=function(){quizApp.currentAnswer="wrong",quizApp.players[quizApp.activePlayer].lives--,0===quizApp.players[quizApp.activePlayer].lives&&quizApp.eliminatePlayer(),quizApp.endTurn()},quizApp.sameAnswer=function(){quizApp.currentAnswer="same",quizApp.players[quizApp.activePlayer].lives--,0==quizApp.players[quizApp.activePlayer].lives&&quizApp.eliminatePlayer(),quizApp.endTurn()},quizApp.endTurn=function(){quizApp.switchPlayer(),1==quizApp.playersLeft?quizApp.declareWinner():quizApp.showTurn(),quizApp.alerts(),0==quizApp.keepPlaying&&quizApp.gameOver(quizApp.players[quizApp.activePlayer].playerAlias)},quizApp.showTurn=function(){quizApp.$guessMovie.removeClass().addClass(quizApp.players[quizApp.activePlayer].playerName),1===quizApp.lives?quizApp.$displayTurn.html("It is "+quizApp.players[quizApp.activePlayer].playerAlias+"'s turn."):1==quizApp.players[quizApp.activePlayer].lives?quizApp.$displayTurn.html("It is "+quizApp.players[quizApp.activePlayer].playerAlias+'\'s turn. You have <span class="one-life">'+quizApp.players[quizApp.activePlayer].lives+"</span> life left."):quizApp.$displayTurn.html("It is "+quizApp.players[quizApp.activePlayer].playerAlias+"'s turn. You have "+quizApp.players[quizApp.activePlayer].lives+" lives left.")},quizApp.eliminatePlayer=function(){quizApp.players[quizApp.activePlayer].eliminated=!0,quizApp.playersLeft--,quizApp.playerEliminated=!0},quizApp.switchPlayer=function(){quizApp.activePlayer;for(quizApp.activePlayer++,quizApp.activePlayer>=quizApp.players.length&&(quizApp.activePlayer=0);quizApp.players[quizApp.activePlayer].eliminated;)quizApp.activePlayer++},quizApp.noMoreMovies=function(){quizApp.keepPlaying=!1},quizApp.declareWinner=function(){quizApp.keepPlaying=!1},quizApp.gameOver=function(e){quizApp.$guessMovie.find("input").addClass("is-disabled"),quizApp.$passTurn.addClass("is-disabled"),quizApp.$displayTurn.text(e+" wins!"),quizApp.$reset.text("Play again?"),quizApp.$answers.find(".disabled").removeClass("disabled");var p=Number(quizApp.credits.length-quizApp.moviesLeft);quizApp.$answers.find(".moviesremain").text("You correctly guessed "+p+" of "+quizApp.name+"'s movies, but missed "+quizApp.moviesLeft+". Scroll down to see them.")},quizApp.alerts=function(){"correct"==quizApp.currentAnswer?swal({title:"Correct!",type:"success",closeOnConfirm:!1},function(){0==quizApp.keepPlaying?swal({title:"No more movies!",text:"You have somehow guessed them all!",type:"success"}):quizApp.nextPlayerAlert()}):"same"==quizApp.currentAnswer?swal({title:"Nope!",text:"Someone already got that one! Pay attention!",type:"error",closeOnConfirm:!1},function(){quizApp.wrongAnswerAlerts()}):swal({title:"Nope!",text:quizApp.name+" is not in "+quizApp.movieGuess,type:"error",closeOnConfirm:!1},function(){quizApp.wrongAnswerAlerts()})},quizApp.wrongAnswerAlerts=function(){quizApp.playerEliminated!==!1?swal({title:"You have been eliminated!",imageUrl:"images/coffin.png",closeOnConfirm:!1},function(){0==quizApp.keepPlaying?swal({title:quizApp.players[quizApp.activePlayer].playerAlias+" wins!",text:"You are the Last Man Stanton!",imageUrl:"images/award.png"}):quizApp.nextPlayerAlert()}):quizApp.nextPlayerAlert()},quizApp.nextPlayerAlert=function(){1==quizApp.players[quizApp.activePlayer].lives&&quizApp.lives>1?swal({title:"Last chance, "+quizApp.players[quizApp.activePlayer].playerAlias+"!",text:"You have one life left.",type:"warning"},function(){quizApp.$movieInput.val("").attr("placeholder",quizApp.players[quizApp.activePlayer].playerAlias+"'s turn!").focus()}):swal({title:""+quizApp.players[quizApp.activePlayer].playerAlias+"'s turn!"},function(){quizApp.$movieInput.val("").attr("placeholder",quizApp.players[quizApp.activePlayer].playerAlias+"'s turn!").focus()})},quizApp.resetBools=function(){quizApp.keepPlaying=!0,quizApp.playerEliminated=!1,quizApp.currentAnswer=""},$(function(){quizApp.init()});
!function(e,t){function n(){var e='<div class="sweet-overlay" tabIndex="-1"></div><div class="sweet-alert" tabIndex="-1"><div class="icon error"><span class="x-mark"><span class="line left"></span><span class="line right"></span></span></div><div class="icon warning"> <span class="body"></span> <span class="dot"></span> </div> <div class="icon info"></div> <div class="icon success"> <span class="line tip"></span> <span class="line long"></span> <div class="placeholder"></div> <div class="fix"></div> </div> <div class="icon custom"></div> <h2>Title</h2><p>Text</p><button class="cancel" tabIndex="2">Cancel</button><button class="confirm" tabIndex="1">OK</button></div>',n=t.createElement("div");n.innerHTML=e,t.body.appendChild(n)}function o(t){var n=v(),o=n.querySelector("h2"),r=n.querySelector("p"),a=n.querySelector("button.cancel"),c=n.querySelector("button.confirm");if(o.innerHTML=x(t.title).split("\n").join("<br>"),r.innerHTML=x(t.text||"").split("\n").join("<br>"),t.text&&k(r),T(n.querySelectorAll(".icon")),t.type){for(var l=!1,s=0;s<p.length;s++)if(t.type===p[s]){l=!0;break}if(!l)return e.console.error("Unknown alert type: "+t.type),!1;var u=n.querySelector(".icon."+t.type);switch(k(u),t.type){case"success":w(u,"animate"),w(u.querySelector(".tip"),"animateSuccessTip"),w(u.querySelector(".long"),"animateSuccessLong");break;case"error":w(u,"animateErrorIcon"),w(u.querySelector(".x-mark"),"animateXMark");break;case"warning":w(u,"pulseWarning"),w(u.querySelector(".body"),"pulseWarningIns"),w(u.querySelector(".dot"),"pulseWarningIns")}}if(t.imageUrl){var f=n.querySelector(".icon.custom");f.style.backgroundImage="url("+t.imageUrl+")",k(f);var d=80,m=80;if(t.imageSize){var g=t.imageSize.split("x")[0],y=t.imageSize.split("x")[1];g&&y?(d=g,m=y,f.css({width:g+"px",height:y+"px"})):e.console.error("Parameter imageSize expects value with format WIDTHxHEIGHT, got "+t.imageSize)}f.setAttribute("style",f.getAttribute("style")+"width:"+d+"px; height:"+m+"px")}n.setAttribute("data-has-cancel-button",t.showCancelButton),t.showCancelButton?a.style.display="inline-block":T(a),t.cancelButtonText&&(a.innerHTML=x(t.cancelButtonText)),t.confirmButtonText&&(c.innerHTML=x(t.confirmButtonText)),c.style.backgroundColor=t.confirmButtonColor,i(c,t.confirmButtonColor),n.setAttribute("data-allow-ouside-click",t.allowOutsideClick);var b=t.doneFunction?!0:!1;n.setAttribute("data-has-done-function",b)}function r(e,t){e=String(e).replace(/[^0-9a-f]/gi,""),e.length<6&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]),t=t||0;var n,o,r="#";for(o=0;3>o;o++)n=parseInt(e.substr(2*o,2),16),n=Math.round(Math.min(Math.max(0,n+n*t),255)).toString(16),r+=("00"+n).substr(n.length);return r}function a(e){var t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?parseInt(t[1],16)+", "+parseInt(t[2],16)+", "+parseInt(t[3],16):null}function i(e,t){var n=a(t);e.style.boxShadow="0 0 2px rgba("+n+", 0.8), inset 0 0 0 1px rgba(0, 0, 0, 0.05)"}function c(){var e=v();O(b(),10),k(e),w(e,"showSweetAlert"),S(e,"hideSweetAlert"),u=t.activeElement;var n=e.querySelector("button.confirm");n.focus(),setTimeout(function(){w(e,"visible")},500)}function l(){var n=v();I(b(),5),I(n,5),S(n,"showSweetAlert"),w(n,"hideSweetAlert"),S(n,"visible");var o=n.querySelector(".icon.success");S(o,"animate"),S(o.querySelector(".tip"),"animateSuccessTip"),S(o.querySelector(".long"),"animateSuccessLong");var r=n.querySelector(".icon.error");S(r,"animateErrorIcon"),S(r.querySelector(".x-mark"),"animateXMark");var a=n.querySelector(".icon.warning");S(a,"pulseWarning"),S(a.querySelector(".body"),"pulseWarningIns"),S(a.querySelector(".dot"),"pulseWarningIns"),e.onkeydown=d,t.onclick=f,u&&u.focus(),m=void 0}function s(){var e=v();e.style.marginTop=q(v())}var u,f,d,m,g=".sweet-alert",y=".sweet-overlay",p=["error","warning","info","success"],v=function(){return t.querySelector(g)},b=function(){return t.querySelector(y)},h=function(e,t){return new RegExp(" "+t+" ").test(" "+e.className+" ")},w=function(e,t){h(e,t)||(e.className+=" "+t)},S=function(e,t){var n=" "+e.className.replace(/[\t\r\n]/g," ")+" ";if(h(e,t)){for(;n.indexOf(" "+t+" ")>=0;)n=n.replace(" "+t+" "," ");e.className=n.replace(/^\s+|\s+$/g,"")}},x=function(e){var n=t.createElement("div");return n.appendChild(t.createTextNode(e)),n.innerHTML},C=function(e){e.style.opacity="",e.style.display="block"},k=function(e){if(e&&!e.length)return C(e);for(var t=0;t<e.length;++t)C(e[t])},B=function(e){e.style.opacity="",e.style.display="none"},T=function(e){if(e&&!e.length)return B(e);for(var t=0;t<e.length;++t)B(e[t])},E=function(e,t){for(var n=t.parentNode;null!==n;){if(n===e)return!0;n=n.parentNode}return!1},q=function(e){e.style.left="-9999px",e.style.display="block";var t=e.clientHeight,n=parseInt(getComputedStyle(e).getPropertyValue("padding"),10);return e.style.left="",e.style.display="none","-"+parseInt(t/2+n)+"px"},O=function(e,t){if(+e.style.opacity<1){t=t||16,e.style.opacity=0,e.style.display="block";var n=+new Date,o=function(){e.style.opacity=+e.style.opacity+(new Date-n)/100,n=+new Date,+e.style.opacity<1&&setTimeout(o,t)};o()}},I=function(e,t){t=t||16,e.style.opacity=1;var n=+new Date,o=function(){e.style.opacity=+e.style.opacity-(new Date-n)/100,n=+new Date,+e.style.opacity>0?setTimeout(o,t):e.style.display="none"};o()},A=function(n){if(MouseEvent){var o=new MouseEvent("click",{view:e,bubbles:!1,cancelable:!0});n.dispatchEvent(o)}else if(t.createEvent){var r=t.createEvent("MouseEvents");r.initEvent("click",!1,!1),n.dispatchEvent(r)}else t.createEventObject?n.fireEvent("onclick"):"function"==typeof n.onclick&&n.onclick()},M=function(t){"function"==typeof t.stopPropagation?(t.stopPropagation(),t.preventDefault()):e.event&&e.event.hasOwnProperty("cancelBubble")&&(e.event.cancelBubble=!0)};e.sweetAlert=e.swal=function(){function n(e){var t=e.keyCode||e.which;if(-1!==[9,32,27].indexOf(t)){for(var n=e.target||e.srcElement,o=-1,r=0;r<x.length;r++)if(n===x[r]){o=r;break}9===t?(n=-1===o?w:o===x.length-1?x[0]:x[o+1],M(e),n.focus(),i(n,u.confirmButtonColor)):(n=32===t?-1===o?w:void 0:27!==t||S.hidden||"none"===S.style.display?void 0:S,void 0!==n&&A(n,e))}}function a(e){var t=e.target||e.srcElement,n=e.relatedTarget,o=h(g,"visible");if(o){var r=-1;if(null!==n){for(var a=0;a<x.length;a++)if(n===x[a]){r=a;break}-1===r&&t.focus()}else m=t}}var u={title:"",text:"",type:null,allowOutsideClick:!1,showCancelButton:!1,closeOnConfirm:!0,closeOnCancel:!0,confirmButtonText:"OK",confirmButtonColor:"#AEDEF4",cancelButtonText:"Cancel",imageUrl:null,imageSize:null};if(void 0===arguments[0])return e.console.error("sweetAlert expects at least 1 attribute!"),!1;switch(typeof arguments[0]){case"string":u.title=arguments[0],u.text=arguments[1]||"",u.type=arguments[2]||"";break;case"object":if(void 0===arguments[0].title)return e.console.error('Missing "title" argument!'),!1;u.title=arguments[0].title,u.text=arguments[0].text||u.text,u.type=arguments[0].type||u.type,u.allowOutsideClick=arguments[0].allowOutsideClick||u.allowOutsideClick,u.showCancelButton=void 0!==arguments[0].showCancelButton?arguments[0].showCancelButton:u.showCancelButton,u.closeOnConfirm=void 0!==arguments[0].closeOnConfirm?arguments[0].closeOnConfirm:u.closeOnConfirm,u.closeOnCancel=void 0!==arguments[0].closeOnCancel?arguments[0].closeOnCancel:u.closeOnCancel,u.confirmButtonText=u.showCancelButton?"Confirm":u.confirmButtonText,u.confirmButtonText=arguments[0].confirmButtonText||u.confirmButtonText,u.confirmButtonColor=arguments[0].confirmButtonColor||u.confirmButtonColor,u.cancelButtonText=arguments[0].cancelButtonText||u.cancelButtonText,u.imageUrl=arguments[0].imageUrl||u.imageUrl,u.imageSize=arguments[0].imageSize||u.imageSize,u.doneFunction=arguments[1]||null;break;default:return e.console.error('Unexpected type of argument! Expected "string" or "object", got '+typeof arguments[0]),!1}o(u),s(),c();for(var g=v(),y=function(e){var t=e.target||e.srcElement,n="confirm"===t.className,o=h(g,"visible"),a=u.doneFunction&&"true"===g.getAttribute("data-has-done-function");switch(e.type){case"mouseover":n&&(e.target.style.backgroundColor=r(u.confirmButtonColor,-.04));break;case"mouseout":n&&(e.target.style.backgroundColor=u.confirmButtonColor);break;case"mousedown":n&&(e.target.style.backgroundColor=r(u.confirmButtonColor,-.14));break;case"mouseup":n&&(e.target.style.backgroundColor=r(u.confirmButtonColor,-.04));break;case"focus":var i=g.querySelector("button.confirm"),c=g.querySelector("button.cancel");n?c.style.boxShadow="none":i.style.boxShadow="none";break;case"click":if(n&&a&&o)u.doneFunction(!0),u.closeOnConfirm&&l();else if(a&&o){var s=String(u.doneFunction).replace(/\s/g,""),f="function("===s.substring(0,9)&&")"!==s.substring(9,10);f&&u.doneFunction(!1),u.closeOnCancel&&l()}else l()}},p=g.querySelectorAll("button"),b=0;b<p.length;b++)p[b].onclick=y,p[b].onmouseover=y,p[b].onmouseout=y,p[b].onmousedown=y,p[b].onfocus=y;f=t.onclick,t.onclick=function(e){var t=e.target||e.srcElement,n=g===t,o=E(g,e.target),r=h(g,"visible"),a="true"===g.getAttribute("data-allow-ouside-click");!n&&!o&&r&&a&&l()};var w=g.querySelector("button.confirm"),S=g.querySelector("button.cancel"),x=g.querySelectorAll("button:not([type=hidden])");d=e.onkeydown,e.onkeydown=n,w.onblur=a,S.onblur=a,e.onfocus=function(){e.setTimeout(function(){void 0!==m&&(m.focus(),m=void 0)},0)}},function(){"complete"===t.readyState||"interactive"===t.readyState?n():t.addEventListener?t.addEventListener("DOMContentLoaded",function(){t.removeEventListener("DOMContentLoaded",arguments.callee,!1),n()},!1):t.attachEvent&&t.attachEvent("onreadystatechange",function(){"complete"===t.readyState&&(t.detachEvent("onreadystatechange",arguments.callee),n())})}()}(window,document);