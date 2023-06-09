/* 
 * [2022/2023]
 * 01UDFOV Applicazioni Web I / 01TXYOV Web Applications I
 * Lab 2 - Exercise 2
 */

'use strict';

/* 
DB STRUCTURE
CREATE TABLE "films" (
	"id"	INTEGER,
	"title"	TEXT NOT NULL,
	"favorite"	BOOLEAN NOT NULL DEFAULT (0),
	"watchdate"	DATETIME,
	"rating"	INTEGER,
	PRIMARY KEY("id")
);
*/

const sqlite = require('sqlite3');
const dayjs = require('dayjs');


function Film(id, title, isFavorite = false, watchDate, rating) {
  this.id = id;
  this.title = title;
  this.favorite = isFavorite;
  this.rating = rating;
  // saved as dayjs object only if watchDate is truthy
  this.watchDate = watchDate && dayjs(watchDate);

  this.toString = () => {
    return `Id: ${this.id}, ` +
    `Title: ${this.title}, Favorite: ${this.favorite}, ` +
    `Watch date: ${this.formatWatchDate('MMMM D, YYYY')}, ` +
    `Score: ${this.formatRating()}` ;
  }

  this.formatWatchDate = (format) => {
    return this.watchDate ? this.watchDate.format(format) : '<not defined>';
  }

  this.formatRating = () => {
    return this.rating ? this.rating : '<not assigned>';
  }
}

function FilmLibrary() {
  const db = new sqlite.Database('films.db', (err) => { if (err) throw err; });

  this.closeDB = () => {
    try {
      db.close();
    }
    catch (error) {
      console.error(`Impossible to close the database! ${error}`);
    }
  }

  this.getAll = () => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM films' ;
      db.all(query, [], (err, rows) => {
        if(err) {
          reject(err);
        }
        else {
          const films = rows.map(record => new Film(record.id, record.title, record.favorite == 1, record.watchdate, record.rating));
          resolve(films);
        }
      });
    });
  };

  this.getFavorites = () => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM films WHERE favorite = True';
      db.all(query, [], (err, rows) => {
        if(err) {
          reject(err);
        }
        else {
          const films = rows.map(record => new Film(record.id, record.title, record.favorite == 1, record.watchdate, record.rating));
          resolve(films);
        }
      });
    });
  };

  this.getToday = () => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM films WHERE watchdate = ?';
      const today = dayjs().format('YYYY-MM-DD');
      db.all(query, [today], (err, rows) => {
        if(err) {
          reject(err);
        }
        else {
          const films = rows.map(record => new Film(record.id, record.title, record.favorite == 1, record.watchdate, record.rating));
          resolve(films);
        }
      });
   });
  }

  this.getBeforeDate = (watchdate) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM films WHERE watchdate < ?';
      db.all(query, [watchdate.format('YYYY-MM-DD')], (err, rows) => {
        if(err) {
          reject(err);
        }
        else {
          const films = rows.map(record => new Film(record.id, record.title, record.favorite == 1, record.watchdate, record.rating));
          resolve(films);
        }
      });
    });
  };

  this.getRated = (rating) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM films WHERE rating >= ?';
      db.all(query, [rating], (err, rows) => {
        if(err) {
          reject(err);
        }
        else {
          const films = rows.map(record => new Film(record.id, record.title, record.favorite == 1, record.watchdate, record.rating));
          resolve(films);
        }
      });
    });
  };

  this.getWithWord = (word) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM films WHERE title LIKE ?';
      db.all(query, ["%" + word + "%"], (err, rows) => {
        if(err) {
          reject(err);
        }
        else {
          const films = rows.map(record => new Film(record.id, record.title, record.favorite == 1, record.watchdate, record.rating));
          resolve(films);
        }
      });
    });
  };

  this.deleteFilm = (filmID) => {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM films WHERE id = ?';
      db.run(sql, [filmID], function (err) {  // this.changes won't be available with an arrow function here
        if (err)
          reject(err);
        else
          // returning the number of affected rows: if nothing deleted, returns 0
          resolve(this.changes);
      });
    });
  };

  this.addFilm = (film) => {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO films(id, title, favorite, watchdate, rating) VALUES(?, ?, ?, ?, ?)';
      const parameters = [film.id, film.title, film.favorite, film.watchDate.format('YYYY-MM-DD'), film.rating];
      db.run(query, parameters, function (err) {  // this.lastID won't be available with an arrow function here
        if (err)
          reject(err);
        else
          resolve(this.lastID);
      });
    });
  };

  this.resetWatchDate = () => {
    return new Promise((resolve, reject) => {
      const updateQuery = 'UPDATE films SET watchdate = NULL';
      db.all(updateQuery, [], (err, rows) => {
        if(err)
          reject(err);
        else
          resolve();
      });
    });
  };

}

