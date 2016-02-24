@echo off
set dirName=PSLConsole
cd %USERPROFILE%
if not exist %dirName% goto creerDirectory

:creerDirectory
mkdir %dirName%

echo "%USERPROFILE%\%dirName%"