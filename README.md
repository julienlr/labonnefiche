# La Bonne Fiche

Ce projet contient le programme permettant de lancer le site La Bonne Fiche.
La Bonne fiche est le site correspondant au sujet 3 : Partage de notes de cours.


## Auteurs

COHORTE 3 Groupe B

* **Alan Le Verge - INFO3 G3**
*  **Thomas Vuillemin - INFO3 G3**
*  **Julien Le Roux - INFO3 G2**
*  **Guillaume Alves Da Motta Da Cruz - INFO3 G2**


Pour voir la liste des contributeurs : [contributors](https://gitlab.univ-nantes.fr/webs6_grp3b/app-web-s6/graphs/master)


## Points d'entrée (API RESTFUL)

```
* /search : recherche de notes de cours
* /search_advanced : recherche avancée
* /register : page d'inscription
* /login : page de connexion
* /logoff : déconnexion
* /profile : page du compte de l'utilisateur
* /upload : page d'ajout d'une note sur le site
* /lesson : page pour voir les notes de cours
* /lesson/:lesson_id : page pour voir une note spécifique

```

## Dépendances

```
Pour pouvoir mettre en ligne une note de cours, il faut forcément être inscrit et connecté au site.
Pour pouvoir rechercher une note, il est possible de le faire hors connexion.
Pour pourvoir consulter une note de cours, il est obligatoire d'être connecté.

```

## Base de données

```
Le fichier CreateDB.sql contient toute la base de données que le groupe précédent avait configurer.
Nous avons créé le fichier LaBonneFiche.db grâce à sqlite pour contenir tous les éléments créés via la base de données.
```


## Tester le projet

Pour tester le projet et lancer le site, vous devez :

```
Pour tester le projet en local :

1. Télécharger le dossier : git clone https://gitlab.univ-nantes.fr/webs6_grp3b/app-web-s6.git

2. Se déplacer dans le dossier app-web-s6 et lancer npm install

3. Lancer npm start

4. Copier l'URL affiché dans votre navigateur



Pour tester le projet sur le serveur :


1. Télécharger le dossier : git clone https://gitlab.univ-nantes.fr/webs6_grp3b/app-web-s6.git

2. Se déplacer dans le dossier app-web-s6 et lancer npm install

3. Faire un git checkout serveur

4. Pour créer un processeur NomDeMonApp : pm2 start server.js --name NomDeMonApp

5. Pour lancer le lien : copier l'url dans votre navigateur :

6. Pour voir le status de A : pm2 status A

7. Pour Stop A : pm2 stop A

8. Pour restart A : pm2 restart A

9. Pour supprimer A : pm2 delete A

```
## Note importante

La branche master ne marche pas sur le serveur de polytech. Nous avons donc créer une nouvelle branch (master_server) afin de modifier les fichiers pour que cela fonctionne sur le server.
Le master ne fonctionne donc qu'en local et master_server sur le server polytech. Il est possible qu'il manque quelque fonctionnalité sur le server polytech.

## Notre rapport de projet

Pour avoir notre rapport de projet : [Rapport](https://gitlab.univ-nantes.fr/webs6_grp3b/app-web-s6/blob/master/Rapport_d_exp%C3%A9rience_d%C3%A9veloppement.pdf)

## Langages utilisés

* HTML/CSS
* Javascript
* SQL