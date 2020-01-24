/* eslint-env browser */
/* global Mustache, page */
'use strict';

// Le script principal de notre application single page
// Celui-ci effectue le routing coté client (et d'autres choses)

// Notre objet contexte, qui contiendra toutes les données
// pour les templates Mustache
let context = {'logged': false};

// fonction utilitaire permettant de faire du
// lazy loading (chargement à la demande) des templates
const templates = (() => {
    let templates = {};
    return function load(url) {
        if (templates[url]) {
            return Promise.resolve(templates[url]);
        }
        else {
            return fetch(url)
                .then(res => res.text())
                .then(text => {
                    return templates[url] = text;
                })
        }
    }
})();

// Fonction utilitaire qui permet de charger en parallèle les
// différents "partial" (morceaux de template. Ex: header)
const loadPartials = (() => {
    let partials;

    return async function loadPartials() {
        if (!partials) {
            partials = {
                sidebar_offline: templates('public/templates/sidebar_offline.mustache'),
                sidebar_online: templates('public/templates/sidebar_online.mustache'),
                doc: templates('public/templates/doc_display.mustache'),
            };
            const promises = Object.entries(partials)
                .map(async function ([k, v]) {
                    return [k, await v];
                });
            partials = Object.fromEntries(await Promise.all(promises));
        }
        return partials;
    }
})();

// Route pour la page principale
page('/', async function () {
    if (context.logged) {
        renderTemplate(templates('private/index_online.mustache'), context);
    }
    else {
        renderTemplate(templates('public/templates/index.mustache'), context);
    }
});

// Route pour la page de recherche  
page('lessons', async function () {
   
    // Affiche l'ensemble des fiches de cours par défaut
    renderContent('');

    async function renderContent(keywords) {

        const response = await fetch('api/search?q=' + keywords);
        context.lessons = await response.json();

        if(!context.logged) {
            await renderTemplate(templates('public/templates/search.mustache'), context);
        } else {
            await renderTemplate(templates('private/search_online.mustache'), context);
        }

        let search_button = document.getElementById('submit_search');
        search_button.addEventListener('click', async function () {
            renderContent(document.getElementById('input_search').value);
        });
    }
    // Suppression des données du contexte
    delete context.lessons;
});

// Route pour la page de recherche avancée
page('search_advanced', async function () {

    await renderTemplate(templates('public/templates/search_advanced.mustache'), context);
});

// Route permettant d'enregistrer un utilisateur
page('register', async function () {

    renderSubPage(context);

    // fonction interne d'affichage de la page
    async function renderSubPage(context) {
        // On rend le template
        await renderTemplate(templates('public/templates/register.mustache'), context);

        const sub_btn = document.querySelector('#sub-btn');
        sub_btn.addEventListener('click', async function () {
            // Récupération de toutes les infos entrées

            const username = document.querySelector('#username').value;
            const nom = document.querySelector('#nom').value;
            const prenom = document.querySelector('#prenom').value;
            const mail = document.querySelector('#mail').value;
            const pwd1 = document.querySelector('#pwd1').value;
            const pwd2 = document.querySelector('#pwd2').value;
            let result;
            try {

                result = await fetch('api/inscription', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                    },
                    method: 'POST',
                    body: 'username=' + encodeURIComponent(username) + '&nom=' + encodeURIComponent(nom) + '&prenom=' + encodeURIComponent(prenom) + '&mail=' + encodeURIComponent(mail) + '&pwd1=' + encodeURIComponent(pwd1) + '&pwd2=' + encodeURIComponent(pwd2),
                });
            }
            catch (e) {
                console.error(e);
                return;
            }
            try {
                if (result.ok) {
                    // Si tout s'est bien passé
                    result = await result.json();
                    if (result.success) {
                        alert('inscription réussie ! Vous pouvez maintenant vous connecter');
                        page.redirect('/login');
                    }
                    else {
                        // Sinon on réaffiche la page avec quelques infos pour expliquer ce qui n'a pas marché
                        renderSubPage({...context, message: result.message});
                    }
                }
            }
            catch (e) {
                console.error(e);
                return;
            }
        });
    }
});

// Route permettant d'authentifier un utilisateur
page('login', async function () {

    renderLoginPage(context);

    // fonction interne d'affichage de la page
    async function renderLoginPage(context) {

        // On rend le template
        await renderTemplate(templates('public/templates/login.mustache'), context);

        const login_btn = document.querySelector('#submitConnexion');
        login_btn.addEventListener('click', async function () {

            // Récupération du login et du mot de passe
            const username = document.querySelector('input[placeholder="username"]').value;
            const password = document.querySelector('input[placeholder="password"]').value;
            let result;

            try {
                // Interrogation de l'API avec les valeurs données par l'utilisateur
                result = await fetch('api/login', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                    },
                    method: 'POST',
                    body: 'username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password),
                });
            }
            catch (e) {
                console.error(e);
                return;
            }

            try {
                if (result.ok) {
                    result = await result.json();

                    if (result.success) {

                        context.logged = true;

                        // Si la connexion était demandée pour accéder à une page cible spécifique
                        if(!isEmpty(context.target)) {

                            console.log('Target page : ' + context.target);
                            // Chargement de celle-ci
                            page(context.target);

                            // Comme le contexte est modifiable par le client,
                            // je sais pas si c'est vraiment bien d'utiliser une 'cible'
                            // pour rediriger l'après-connexion

                        } else {

                            // Par défaut, on charge l'index
                            page('/');
                        }
                    }
                    else {
                        page('login');
                    }
                }
            }
            catch (e) {
                console.error(e);
                return;
            }
        });
    }
});

