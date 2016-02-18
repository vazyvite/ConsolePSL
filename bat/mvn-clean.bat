@echo off
set root=projetsDILA\src\
set projectPath=%~1

cd /D D:\
cd %root%%projectPath%

echo.
echo +--------------------------------+
echo *    Maven Clean			      *
echo +--------------------------------+
echo.

call mvn clean -e