/*jslint eqeq: true, plusplus: true, indent: 4*/
/*globals app, require, jQuery, console, alert*/

(function ($) {
	'use strict';

	/**
	 * Objet informations de Démarche.
	 */
	function DemarcheInfos() {
		var that = this;
		that.code = "";
		that.versionServices = "";
		that.versionFramework = "";
	}

	/**
	 * incrémentation de l'étape de chargement
	 * @param {object}  $that  l'objet source
	 * @param {boolean} isInit indique si l'étape doit être réinitialisée
	 */
	function incrementEtape($that, isInit) {
		if (isInit) {
			$that.data("etape", 0);
		} else {
			var etapeChargement = parseInt($that.data("etape"), 10) || 0;
			etapeChargement = etapeChargement + 1;
			$that.data("etape", etapeChargement);
		}
	}

	var DIR_BATCH = "./bat",
		WORKSPACE = "D:\\projetsDILA\\src",
		deployInfos = {
			services: "",
			demarches: []
		},
		ui = {
			/**
			 * Création de la table des démarches
			 */
			creerTableDemarches: function () {
				var $table = $("#listeProjets tbody"),
					$ligne = null,
					$cel2 = null,
					i = 0,
					idDemarche = null,
					demarche = null,
					$cel1 = null,
					$contentInfosDemarche = null,
					$infosDemarche = null;
				$table.children().remove();
				for (i; i < app.data.listeDemarches.length; i++) {
					demarche = app.data.listeDemarches[i];
					idDemarche = "lblDemarche_" + demarche.name;
					$ligne = $("<tr>");

					$cel1 = $("<td>").attr("id", "lblDemarche_" + demarche.name);
					$infosDemarche = $("<details>").appendTo($cel1);
					$("<summary>").text(demarche.name).appendTo($infosDemarche);
					$contentInfosDemarche = $("<div>").addClass("container").appendTo($infosDemarche);
					ui.createFormGroupStatic("version services : ", "", demarche.name, "infosDemarche-vServices").appendTo($contentInfosDemarche);
					ui.createFormGroupStatic("version framework : ", "", demarche.name, "infosDemarche-vFramework").appendTo($contentInfosDemarche);
					$cel1.appendTo($ligne);

					$cel2 = $("<td>");
					$("<button>").attr({
						title: "builder et déployer la démarche " + demarche.name,
						id: "build" + demarche.code,
						'aria-describedby': idDemarche
					}).addClass("btn btn-default build glyphicon glyphicon-send").data({demarche: demarche}).appendTo($cel2);
					$("<button>").attr({
						title: "voir les logs de la démarche " + demarche.name,
						id: "logs" + demarche.code,
						'aria-describedby': idDemarche
					}).addClass("btn btn-default showLogs glyphicon glyphicon-modal-window").data({demarche: demarche}).appendTo($cel2);
					$cel2.appendTo($ligne);
					$ligne.appendTo($table);
				}
			},

			/**
			 * création d'un élément de formulaire form-group-static
			 * @param   {string} label     le label
			 * @param   {string} text      le texte
			 * @param   {string} id        l'identifiant du champ
			 * @param   {string} className la classe associée au champ
			 * @returns {object} l'objet form-group-static
			 */
			createFormGroupStatic: function (label, text, id, className) {
				var $formGroup = $("<div>").addClass("form-group row"),
					$groupField = $("<div>").addClass("col-xs-7");
				$("<label>").addClass("control-label col-xs-5").text(label).attr("for", "input_" + id).appendTo($formGroup);
				$groupField.appendTo($formGroup);
				$("<span>").addClass("form-control-static " + className).text(text).appendTo($groupField);
				return $formGroup;
			},

			/**
			 * Construit les informations de déploiement des démarches.
			 * @param {object} infosDemarche les informations de la démarche en cours de déploiement
			 */
			drawDeployInfosDemarche: function (infosDemarche) {
				var $ul = $("#deploy-info-demarches");
				if (!$ul.find("." + infosDemarche.code).size()) {
					$("<li>").addClass("list-group-item " + infosDemarche.code).text(infosDemarche.code).appendTo($ul);
				}
			},

			/**
			 * Ajoute un loader sur un élément cible
			 * @param {object} $cible la cible du loader
			 */
			addLoader: function ($cible) {
				if ($cible != null) {
					var id = "loader_" + new Date().getTime(),
						$loader = $("<div>").addClass("loader").attr("id", id).css({
							top: $cible.offset().top,
							left: $cible.offset().left,
							width: $cible.outerWidth(),
							height: $cible.outerHeight()
						}).data({
							cible: $cible
						}).appendTo("body");
					$cible.data("loader", id);
				}
			},

			/**
			 * Modifie la position et la taille du loader.
			 * @param {object} $cible la cible du loader
			 */
			modifyLoader: function ($cible) {
				if ($cible != null) {
					var $loader = $("#" + $cible.data("loader"));
					$loader.css({
						top: $cible.offset().top,
						left: $cible.offset().left,
						width: $cible.outerWidth(),
						height: $cible.outerHeight()
					})
				}
			},

			/**
			 * Supprime un loader de l'élément cible
			 * @param {object} $cible la cible du loader
			 */
			removeLoader: function ($cible) {
				if ($cible != null) {
					var loader = $("#" + $cible.data("loader"));
					loader.remove();
					$cible.data("loader", null);
				}
			}
		},
		utils = {
			/**
			 * Indique si l'option "Générer le service Stubbed" a été activé
			 * @returns {boolean}
			 */
			isStubbed: function () {
				return ($("#isStubbed").is(":checked")) ? true : false;
			},

			/**
			 * Indique si la version est une snapshot ou une release
			 * @param   {string}  version la version à tester
			 * @returns {boolean}
			 */
			isSnapshot: function (version) {
				return (version.match(/SNAPSHOT/ig)) ? true : false;
			},

			/**
			 * Indique si on doit aller chercher le projet sur la branche ou sur le tronc
			 * @param   {string}  version la version du projet
			 * @returns {boolean}
			 */
			isBranche: function (version) {
				return (version.match(/^1\.0/ig)) ? true : false;
			},

			/**
			 * Créé une erreur et supprime le loader.
			 * @param {object} $that  l'objet sur lequel l'erreur a eu lieu
			 * @param {string} stdout les logs d'erreur
			 */
			createErreur: function ($that, log) {
				$that.parents("tr:first").data("logs", $that.data("logs") + "\n" + log).removeClass("success").addClass("danger");
				ui.removeLoader($that.parents("tr:first"));
			},

			/**
			 * Créé un log
			 * @param {object} $that l'objet source
			 * @param {string} logs  les logs à ajouter
			 */
			createLog: function ($that, logs) {
				var $element = $that.parents("tr:first");
				$element.data("logs", $that.data("logs") + "\n" + logs);
			},

			/**
			 * Récupération du chemin des services en fonction de la branche / tronc et snapshot / release
			 * @param   {object} infosDemarche informations sur la démarche à déployer
			 * @returns {string} le chemin du projet services
			 */
			getServicesPath: function (infosDemarche) {
				var path = "";
				if (utils.isSnapshot(infosDemarche.versionServices)) {
					path = (utils.isBranche(infosDemarche.versionServices)) ? "services-branche" : "services";
				} else {
					path = "versions services\\psl-services-" + infosDemarche.versionServices;
				}
				return path;
			},

			/**
			 * Récupération du chemin du framework en fonction de la branche / tronc et snapshot / release
			 * @param   {object} infosDemarche informations sur la démarche à déployer
			 * @returns {string} le chemin du projet services
			 */
			getFrameworkPath: function (infosDemarche) {
				var path = "";
				if (utils.isSnapshot(infosDemarche.versionFramework)) {
					path = (utils.isBranche(infosDemarche.versionFramework)) ? "services-branche\\psl-demarche-framework" : "Framework";
				} else {
					path = "versions services\\psl-services-" + infosDemarche.versionFramework + "\\psl-demarche-framework";
				}
				return path;
			},

			/**
			 * Avance la barre de chargement.
			 * @param {object} $cible l'objet correspondant à la ligne pour laquelle le loader doit être avancé
			 */
			avanceLoader: function ($cible) {
				if ($cible != null) {
					incrementEtape($cible, false);
					var $parent = $cible.parents("tr:first"),
						etape = $cible.data("etape"),
						loader = $("#" + $parent.data("loader")),
						progressbar = loader.find(".progressbar"),
						pasAvancement = 100 / 18;
					if (!progressbar.size()) {
						$("<div>").addClass("progressbar").appendTo(loader);
						progressbar = loader.find(".progressbar");
					}
					progressbar.css("width", (pasAvancement * etape) + "%");
				}
			}
		},
		bat = {
			/**
			 * Joue un maven clean sur le chemin
			 * @param {object}   $that    l'objet source
			 * @param {string}   path     le chemin du projet à cleaner
			 * @callback	callback
			 */
			clean: function ($that, path, callback) {
				require('child_process').exec('cmd /c mvn-clean.bat "' + path + '"', {
					cwd: DIR_BATCH
				}, function (err, stdout, stderr) {
					if (err) {
						utils.createErreur($that, stdout);
					} else if ($.isFunction(callback)) {
						utils.createLog($that, stdout);
						callback();
					}
				});
			},

			/**
			 * Joue un maven install sur le chemin
			 * @param {object} $that l'objet source
			 * @param {string} path  le chemin du projet à installer
			 * @callback callback
			 */
			install: function ($that, path, callback) {
				require('child_process').exec('cmd /c mvn-install.bat "' + path + '"', {
					cwd: DIR_BATCH,
					maxBuffer: 1024 * 500
				}, function (err, stdout, stderr) {
					if (err) {
						utils.createErreur($that, stdout);
					} else {
						utils.createLog($that, stdout);
						if ($.isFunction(callback)) {
							callback();
						}
					}
				});
			},

			/**
			 * Joue un maven wildfly:undeploy sur le chemin
			 * @param {object} $that l'objet source
			 * @param {string} path  le chemin du projet à undeployer
			 * @callback callback
			 */
			undeploy: function ($that, path, callback) {
				require('child_process').exec('cmd /c mvn-undeploy.bat "' + path + '"', {
					cwd: DIR_BATCH
				}, function (err, stdout, stderr) {
					if (err) {
						utils.createErreur($that, stdout);
					} else {
						utils.createLog($that, stdout);
						if ($.isFunction(callback)) {
							callback();
						}
					}
				});
			},

			/**
			 * Joue une maven wildfly:deploy sur le chemin
			 * @param {object} $that l'objet source
			 * @param {string} path  le chemin du projet à déployer
			 * @callback callback
			 */
			deploy: function ($that, path, callback) {
				require('child_process').exec('cmd /c mvn-deploy.bat "' + path + '"', {
					cwd: DIR_BATCH,
					maxBuffer: 1024 * 500
				}, function (err, stdout, stderr) {
					if (err) {
						utils.createErreur($that, stdout);
					} else {
						utils.createLog($that, stdout);
						if ($.isFunction(callback)) {
							callback();
						}
					}
				});
			},

			/**
			 * Modifie le pom du projet stubbed pour le faire correspondre à la version des services à déployer
			 * @param {object} infosDemarche les informations de la démarche
			 * @param {object} $that         objet correspondant à la démarche en cours de déploiement
			 * @param {string} path          le chemin vers le service stubbed
			 * @callback	callback
			 */
			modifyStubbedPom: function (infosDemarche, $that, path, callback) {
				var fs = require("fs");
				fs.readFile(WORKSPACE + "\\" + path + "\\pom.xml", "utf8", function (err, data) {
					if (err) {
						utils.createErreur($that, err);
					} else {
						var result = data.replace(/<version>([0-9a-zA-Z\.\-]+)<\/version>/i, "<version>" + infosDemarche.versionServices + "<\/version>");
						fs.writeFile(WORKSPACE + "\\" + path + "\\pom.xml", result, 'utf8', function (err) {
							if (err) {
								utils.createErreur($that, err);
							} else if ($.isFunction(callback)) {
								callback();
							}
						});
					}
				});
			},

			/**
			 * Joue le traitement de copie et d'intégration du service stubbé dans l'ear des services
			 * @param {object} infosDemarche les informations de la demarche à déployer
			 * @param {object} $that         l'objet source
			 * @callback callback
			 */
			copyStubbedService: function (infosDemarche, $that, callback) {
				var path = "bouchons\\psl-teledossier-service-stubbed-ejb",
					pathService = utils.getServicesPath(infosDemarche);
				if (utils.isStubbed()) {
					require('child_process').exec('cmd /c copyStubbed.bat "' + path + '" "' + pathService + '" "' + infosDemarche.versionServices + '"', {
						cwd: DIR_BATCH
					}, function (err, stdout, stderr) {
						if (err) {
							utils.createErreur($that, stdout);
						} else {
							utils.createLog($that, stdout);
							if ($.isFunction(callback)) {
								callback();
							}
						}
					});
				} else if ($.isFunction(callback)) {
					callback();
				}
			},

			/**
			 * Récupère les informations du POM de la démarche pour déterminer les versions des services et du framework
			 * @param {object} infosDemarche les informations de la démarche à déployer
			 * @param {object} $that         l'objet source
			 * @callback  callback
			 */
			getInfosPOM: function (infosDemarche, $that, callback) {
				var fs = require("fs");
				fs.readFile(WORKSPACE + '\\' + infosDemarche.code + '\\pom.xml', 'utf8', function (err, data) {
					var patternVersionServices = /<version\.services\-PSL>([a-zA-Z0-9\.\-]*)<\/version\.services\-PSL>/ig,
						patternVersionFramework = /<version\.framework\-PSL>([a-zA-Z0-9\.\-]*)<\/version\.framework\-PSL>/ig,
						matchVersionServices = 0,
						matchVersionFramework = 0;
					if (err) {
						utils.createErreur($that, err);
					} else {
						matchVersionFramework = patternVersionFramework.exec(data);
						matchVersionServices = patternVersionServices.exec(data);
						infosDemarche.versionFramework = matchVersionFramework[1];
						infosDemarche.versionServices = matchVersionServices[1];
						if ($.isFunction(callback)) {
							callback();
						}
					}
				});
			}
		};

	/**
	 * Scénario de traitement du services stubbé
	 * - mvn clean
	 * - mvn install
	 * @param {object}   infosDemarche informations sur la démarche à déployer
	 * @param {object}   $that         objet source
	 * @callback callback
	 */
	function stubbedService(infosDemarche, $that, callback) {
		if (utils.isStubbed() && infosDemarche.versionServices != deployInfos.services) {
			var path = "bouchons\\psl-teledossier-service-stubbed-ejb";
			bat.modifyStubbedPom(infosDemarche, $that, path, function () {
				utils.avanceLoader($that);
				bat.clean($that, path, function () {
					utils.avanceLoader($that);
					bat.install($that, path, function () {
						utils.avanceLoader($that);
						if ($.isFunction(callback)) {
							callback();
						}
					});
				});
			});
		} else if ($.isFunction(callback)) {
			callback();
		}
	}

	/**
	 * Joue le scénario de déploiement des services
	 * - mvn clean
	 * - mvn install
	 * - intégration des services stubbés
	 * - mvn wildfly:undeploy
	 * - mvn wildfly:deploy
	 * @param {object}   infosDemarche les informations de la démarche à déployer
	 * @param {object}   $that         l'objet source
	 * @callback callback
	 */
	function services(infosDemarche, $that, callback) {
		if (infosDemarche.versionServices != deployInfos.services) {
			var path = utils.getServicesPath(infosDemarche);
			// mvn clean
			bat.clean($that, path, function () {
				utils.avanceLoader($that);
				// mvn install
				bat.install($that, path, function () {
					utils.avanceLoader($that);
					// traitement de la copie des services stubbed dans l'ear des services
					bat.copyStubbedService(infosDemarche, $that, function () {
						utils.avanceLoader($that);
						var pathEAR = path + "\\psl-services-ear";
						// mvn wildfly:undeploy (ear)
						bat.undeploy($that, pathEAR, function () {
							utils.avanceLoader($that);
							// mvn wildfly:deploy (ear)
							bat.deploy($that, pathEAR, function () {
								utils.avanceLoader($that);
								var pathWAR = path + "\\psl-services-war";
								// mvn wildfly:undeploy (war)
								bat.undeploy($that, pathWAR, function () {
									utils.avanceLoader($that);
									// mvn wildfly:deploy (war)
									bat.deploy($that, pathWAR, function () {
										utils.avanceLoader($that);
										deployInfos.services = infosDemarche.versionServices;
										$("#deploy-info-services").text(deployInfos.services);
										if ($.isFunction(callback)) {
											callback();
										}
									});
								});
							});
						});
					});
				});
			});
		} else if ($.isFunction(callback)) {
			callback();
		}
	}

	/**
	 * Scénario de déploiement du framework
	 * @param {object}   infosDemarche les informations de la démarche à déployer
	 * @param {object}   $that         l'objet source
	 * @callback callback
	 */
	function framework(infosDemarche, $that, callback) {
		var path = utils.getFrameworkPath(infosDemarche);
		bat.clean($that, path, function () {
			utils.avanceLoader($that);
			bat.install($that, path, function () {
				utils.avanceLoader($that);
				if ($.isFunction(callback)) {
					callback();
				}
			});
		});
	}

	/**
	 * Scénario de déploiement de la démarche
	 * - mvn clean
	 * - mvn install
	 * - mvn wildfly:undeploy
	 * - mvn wildfly:deploy
	 * @param {object}   infosDemarche les informations de la démarche à deployer
	 * @param {object}   $that         l'objet source
	 * @callback callback
	 */
	function demarche(infosDemarche, $that, callback) {
		var path = infosDemarche.code;
		// mvn clean
		bat.clean($that, path, function () {
			utils.avanceLoader($that);
			// mvn install
			bat.install($that, path, function () {
				utils.avanceLoader($that);
				// mvn wildfly:undeploy
				bat.undeploy($that, path, function () {
					utils.avanceLoader($that);
					// mvn wildfly:deploy
					bat.deploy($that, path, function () {
						utils.avanceLoader($that);
						if ($.inArray(infosDemarche.code, deployInfos.demarches) == -1) {
							deployInfos.demarches.push(infosDemarche.code);
							ui.drawDeployInfosDemarche(infosDemarche);
						}
						$that.parents("tr:first").removeClass("danger").addClass("success");
						ui.removeLoader($that.parents("tr:first"));
						if ($.isFunction(callback)) {
							callback();
						}
					});
				});
			});
		});
	}

	$(function () {
		// initialisation de la page
		if (app != null && app.data != null && app.data.listeDemarches != null && app.data.listeDemarches.length) {
			ui.creerTableDemarches();
		}
		// mise en place des évènements
		$("body").on("click", "#listeProjets .build", function () {
			var $that = $(this),
				data_demarche = $that.data("demarche"),
				infosDemarche = new DemarcheInfos();
			if (data_demarche != null) {
				ui.addLoader($that.parents("tr:first"));
				infosDemarche.code = data_demarche.dir;
				incrementEtape($that, true);
				// récupération des informations du POM de la démarche
				bat.getInfosPOM(infosDemarche, $that, function () {
					utils.avanceLoader($that);
					// traitement des services stubbeds
					stubbedService(infosDemarche, $that, function () {
						// traitement des services
						services(infosDemarche, $that, function () {
							// traitement du framework
							framework(infosDemarche, $that, function () {
								// traitement de la démarche
								demarche(infosDemarche, $that, null);
							});
						});
					});
				});
			} else {
				alert("La démarche n'existe pas");
			}
		}).on("click", "#listeProjets .showLogs", function () {
			var $that = $(this),
				logs = $that.parents("tr:first").data("logs");
			$("#modalLogs").data("cible", $that.parents("tr:first")).modal("show").find(".modal-body").html(logs);
		}).on("click", "#cleanLogs", function () {
			var $ligneDemarche = $("#modalLogs").data("cible");
			if ($ligneDemarche != null) {
				$ligneDemarche.data("logs", null);
			}
			$("#modalLogs").modal("hide").data("cible", null);
		}).on("click", "[data-dismiss='modal']", function () {
			$("#modalLogs").data("cible", null);
		}).on("click", "summary", function () {
			var $that = $(this),
				demarche = $that.parents("tr").find(".build").data("demarche"),
				infosDemarche = new DemarcheInfos();
			if (demarche != null) {
				infosDemarche.code = demarche.dir;
				bat.getInfosPOM(infosDemarche, $that, function () {
					$that.parents("details").find(".infosDemarche-vServices").text(infosDemarche.versionServices);
					$that.parents("details").find(".infosDemarche-vFramework").text(infosDemarche.versionFramework);
				});
			}
			setTimeout(function () {
				$(".loader").each(function () {
					var $cible = $(this).data("cible");
					ui.modifyLoader($cible);
				});
			}, 10);
		});
		$(document).on("resize", function () {
			$(".loader").each(function () {
				var $cible = $(this).data("cible");
				if ($cible != null) {
					ui.removeLoader($cible);
					ui.addLoader($cible);
				}
			});
		});
	});
}(jQuery));