// Route permettant de déconnecter un utilisateur // logout je me suis gourré
page('logoff', async function () {

    fetch('api/logoff');

    context.logged = false;

    page.redirect('/');
});

// Route donnant les détails du compte utilisateur authentifié
page('profile', async function () {

    let response;

    response = await fetch('api/infos');
    context.infos = await response.json();

    renderCompte(context);

    // fonction interne d'affichage de la page
    async function renderCompte(context) {

        // On rend le template
        await renderTemplate(templates('private/profile.mustache'), context);

        const compte_btn = document.querySelector('#submitCompte');
        compte_btn.addEventListener('click', async function () {

            // Récupération de toutes les infos entrées
            const nom = document.querySelector('#nom').value;
            const prenom = document.querySelector('#prenom').value;
            const mail = document.querySelector('#mail').value;
            const pwd1 = document.querySelector('#pwd1').value;
            const pwd2 = document.querySelector('#pwd2').value;

            let result;
            try {

                result = await fetch('api/compte', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                    },
                    method: 'POST',
                    body: 'nom=' + encodeURIComponent(nom) + '&prenom=' + encodeURIComponent(prenom) + '&mail=' + encodeURIComponent(mail) + '&pwd1=' + encodeURIComponent(pwd1) + '&pwd2=' + encodeURIComponent(pwd2),
                });
            }
            catch (e) {
                console.error(e);
                return;
            }
            try {
                if (result.ok) {
                    // Si tout s'est bien passé
                    result = await result.json();
                    if (result.success) {
                        alert('Modification réussie');
                        page('/');
                    }
                    else {
                        alert('erreur');
                        // Sinon on réaffiche la page avec quelques infos pour expliquer ce qui n'a pas marché
                        renderCompte({...context, message: result.message});
                    }
                }
            }
            catch (e) {
                console.error(e);
                return;
            }
        });
    }
});

page('upload', async function () {

    if(context.logged) {

        renderContent(context);

        async function renderContent(context) {

            await renderTemplate(templates('private/upload.mustache'), context);

            const btn = document.querySelector('#add');
            btn.addEventListener('click', async function () {
                
                // Récupération de toutes les infos entrées
                const format = document.querySelector('#format').value;
                const ecole = document.querySelector('#ecole').value;
                const date = document.querySelector('#date').value;
                const type = document.querySelector('#type').value;
                const note = document.querySelector('#note').value;
                const nom = document.querySelector('#nom').value;

                let upload_form = document.getElementById('upload_form');
                let upload_input = document.getElementById('upload_input');
                let response = fetch('api/fileupload');
                // upload_form.action = 'api/fileupload';

                let formData = new FormData(document.getElementById("upload_form"));
                formData.append('files', upload_input.files[0]);
                formData.append('format', encodeURIComponent(format));
                formData.append('ecole', encodeURIComponent(ecole));
                formData.append('date', encodeURIComponent(date));
                formData.append('type', encodeURIComponent(type));
                formData.append('note', encodeURIComponent(note));
                formData.append('nom', encodeURIComponent(nom));

                let result;
                try {
                    result = await fetch('api/fileupload', {
                        method: 'POST',
                        body: formData
                    });
                }
                catch (e) {
                    console.error(e);
                    return;
                }
                try {
                    if (result.ok) {
                        result = await result.json();
                        if (result.success) {
                            alert('ajout réussi');
                            page('/');
                        }
                        else {
                            alert('erreur');
                            renderContent({...context, message: result.message});
                        }
                    }
                }
                catch (e) {
                    console.error(e);
                    return;
                }
            });
        }
    } else {
        // Définition de la page cible après authentification
        context.target = '/upload';
        // Chargement page de connexion
        page.redirect('/login');
    }
});

// Route permettant d'indiquer les détails pour l'ajout de document
page('edit', async function () {
    // Si on n'est pas authentifé, on affiche la page de login
    if (context.logged) {
        renderTemplate(templates('private/doc_edit.mustache'), context);
    } else {
        // Définition de la page cible après authentification
        context.target = '/edit';
        // Chargement page de connexion
        page.redirect('/login');
    }
});

// Route permettant de consulter une fiche de cours
page('lesson', async function () {

    if(context.logged) {

        await renderTemplate(templates('public/templates/lesson.mustache'), context);

        // Suppression des données du contexte
        delete context.lesson;

    } else {
        alert('vous devez vous connecter');

        // Définition de la page cible après authentification
        // context.target = '/lesson'; // Il manque l'id du coup

        // Chargement page de connexion
        page.redirect('/login');
    }
});

// Route pour la page de recherche
page('lesson/:lesson_id', async function (req) {

    // Récupération des données
    let response = await fetch('api/lesson/' + req.params.lesson_id);

    // Mise des données dans le contexte
    context.lesson = await response.json();

    // Vieille méthode pour contourner mon pb de chargement de template
    // En gros dès que j'ai une url avec plus d'un de 'profondeur', page.js pète un câble
    page.redirect('/lesson');
});

// On démarre le routing
page.base(window.location.pathname); // permet d'héberger la page sur une url autre de '/'
page.start();

// fonction utilitaire de rendu d'un template
async function renderTemplate(template, context) {
    // On charge les partials (si pas déà chargés)
    const partials = await loadPartials();
    // On rend le template
    const rendered = Mustache.render(await template, context, partials);
    // Et on l'insère dans le body
    let body = document.querySelector('body');
    body.innerHTML = rendered;
}

function isEmpty(str) {
    return (!str || 0 === str.length);
}