@echo off
set root=projetsDILA\src\
set projectPath=%~1
set isEAR=%2

cd /D D:\
cd %root%%projectPath%

echo.
echo +--------------------------------+
echo *    Maven Wildfly Deploy        *
echo +--------------------------------+
echo.

if %isEAR% == true (goto deploy_service) else (goto deploy_simple)

:deploy_simple
call mvn wildfly:deploy -e
goto :EOF

:deploy_service
%JBOSS_HOME%\bin\jboss-cli.bat --connect --command="deploy --force target\psl-services-ear.ear"
goto :EOF