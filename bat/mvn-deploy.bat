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
call mvn wildfly:deploy -e -beforeDeployment "C:\Program Files\7-Zip\7z.exe" a -tzip target\psl-services-ear.ear *.jar
goto :EOF