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
quizApp.playerNames = [];

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
	quizApp.$playerNames = $('#player-names');
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
		quizApp.changePlayerNum($(this).val());
	});

};

//CHANGE NUMBER OF PLAYERS

quizApp.changePlayerNum = function(players){
	quizApp.$playerNames.html('');
	quizApp.totalPlayers = players;
		quizApp.$playerField.text(players + ' players');
		if (players == 1) {
			quizApp.$playerField.text(players + ' player'); 
		}
	for(i = 0; i < players; i++){
		playerNum = Number(i+1);
		quizApp.$playerNames.append('<fieldset class="player" id="player'+playerNum+'"><li class="player' + playerNum + '"><input type="text" class="text-input player-name" placeholder="Player '+ playerNum + '\'s name"><input type="submit" class="main button player-submit player'+playerNum+'" value="Submit"></fieldset>');
		quizApp.playerNames[i] = "";	
	}
};

quizApp.setVariables = function(){
	//clear variables from the last game
	quizApp.lives = Number(quizApp.$lives.find('input:checked').val());
	quizApp.playersLeft = quizApp.totalPlayers;
	quizApp.moviesLeft = 0;
	quizApp.players = [];
	quizApp.activePlayer = 0;
	quizApp.credits = [];
};

//API REQUESTS AND UPDATING DOM
//click the getname button to start the program
quizApp.startGame = function(){
	//clear the dom
	quizApp.$answers.empty();
	quizApp.setVariables();
	//check if entry is blank
	quizApp.name = quizApp.$nameInput.val();
	if (quizApp.name !== ''){
		quizApp.activeInput = document.activeElement;
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
	quizApp.showTurn();
};

//GUESSING NAMES!

quizApp.guessMovie = function(){
	quizApp.resetBools();
	quizApp.activeInput = document.activeElement;
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
	// console.log('|' + string + '|')
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