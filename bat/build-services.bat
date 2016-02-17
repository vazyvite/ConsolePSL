@echo off
set version=%1
set isSnapshot=%2
set isBranche=%3
set isStubbed=%4

echo.
echo +--------------------------------+
echo *    Services %version%          *
echo +--------------------------------+
echo.

cd /D D:\
cd projetsDILA\src
if /i %isStubbed% == true (goto :bouchon_stubbed) else (goto :services)

:bouchon_stubbed
echo.
echo +--------------------------------+
echo *    Build Services Stubbed      *
echo +--------------------------------+
echo.
cd bouchons\psl-teledossier-service-stubbed-ejb
call mvn clean install
cd target

echo.
echo +--------------------------------+
echo *    Renommage Services Stubbed  *
echo +--------------------------------+
echo.

rename psl-teledossier-service-stubbed-ejb-%version%.jar psl-teledossier-service-ejb.jar
cd ..\..\..
goto :services

:services
if /i %isSnapshot% == true (goto :dir_snapshot) else (goto :dir_release)

:dir_snapshot
if /i %isBranche% == true (cd services-branche) else (cd services)
goto :build_services

:dir_release
cd "versions services\psl-services-%version%"
goto :build_services

:build_services

echo.
echo +--------------------------------+
echo *    Build Services              *
echo +--------------------------------+
echo.

call mvn clean install
if /i %isStubbed% == true (goto :replace_service_stubbed) else (goto :deploy_ear)

:replace_service_stubbed
echo.
echo +--------------------------------+
echo *    Insersion Services Stubbed  *
echo +--------------------------------+
echo.

cd psl-services-ear\target
call xcopy "D:\projetsDILA\src\bouchons\psl-teledossier-service-stubbed-ejb\target\psl-teledossier-service-ejb.jar" "D:\projetsDILA\src\versions services\psl-services-%version%\psl-services-ear\target"
"C:\Program Files\7-Zip\7z.exe" a -tzip psl-services-ear.ear *.jar
cd ..\..
goto :deploy_ear

:deploy_ear
echo.
echo +--------------------------------+
echo *    Déploiement EAR             *
echo +--------------------------------+
echo.

cd psl-services-ear
call mvn wildfly:undeploy
call mvn wildfly:deploy
cd..
goto :deploy_war

:deploy_war
echo.
echo +--------------------------------+
echo *    Déploiement WAR             *
echo +--------------------------------+
echo.

cd psl-services-war
call mvn wildfly:undeploy
call mvn wildfly:deploy