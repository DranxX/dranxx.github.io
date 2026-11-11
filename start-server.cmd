@echo off
rem Static server untuk preview V0.2.5 di http://127.0.0.1:8421
rem Tutup jendela ini untuk mematikan server.
cd /d "%~dp0"
node "%~dp0server.mjs" "%~dp0" 8421
