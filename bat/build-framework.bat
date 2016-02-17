@echo off
set version=%1
set isSnapshot=%2
set isBranche=%3
echo.
echo +--------------------------------+
echo *    Framework %version%         *
echo +--------------------------------+
echo.

cd /D D:\
cd projetsDILA\src
if /i %isSnapshot% == true (goto :dir_snapshot) else (goto :dir_release)

:dir_snapshot
if /i %isBranche% == true (cd services-branche\psl-demarche-framework) else (cd Framework)
goto :build_framework

:dir_release
cd "versions services\psl-services-%version%\psl-demarche-framework"
goto :build_framework

:build_framework
echo.
echo +--------------------------------+
echo *    Build Framework             *
echo +--------------------------------+
echo.

call mvn clean install -e