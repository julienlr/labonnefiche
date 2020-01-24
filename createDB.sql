
drop table if exists Commentaire;
drop table if exists Cours;
drop table if exists User;
drop table if exists Ecole;
drop table if exists typeCours;
drop table if exists Format;


create table Ecole
(
    idEcole integer primary key,
    nomEcole text
);

create table User
(
    id integer primary key,
    nom text not null,
    prenom text,
    pseudo text not null,
    mail text,
    type integer,
    password text
);

create table typeCours
(
    idType integer primary key,
    nom text not null
);

create table Format
(
    idFormat integer primary key,
    nomFormat text not null,
    extension text not null,
    chemin text not null
);

create table Cours
(
    idCours integer primary key,
    idEcole integer,
    typeCours integer,
    nom text,
    URL text,
    idCreateur integer,
    note integer(10),
    dateCours date(10),
    tags text,
    idFormat integer,
    foreign key (idEcole) references Ecole(idEcole),
    foreign key (idCreateur) references User(id),
    foreign key (idFormat) references Format(idFormat),
    foreign key (typeCours) references typeCours(idType)

);

create table Commentaire
(
    idCommentaire integer primary key,
    idAuteur integer not null,
    idCours integer not null,
    commentaire text,
    dateCommentaire date(10),
    foreign key (idAuteur) references User(id),
    foreign key (idCours) references Cours(idCours)
);



insert into Ecole (nomEcole) values
    ('Polytech'),
    ('IMT'),
    ('Ecole Design'),
    ('Ecole Du Bois'),
    ('Ecole Vétérinaire');

insert into User (nom, prenom, pseudo, mail, type, password) values
    ('Dubois', 'Maxime', 'admin', 'maximedb@gmail.com', 1, 'admin'),
    ('Dupont', 'Clara', 'cdp', 'claradp@gmail.com', 1, '121212'),
    ('Laroche', 'Philippe', 'pl', 'philippel@hotmail.fr', 0, '454545');

insert into typeCours (nom) values
    ('Informatique'),
    ('Materiaux'),
    ('Electricite'),
    ('Energetique'),
    ('Genie civil'),
    ('Maths'),
    ('Mecanique');

insert into Format (nomFormat, extension, chemin) values
    ('pdf', '.pdf', '/public/images/doc_types/pdf.png'),
    ('jpg', '.jpg', '/public/images/doc_types/jpg.png'),
    ('png', '.png', '/public/images/doc_types/png.png'),
    ('texte', '.txt', '/public/images/doc_types/txt.png');

insert into Cours (idEcole, typeCours, nom, URL, idCreateur, note, dateCours, tags, idFormat) values
    ( 2, 2, 'Les variables C++', 'blabla', 1, 12, '2/2/2019', 'debutant', 1),
    (1, 5, 'Demonstration Taylor Reste Integral', 'blabla', 2, 10, '24/04/2019', 'maths', 1),
    (3, 6, 'Mecanique du point', 'blabla', 1, 8, '11/03/2019', 'meca', 1);


insert into Commentaire (idAuteur, idCours, commentaire, dateCommentaire) values
    (1, 1, 'Salut', '16/05/2019'),
    (2, 1, 'Super demonstration. Simple et plutôt facile à assimiler', '17/05/2019'),
    (1, 2, 'Document très complet', '18/05/2019');

/* Reste à ajouter les contraintes qui nous sembleront necessaires par la suite */


