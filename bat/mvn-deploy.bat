@echo off
set root=projetsDILA\src\
set projectPath=%~1

cd /D D:\
cd %root%%projectPath%

echo.
echo +--------------------------------+
echo *    Maven Wildfly Deploy        *
echo +--------------------------------+
echo.

call mvn wildfly:deploy -e