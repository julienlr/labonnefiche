/* eslint-env node */
'use strict';

// Ce modules fournit quelques fonction pour simplifier l'accès
// à notre base de données sqlite

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./LaBonneFiche.db', sqlite3.OPEN_READWRITE, function (err) {
    if (err) {
        console.error(err + '\n' + 'run "npm run createDB" to create a database file');
        // Pas de problème pour faire un appel synchrone ici : on est dans la phase
        // d'initialisation du serveur et pas dans le traitement de requêtes.
        require('process').exit(-1);
    }
});

// Rend la fonction get de l'api sqlite compatible avec les promesses
const get = sql => new Promise(function (resolve, reject) {
    db.get(sql, function (err, row) {
        if (err) {
            reject(err);
        }
        else {
            resolve(row);
        }
    });
});

// Idem pour la fonction all
const all = sql => new Promise(function (resolve, reject) {
    db.all(sql, function (err, rows) {
        if (err) {
            reject(err);
        }
        else {
            resolve(rows);
        }
    });
});

module.exports.users = {
    byPseudo: (username) => get(`select id, password from user where pseudo = '${username}';`),
    a: Promise.resolve({
        id: 0,
        checkPassword: (/*password*/) => true,
    }),
    getId: username => get(`SELECT id FROM User WHERE pseudo='${username}';`),
    byId: id => get(`select pseudo as username from user where id = '${id}';`),
    byEmail: (mail,pseudo) => get(`select pseudo from user where mail = '${mail}' or pseudo = '${pseudo}';`),
    byPseudo2: (username) => get(`select mail from user where pseudo = '${username}';`),
    pseudo:(username) => get(`select id from user where pseudo = '${username}';`),
    byMail: (mail, mail2) => get(`select mail from user where mail = '${mail}' and mail != '${mail2}';`),
    infos: (username) => get(`SELECT pseudo, nom, prenom, password, mail FROM USER WHERE pseudo = '${username}';`),
    inscr: (nom, prenom, pseudo, mail, pwd) =>
        get(`insert into user (nom, prenom, pseudo, mail, type, password) values ('${nom}', '${prenom}', '${pseudo}', '${mail}',0, '${pwd}');`),
    modif: (nom,prenom,pseudo,mail,pwd) =>
        get(`UPDATE user SET nom = '${nom}', prenom = '${prenom}', mail = '${mail}', password = '${pwd}' WHERE pseudo = '${pseudo}';`),
};

module.exports.lessons = {
    byId: id =>
        get(`SELECT Cours.idCours AS 'lesson_id', Cours.nom AS 'lesson_name', Cours.note, Cours.dateCours, Cours.URL, Cours.tags, User.nom, User.prenom
             FROM Cours JOIN User ON Cours.idCreateur=User.id WHERE idCours='${id}';`),
    byName: lesson_name =>
        all(`SELECT Cours.idCours AS 'lesson_id', Cours.nom AS 'lesson_name', Cours.note, Cours.dateCours, Cours.tags, User.nom, User.prenom, Format.nomFormat AS 'file_type'
             FROM Cours JOIN User ON Cours.idCreateur=User.id JOIN Format ON Cours.idFormat=Format.idFormat WHERE Cours.nom LIKE '%${lesson_name}%';`),
    // byOwner: owner => get(`SELECT Cours.nom AS 'lesson_name' FROM Cours WHERE idCreateur='${owner}';`),
    
    // Pas de prise en compte des chemins différents, qui seraient alors des ressources différentes
    // A améliorer
    // guidAvailable: (guid) => get(`SELECT Cours.idCours FROM Cours WHERE Cours.URL LIKE '%${guid}%';`)
};

module.exports.cours = {
    byURL: (url, id) =>
        get(`SELECT idCreateur FROM Cours WHERE URL='${url}' AND idCreateur='${id}';`),
    add: (idEcole, typeCours, nom, URL, idCreateur, note, dateCours, tags, idFormat) =>
        get(`insert into cours (idEcole, typeCours, nom, URL, idCreateur, note, dateCours, tags, idFormat) values 
            ('${idEcole}', '${typeCours}', '${nom}', '${URL}', '${idCreateur}', '${note}', '${dateCours}','${tags}', '${idFormat}');`),
};

module.exports.comments = {
    byLesson: (lesson_id) =>
        all(`SELECT Commentaire.commentaire AS 'comment_content', Commentaire.dateCommentaire AS 'comment_date', User.nom AS 'comment_user_surname', User.prenom AS 'comment_user_firstname'
             FROM Commentaire JOIN User ON Commentaire.idAuteur=User.id WHERE Commentaire.idCours='${lesson_id}';`)
};