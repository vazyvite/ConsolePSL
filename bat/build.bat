@echo off
set demarche=%1
echo.
echo +--------------------------------+
echo *    Démarche %demarche%         *
echo +--------------------------------+
echo.

cd /D D:\
cd projetsDILA\src\
goto :build_demarche

:build_demarche
echo.
echo +--------------------------------+
echo *    Build de la démarche        *
echo +--------------------------------+
echo.

cd %demarche%
call mvn clean install -e
goto :deploy_demarche

:deploy_demarche
echo.
echo +--------------------------------+
echo *    Déploiement de la démarche  *
echo +--------------------------------+
echo.

call mvn wildfly:undeploy -e
call mvn wildfly:deploy -e