/* eslint-env node */
'use strict';

// Liens - Sources :
    // Utilisation de multer et ajout de documents sur le serveur
    // https://newcodingera.com/upload-files-using-multer-in-nodejs/

    // Génération de GUID qui respecte la RFC4122
    // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript

// Expressjs
const express = require('express');
// Multer
const multer  = require('multer');

// Module nodejs d'accès simplifié à la base de données
const dbHelper = require('./dbhelper.js');

// Définition des caractéristiques pour le stockage des fichiers sur le serveur
const storage = multer.diskStorage({
    destination: './public/documents',
    filename: function (req, file, cb) {

        let file_extension = file.originalname.split('.')[1].toLowerCase();

        file.originalname = generateGUID() + '.' + file_extension;

        cb(null, file.originalname);
    }
});

// Définition des paramètres pour l'envoi de fichiers sur le serveur
const upload = multer({
    storage: storage, 
    limits: {
        fileSize: 20000000
    },
    fileFilter: function (req, file, cb) {
        checkFile(file, cb);
    }
}).single('files');

// Vérifie que les fichiers sont parmis ceux d'extensions acceptées
function checkFile(file, cb) {
    // Définition des extensions authorisées
    let fileExts = ['png', 'jpg', 'jpeg', 'pdf']
    
    // Si on veut vérifier aussi le préfixe MIME (ici on peut pas trop car application/pdf, image/png, etc)
    // let isAllowedMimeType = file.mimetype.startsWith("image/")

    if (fileExts.includes(file.originalname.split('.')[1].toLowerCase())) {
        return cb(null , true)
    }
    else{
        cb('Erreur: Ce type de fichier n\'est pas autorisé !');
    }
}

function generateGUID() {

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
  });
}

// Fonction utilitaire qui vérifie que l'identifiant généré est disponible
/*
function isAvailable(guid) {
    dbHelper.cours.guidAvailable()
        .then(
            guid => {
                guid.value
            },
            err => {

            }
        );
}
*/

