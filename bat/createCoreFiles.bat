@echo off
set dirName=PSLConsole
set fileName=%1
cd "%USERPROFILE%"
if not exist %dirName% mkdir %dirName%
cd %dirName%
if not exist %fileName% goto createFile
goto :EOF

:createFile
type NUL > %fileName%
echo {} > %fileName%