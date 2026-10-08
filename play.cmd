@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 (
  node serve.mjs
) else (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" serve.mjs
  ) else (
    echo Node.js is required. Install Node.js and run this file again.
    pause
  )
)
