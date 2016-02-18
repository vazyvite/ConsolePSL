@echo off
set root=projetsDILA\src\
set projectPath=%~1

cd /D D:\
cd %root%%projectPath%

echo.
echo +--------------------------------+
echo *    Maven Install			      *
echo +--------------------------------+
echo.

call mvn install -e