// Export du module
module.exports = (passport) => {

    const app = express();

    // Authentification de l'utilisateur
    app.post('/login', function (req, res, next) {
        if (!req.body.username) {
            return res.send({success: false, message: 'empty pseudo'});
        }
        if (!req.body.password) {
            return res.send({success: false, message: 'empty password'});
        }
        passport.authenticate('local', function (err,user) {
            if (err) {
                return next(err); // will generate a 500 error
            }
            if (!user) {
                return res.send({success: false, message: 'authentication failed'});
            }
            req.login(user, function (err) {
                if (err) {
                    return next(err);
                }
                return res.send({success: true, message: 'authentication succeeded'});
            });
        })(req, res, next);
    });

    // Déconnexion de l'utilisateur
    app.get('/logoff', function(req, res) {
        if (req.session.passport.user != undefined ) {
            req.logout();
        }
    });

    app.get('/infos', function (req, res, next) {
        dbHelper.users.infos(req.user.username).then(
            user => {
                res.set('Content-type', 'application/json');
                res.send(JSON.stringify(user));
            },
            err => {
                next(err);
            },
        );
    });

    app.post('/inscription', function (req, res, next) {
        if (!req.body.username) {
            return res.send({success: false, message: 'empty pseudo'});
        }
        if (!req.body.nom) {
            return res.send({success: false, message: 'empty nom'});
        }
        if (!req.body.prenom) {
            return res.send({success: false, message: 'empty prenom'});
        }
        if (!req.body.mail) {
            return res.send({success: false, message: 'empty email'});
        }
        if (!req.body.pwd1) {
            return res.send({success: false, message: 'empty password'});
        }
        if (!req.body.pwd2) {
            return res.send({success: false, message: 'empty password2'});
        }
        var check = {}; // On met toutes nos fonctions dans un objet littéral
        check['username'] = function() {

            if (req.body.username.length <4) {
                return res.send({success: false, message: 'pseudo trop petit'});
            }else{
                return true;
            }
        };

        check['nom'] = function() {

            if (req.body.nom.length <2) {
                return res.send({success: false, message: 'nom trop petit'});
            }else{
                return true;
            }
        };

        check['prenom'] = function() {

            if (req.body.prenom.length <2) {
                return res.send({success: false, message: 'prenom trop petit'});
            }else{
                return true;
            }
        };

        check['mail'] = function() {

            if (!req.body.mail.match(/[a-z]/) || !req.body.mail.match('@') || !req.body.mail.match('.')) {
                return res.send({success: false, message: 'ce nest pas un email'});
            }else{
                return true;
            }
        };

        check['pwd1'] = function() {

            if (req.body.pwd1.length <6 || !req.body.pwd1.match(/[a-z]/) || !req.body.pwd1.match(/[A-Z]/) || !req.body.pwd1.match(/[0-9]/)) {
                return res.send({success: false, message: 'Il manque soit une minuscule, soit une majuscule, soit un chiffre, soit le mdp est inférieur à 6 caractères.'});
            }else{
                return true;
            }
        };

        check['pwd2'] = function() {

            if (req.body.pwd1 != req.body.pwd2){
                return res.send({success: false, message: 'Les mdp ne correspondent pas. '});
            }else{
                return true;
            }
        };


        var result = true;

        for (var i in check) {
            result = check[i](i) && result;
        }

        if (result) {
            dbHelper.users.byEmail(req.body.mail,req.body.username)
            .then(
                user => {
                    if (!user) {
                        //on l'ajoute dans la bdd
                        dbHelper.users.inscr(req.body.nom, req.body.prenom,req.body.username, req.body.mail, req.body.pwd1);
                        return res.send({success: true, message: 'inscription réussie'});                   
                    }
                    else {
                        return res.send({success: false, message: 'identifiants déja utilisés (mail et/ou pseudo)'});
                    }
                },

                err => {
                    next(err);
                },
            );
        }else{
            return res.send({success: false, message: 'mauvais identifiants'});
        }
    });
    
    app.post('/compte', function (req, res, next) {

        if (!req.body.nom) {
            return res.send({success: false, message: 'empty nom'});
        }
        if (!req.body.prenom) {
            return res.send({success: false, message: 'empty prenom'});
        }
        if (!req.body.mail) {
            return res.send({success: false, message: 'empty email'});
        }
        if (!req.body.pwd1) {
            return res.send({success: false, message: 'empty password'});
        }
        if (!req.body.pwd2) {
            return res.send({success: false, message: 'empty password2'});
        }
        var check = {}; // On met toutes nos fonctions dans un objet littéral

        check['nom'] = function() {

            if (req.body.nom.length <2) {
                return res.send({success: false, message: 'nom trop petit'});
            }else{
                return true;
            }
        };

        check['prenom'] = function() {

            if (req.body.prenom.length <2) {
                return res.send({success: false, message: 'prenom trop petit'});
            }else{
                return true;
            }
        };

        check['mail'] = function() {

            if (!req.body.mail.match(/[a-z]/) || !req.body.mail.match('@') || !req.body.mail.match('.')) {
                return res.send({success: false, message: 'ce nest pas un email'});
            }else{
                return true;
            }
        };

        check['pwd1'] = function() {

            if (req.body.pwd1.length <6 || !req.body.pwd1.match(/[a-z]/) || !req.body.pwd1.match(/[A-Z]/) || !req.body.pwd1.match(/[0-9]/)) {
                return res.send({success: false, message: 'Il manque soit une minuscule, soit une majuscule, soit un chiffre, soit le mdp est inférieur à 6 caractères.'});
            }else{
                return true;
            }
        };

        check['pwd2'] = function() {

            if (req.body.pwd1 != req.body.pwd2){
                return res.send({success: false, message: 'Les mdp ne correspondent pas. '});
            }else{
                return true;
            }
        };


        var result = true;

        for (var i in check) {
            result = check[i](i) && result;
        }

        if (result) {
            dbHelper.users.byMail(req.body.mail,dbHelper.users.byPseudo2(req.user.username))
            .then(
                user2 => {
                    if (!user2) {
                        //on l'ajoute dans la bdd
                        dbHelper.users.modif(req.body.nom, req.body.prenom,req.user.username, req.body.mail, req.body.pwd1);
                        return res.send({success: true, message: 'modif réussie'});                   
                    }
                    else {
                        return res.send({success: false, message: 'identifiants déja utilisés (mail et/ou pseudo)'});
                    }
                },
                err => {
                    next(err);
                },          
            );
        } 
        else{
            return res.send({success: false, message: 'mauvais identifiants'});
        }
    });

    // Retourne l'ensemble des cours
    app.get('/lessons', function(req, res, next) {
        dbHelper.lessons.all().then(
            lesson => {
                res.set('Content-type', 'application/json');
                res.send(JSON.stringify(lesson));
            },
            err => {
                next(err);
            },
        );
    });

    app.get('/search', function (req, res, next) {

        dbHelper.lessons.byName(req.query.q).then(
            lesson => {
                res.set('Content-type', 'application/json');
                res.send(JSON.stringify(lesson));
            },
            err => {
                next(err);
            },
        );
    });

    // Retourne le cours d'identifiant donné
    app.get('/lesson/:lesson_id', function (req, res, next) {
        dbHelper.lessons.byId(req.params.lesson_id).then(
            lesson => {

                dbHelper.comments.byLesson(lesson.lesson_id).then(
                    comment => {
                        lesson.comments = comment;
                        console.log(lesson);
                        res.set('Content-type', 'application/json');
                        res.send(lesson);
                    },
                    err => {
                        next(err);
                    }
                );
            },
            err => {
                next(err);
            },
        );
    });

    // Retourne l'ensemble des cours d'un propriétaire donné
    app.get('/user/:user_id/lessons', function(req, res, next) {
        dbHelper.lessons.byOwner(req.params.user_id).then(
            lesson => {
                res.set('Content-type', 'application/json');
                res.send(JSON.stringify(lesson));
            },
            err => {
                next(err);
            },
        );
    });

    app.post('/fileupload', (req, res, next) => {

        upload(req, res, (err) => {

            /*
            // Initialisation de la chaîne contenant le résultat du test
            let result_message;

            // Vérification des paramètres
            let result_check = checkParameters([req.user, req.body.format, req.body.ecole, req.body.note, req.body.type, req.body.nom, req.body.date], result_message);

            if(result_check == false) {
                return res.send({success: false, message: result_message});
            } else {
                console.log('val: ', result_check)
            }
            */

            
            if(!req.user) {
                return res.send({success: false, message: 'no owner'})
            }
            if (!req.body.format) {
                return res.send({success: false, message: 'empty format'});
            }
            if (!req.body.ecole) {
                return res.send({success: false, message: 'empty ecole'});
            }
            if (!req.body.note) {
                return res.send({success: false, message: 'empty note'});
            }
            if (!req.body.type) {
                return res.send({success: false, message: 'empty type'});
            }
            if (!req.body.nom) {
                return res.send({success: false, message: 'empty nom'});
            }
            if (!req.body.date) {
                return res.send({success: false, message: 'empty date'});
            }
            
            if (err) {
                return res.send({success: false, message: err});
            } else if (req.file === undefined) {
                return res.send({success: false, message: 'File is null'});
            }

            // Définition du chemin pour stocker le document
            let file_path = '/public/documents/' + req.file.originalname;

            // Récupération de l'identifiant de l'utilisateur
            dbHelper.users.getId(req.user.username)
                .then(
                    user => {
                        // Ajout du cours
                        dbHelper.cours.add(req.body.ecole, req.body.type, req.body.nom, file_path, user.id, req.body.note, req.body.date, 'texte', req.body.format)
                            .then(
                                file => {
                                    return res.send({success: true, message: 'Fichier envoyé sur le serveur !'});
                                },
                                err => {
                                    next(err);
                                }
                            );
                    },
                    err => {
                        console.log('Impossible de trouver l\'utilisateur');
                    }
                );
        })
    });

    /*
    app.get('/lesson/:lesson_id/comments', function (req, res, next) {
        dbhelper.comments.byLesson(1).then(
            comment => {
                res.set('Content-type', 'application/json');
                res.send(JSON.stringify(lesson));
            },
            err => {
                next(err);
            }
        );
    });
    */

    return app;

}

// Indique si les paramètres sont bien remplis.
// (on pourrait ne pas retourner dès qu'on trouve un paramètre vide pour connaîre l'ensemble des paramètres incorrectement donnés)
function checkParameters(params) {
    params.forEach(function(element) {
        console.log(element)
        if(element === undefined) {
            return false;
        }
    });
}