/* TESTING */
async function main() {

  const filmLibrary = new FilmLibrary();
  
  try {
    // get all the movies
    console.log('\n****** All the movies in the database: ******');
    const films = await filmLibrary.getAll();
    if(films.length === 0)
      console.log('No movies yet, try later.');
    else
      films.forEach( (film) => console.log(`${film}`) );

    // get all favorite movies
    console.log('\n****** All favorite movies in the database: ******');
    const favoriteFilms = await filmLibrary.getFavorites();
    if(favoriteFilms.length === 0)
      console.log('No favorite movies yet, try later.');
    else
      favoriteFilms.forEach( (film) => console.log(`${film}`) );

    // retrieving movies watched today
    console.log('\n****** Movies watched today ******');
    const watchedToday = await filmLibrary.getToday();
    if(watchedToday.length === 0)
      console.log('No movies watched today, time to watch one?');
    else
      watchedToday.forEach( (film) => console.log(`${film}`) );

    // get films before a certain date
    const watchdate = dayjs('2023-03-19');
    console.log('\n****** Movies watched before ' + watchdate.format('YYYY-MM-DD') + ': ******');
    const watchedFilms = await filmLibrary.getBeforeDate(watchdate);
    if(watchedFilms.length === 0)
      console.log("No movies in this period, sorry.");
    else
      watchedFilms.forEach( (film) => console.log(`${film}`) );

    // get movies with a minimum score of 4
    const rating = 4
    console.log('\n****** Movies with a minimum rate of ' + rating + ': ******');
    const ratedFilms = await filmLibrary.getRated(rating);
    if(ratedFilms.length === 0)
      console.log('No movies with this rating, yet.');
    else
      ratedFilms.forEach( (film) => console.log(`${film}`) );

    // get films with a the word "war" in the title
    const word = 'war';
    console.log(`\n****** Movies containing '${word}' in the title: ******`);
    const filteredFilms = await filmLibrary.getWithWord(word);
    if(filteredFilms.length === 0)
      console.log(`No movies with the word ${word} in the title...`);
    else
      filteredFilms.forEach( (film) => console.log(`${film}`) );
  } catch (error) {
    console.error(`Impossible to retrieve movies! ${error}`);
    filmLibrary.closeDB();
    return;
  }

  // inserting a new film
  const filmID = 6;
  console.log(`\n****** Adding a new movie: ******`);
  const newFilm = new Film(6, "Fast & Furious", false, dayjs().toISOString(), 2);
  try {
    const dbId = await filmLibrary.addFilm(newFilm);
    console.log(`New film inserted! ID: ${dbId}.`);
  } catch (error) {
    console.error(`Impossible to insert a new movie! ${error}`);
  }

  // delete a film
  console.log(`\n****** Deleting the movie with ID '${filmID}': ******`);
  try {
    const deleted = await filmLibrary.deleteFilm(filmID);
    if (deleted)
      console.log('Movie successfully deleted!');
    else
      console.error(`There is no movie to delete with id: ${filmID}`);
  } catch (error) {
    console.error(`Impossible to delete the movie with id: ${filmID}! ${error}`);
  }

  // reset all the whatchdate
  console.log(`\n****** Resetting all the watch dates: ******`);
  try {
    await filmLibrary.resetWatchDate();
    console.log('Watch dates resetted!');
  } catch (error) {
    console.error(`Impossible to reset watch dates! ${error}`);
  }

  // printing updated movies
  console.log('\n****** All the movies after the updates: ******');
  const filmUpdated = await filmLibrary.getAll();
  if(filmUpdated.length === 0)
    console.log('No movies yet, try later.');
  else
    filmUpdated.forEach( (film) => console.log(`${film}`) );

  filmLibrary.closeDB();
}

main();
debugger;
