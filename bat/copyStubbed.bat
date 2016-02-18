@echo off
set root=projetsDILA\src\
set projectPath=%~1
set pathServices=%~2
set version=%~3

cd /D D:\
cd %root%%projectPath%\target

echo.
echo +--------------------------------+
echo *    Renommage Services Stubbed  *
echo +--------------------------------+
echo.
rename psl-teledossier-service-stubbed-ejb-%version%.jar psl-teledossier-service-ejb.jar

echo.
echo +--------------------------------+
echo *    Copie Services Stubbed 	  *
echo +--------------------------------+
echo.
call xcopy "psl-teledossier-service-ejb.jar" "D:\%root%%pathServices%\psl-services-ear\target"

echo.
echo +--------------------------------+
echo *    Replace Services Stubbed 	  *
echo +--------------------------------+
echo.
cd /D D:\
cd "%root%%pathServices%\psl-services-ear\target"
"C:\Program Files\7-Zip\7z.exe" a -tzip psl-services-ear.ear *.jar

echo.
echo +--------------------------------+
echo *    Supprime Services Stubbed   *
echo +--------------------------------+
echo.
del psl-teledossier-service-ejb.jar