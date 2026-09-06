@echo off
cd /d "%~dp0.."
python tools\book_reader.py serve --build
